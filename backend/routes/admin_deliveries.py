"""Admin delivery-request lifecycle: rider assignment and status transitions."""
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from database import db
from emails import send_notification_email
from models import AssignRider, StatusUpdate
from notifications import notify_admins, notify_merchant_by_id, notify_rider_by_id
from security import get_admin_user

router = APIRouter()


@router.patch("/admin/delivery-requests/{delivery_id}/assign")
async def assign_delivery_to_rider(delivery_id: str, data: AssignRider, admin: dict = Depends(get_admin_user)):
    delivery = await db.delivery_requests.find_one({"id": delivery_id}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    rider = await db.riders.find_one({"id": data.livreur_id}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Livreur non trouvé")

    if rider['status'] != 'accepte':
        raise HTTPException(status_code=400, detail="Ce livreur n'est pas encore validé")

    await db.delivery_requests.update_one(
        {"id": delivery_id},
        {"$set": {
            "status": "assigne",
            "livreur_id": rider['id'],
            "livreur_nom": f"{rider['prenom']} {rider['nom']}",
            "assigned_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    await db.riders.update_one(
        {"id": data.livreur_id},
        {"$inc": {"livraisons_en_cours": 1}}
    )

    html = f"""
    <h2>🚚 Nouvelle Livraison Assignée</h2>
    <p>Bonjour {rider['prenom']},</p>
    <p>Une nouvelle livraison vous a été assignée :</p>
    <ul>
        <li><strong>Client:</strong> {delivery['nom']}</li>
        <li><strong>Téléphone:</strong> {delivery['telephone']}</li>
        <li><strong>Enlèvement:</strong> {delivery['zone_enlevement']}</li>
        <li><strong>Livraison:</strong> {delivery['zone_livraison']}</li>
        <li><strong>Type:</strong> {delivery['type_colis']}</li>
        <li><strong>Urgence:</strong> {delivery['urgence']}</li>
    </ul>
    <p>Connectez-vous à votre espace livreur pour accepter ou refuser cette livraison.</p>
    <p>Cordialement,<br>L'équipe GoLiv Logistique</p>
    """
    await send_notification_email("🚚 Nouvelle livraison assignée", html, rider['email'])

    # In-app: notify rider of assignment
    await notify_rider_by_id(
        rider_id=rider['id'],
        type="delivery_assigned",
        title="Nouvelle livraison assignée",
        message=f"{delivery['tracking_number']} • {delivery['zone_enlevement']} → {delivery['zone_livraison']}",
        link="/espace-livreur"
    )

    return {"success": True, "message": f"Livraison assignée à {rider['prenom']} {rider['nom']}"}


@router.patch("/admin/delivery-requests/{delivery_id}/status")
async def update_delivery_status(delivery_id: str, data: StatusUpdate, admin: dict = Depends(get_admin_user)):
    delivery = await db.delivery_requests.find_one({"id": delivery_id}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    old_status = delivery.get('status')
    new_status = data.status
    update_data = {
        "status": new_status,
        "last_status_update": datetime.now(timezone.utc).isoformat()
    }

    if delivery.get('livreur_id'):
        rider_id = delivery['livreur_id']

        if old_status == "livre" and new_status != "livre":
            await db.riders.update_one(
                {"id": rider_id},
                {"$inc": {"total_livraisons": -1, "livraisons_en_cours": 1}}
            )
            update_data["completed_at"] = None

        elif old_status != "livre" and new_status == "livre":
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
            await db.riders.update_one(
                {"id": rider_id},
                {"$inc": {"total_livraisons": 1, "livraisons_en_cours": -1}}
            )

        elif new_status == "annule" and old_status in ["assigne", "en_cours"]:
            await db.riders.update_one(
                {"id": rider_id},
                {"$inc": {"livraisons_en_cours": -1}}
            )

        elif old_status == "annule" and new_status in ["assigne", "en_cours"]:
            await db.riders.update_one(
                {"id": rider_id},
                {"$inc": {"livraisons_en_cours": 1}}
            )

    if new_status == "nouveau":
        update_data["livreur_id"] = None
        update_data["livreur_nom"] = None
        update_data["assigned_at"] = None
        update_data["completed_at"] = None

        if delivery.get('livreur_id') and old_status in ["assigne", "en_cours"]:
            await db.riders.update_one(
                {"id": delivery['livreur_id']},
                {"$inc": {"livraisons_en_cours": -1}}
            )

    await db.delivery_requests.update_one(
        {"id": delivery_id},
        {"$set": update_data}
    )

    # In-app: notify merchant (if any) and rider (if any) on status change
    if old_status != new_status:
        status_labels = {
            "nouveau": "Nouvelle",
            "assigne": "Assignée",
            "en_cours": "En cours",
            "livre": "Livrée",
            "annule": "Annulée"
        }
        label = status_labels.get(new_status, new_status)
        tracking = delivery.get("tracking_number", "")

        if delivery.get("merchant_id"):
            await notify_merchant_by_id(
                merchant_id=delivery["merchant_id"],
                type="status_changed",
                title=f"Livraison {label.lower()}",
                message=f"{tracking} • {delivery.get('zone_livraison', '')}",
                link="/espace-commercant"
            )
        if delivery.get("livreur_id"):
            await notify_rider_by_id(
                rider_id=delivery["livreur_id"],
                type="status_changed",
                title=f"Statut mis à jour: {label}",
                message=f"{tracking} • {delivery.get('zone_livraison', '')}",
                link="/espace-livreur"
            )

        # Email notifications for important status changes
        if new_status == "en_cours":
            # Notify customer that delivery is in progress
            html = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
                <h2 style="color: #0ea5e9;">🚚 Votre livraison est en route !</h2>
                <p><strong>Numéro de suivi:</strong> {tracking}</p>
                <p>Votre colis est maintenant en cours de livraison vers <strong>{delivery.get('zone_livraison', '')}</strong>.</p>
                <p>Livreur: <strong>{delivery.get('livreur_nom', 'Non assigné')}</strong></p>
                <p style="margin-top: 20px;">
                    <a href="{os.environ.get('REACT_APP_BACKEND_URL', '')}"
                       style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                        Suivre ma livraison
                    </a>
                </p>
            </div>
            """
            await send_notification_email(f"🚚 {tracking} - En cours de livraison", html)

        elif new_status == "livre":
            # Notify customer that delivery is complete
            html = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f0fdf4; border-radius: 16px;">
                <h2 style="color: #22c55e;">✅ Livraison effectuée !</h2>
                <p><strong>Numéro de suivi:</strong> {tracking}</p>
                <p>Votre colis a été livré avec succès à <strong>{delivery.get('zone_livraison', '')}</strong>.</p>
                {f'<p><strong>Notes:</strong> {delivery.get("delivery_notes", "")}</p>' if delivery.get("delivery_notes") else ''}
                <p style="margin-top: 20px;">Merci d'avoir choisi GoLiv !</p>
                <p>
                    <a href="{os.environ.get('REACT_APP_BACKEND_URL', '')}/donner-avis"
                       style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                        Donner votre avis
                    </a>
                </p>
            </div>
            """
            await send_notification_email(f"✅ {tracking} - Livraison effectuée", html)

    return {"success": True, "message": f"Statut mis à jour: {new_status}"}

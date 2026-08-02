"""Merchant dashboard endpoints: profile, deliveries, stats, notes, CSV export."""
import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from database import db
from emails import send_notification_email
from models import DeliveryNoteUpdate, DeliveryRequest, MerchantDeliveryCreate
from notifications import notify_admins
from pricing import calculate_delivery_price, get_next_tracking_number
from security import get_current_user

router = APIRouter()


@router.get("/merchant/deliveries")
async def get_merchant_deliveries(user: dict = Depends(get_current_user)):
    if user["role"] != "merchant":
        raise HTTPException(status_code=403, detail="Accès réservé aux commerçants")

    merchant = await db.merchants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Profil commerçant non trouvé")

    deliveries = await db.delivery_requests.find(
        {"merchant_id": merchant["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)

    return deliveries


@router.post("/merchant/deliveries")
async def create_merchant_delivery(data: MerchantDeliveryCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "merchant":
        raise HTTPException(status_code=403, detail="Accès réservé aux commerçants")

    merchant = await db.merchants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Profil commerçant non trouvé")

    # Generate tracking number
    tracking_number = await get_next_tracking_number()

    # Calculate pricing if zone_id provided
    pricing = None
    if data.zone_livraison_id:
        pricing = await calculate_delivery_price(data.zone_livraison_id, data.forfait)

    delivery = DeliveryRequest(
        tracking_number=tracking_number,
        nom=data.nom_client,
        telephone=data.telephone_client,
        zone_enlevement=data.zone_enlevement,
        zone_livraison=data.zone_livraison,
        zone_livraison_id=data.zone_livraison_id,
        type_colis=data.type_colis,
        urgence=data.urgence,
        poids=data.poids,
        forfait=data.forfait,
        notes=data.notes,
        merchant_id=merchant["id"],
        merchant_nom=merchant["nom_entreprise"],
        prix_zone=pricing.get("prix_zone") if pricing else None,
        supplement_nuit=pricing.get("supplement_nuit") if pricing else None,
        prix_total=pricing.get("prix_total") if pricing else None,
        paiement_livreur=pricing.get("paiement_livreur") if pricing else None,
        commission_plateforme=pricing.get("commission_plateforme") if pricing else None,
        last_status_update=datetime.now(timezone.utc).isoformat()
    )

    await db.delivery_requests.insert_one(delivery.model_dump())

    # Update merchant stats
    await db.merchants.update_one(
        {"id": merchant["id"]},
        {"$inc": {"total_commandes": 1}}
    )

    # Send notification with tracking
    prix_display = f"{delivery.prix_total} FCFA" if delivery.prix_total else "À déterminer"
    html = f"""
    <h2>🚚 Nouvelle Commande Commerçant</h2>
    <p><strong>Numéro de suivi:</strong> <span style="font-size: 18px; font-weight: bold; color: #0ea5e9;">{tracking_number}</span></p>
    <hr>
    <p><strong>Commerçant:</strong> {merchant['nom_entreprise']}</p>
    <p><strong>Client:</strong> {delivery.nom}</p>
    <p><strong>Téléphone:</strong> {delivery.telephone}</p>
    <p><strong>Trajet:</strong> {delivery.zone_enlevement} → {delivery.zone_livraison}</p>
    <p><strong>Poids:</strong> {delivery.poids or 'Non spécifié'} kg</p>
    <p><strong>Prix:</strong> {prix_display}</p>
    <p><strong>Urgence:</strong> {delivery.urgence}</p>
    """
    await send_notification_email(f"🚚 {tracking_number} - Commande de {merchant['nom_entreprise']}", html)

    # Send tracking to merchant email
    merchant_html = f"""
    <h2>✅ Votre commande a été créée</h2>
    <p><strong>Numéro de suivi:</strong> <span style="font-size: 24px; font-weight: bold; color: #0ea5e9;">{tracking_number}</span></p>
    <hr>
    <p><strong>Client:</strong> {delivery.nom}</p>
    <p><strong>Destination:</strong> {delivery.zone_livraison}</p>
    <p><strong>Prix:</strong> {prix_display}</p>
    <p>Conservez ce numéro pour suivre votre livraison.</p>
    """
    await send_notification_email(f"📦 Commande {tracking_number} créée", merchant_html, merchant.get('email'))

    # In-app: notify admins of new merchant order
    await notify_admins(
        type="new_delivery_request",
        title="Nouvelle commande commerçant",
        message=f"{merchant['nom_entreprise']} • {tracking_number}",
        link="/admin"
    )

    # Return without internal financial data
    response = delivery.model_dump()
    response.pop("commission_plateforme", None)
    response.pop("paiement_livreur", None)

    return response


@router.get("/merchant/stats")
async def get_merchant_stats(user: dict = Depends(get_current_user)):
    if user["role"] != "merchant":
        raise HTTPException(status_code=403, detail="Accès réservé aux commerçants")

    merchant = await db.merchants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Profil commerçant non trouvé")

    total = await db.delivery_requests.count_documents({"merchant_id": merchant["id"]})
    completed = await db.delivery_requests.count_documents({"merchant_id": merchant["id"], "status": "livre"})
    in_progress = await db.delivery_requests.count_documents({"merchant_id": merchant["id"], "status": {"$in": ["nouveau", "assigne", "en_cours"]}})

    return {
        "merchant": {
            "id": merchant["id"],
            "nom": merchant["nom_entreprise"],
            "contact": merchant["nom_contact"]
        },
        "stats": {
            "total_commandes": total,
            "livrees": completed,
            "en_cours": in_progress
        }
    }


@router.get("/merchant/profile")
async def get_merchant_profile(user: dict = Depends(get_current_user)):
    if user["role"] != "merchant":
        raise HTTPException(status_code=403, detail="Accès réservé aux commerçants")

    merchant = await db.merchants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Profil commerçant non trouvé")

    return merchant


@router.patch("/merchant/deliveries/{delivery_id}/notes")
async def add_merchant_delivery_note(delivery_id: str, data: DeliveryNoteUpdate, user: dict = Depends(get_current_user)):
    if user["role"] != "merchant":
        raise HTTPException(status_code=403, detail="Accès réservé aux commerçants")

    merchant = await db.merchants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Profil commerçant non trouvé")

    delivery = await db.delivery_requests.find_one({"id": delivery_id, "merchant_id": merchant["id"]}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    current_notes = delivery.get("notes", "") or ""
    new_notes = f"{current_notes}\n[{datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}] {data.notes}".strip()

    await db.delivery_requests.update_one(
        {"id": delivery_id},
        {"$set": {"notes": new_notes}}
    )

    return {"success": True, "message": "Note ajoutée"}


@router.get("/merchant/export")
async def export_merchant_deliveries(user: dict = Depends(get_current_user)):
    if user["role"] != "merchant":
        raise HTTPException(status_code=403, detail="Accès réservé aux commerçants")

    merchant = await db.merchants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Profil commerçant non trouvé")

    items = await db.delivery_requests.find(
        {"merchant_id": merchant["id"]},
        {"_id": 0}
    ).to_list(1000)

    output = io.StringIO()
    if items:
        writer = csv.DictWriter(output, fieldnames=items[0].keys())
        writer.writeheader()
        writer.writerows(items)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=commandes_{merchant['nom_entreprise']}.csv"}
    )

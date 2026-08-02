"""Admin listing endpoints, applicant status lifecycle, and deletes for
merchants, riders, delivery requests, feedback, and contact messages."""
from fastapi import APIRouter, Depends, HTTPException

from database import db
from emails import send_notification_email
from models import StatusUpdate, User
from security import get_admin_user, hash_password

router = APIRouter()


# ============ LISTINGS ============

@router.get("/admin/delivery-requests")
async def get_delivery_requests(admin: dict = Depends(get_admin_user)):
    items = await db.delivery_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@router.get("/admin/feedback")
async def get_feedback(admin: dict = Depends(get_admin_user)):
    items = await db.feedback.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@router.get("/admin/merchants")
async def get_merchants(admin: dict = Depends(get_admin_user)):
    items = await db.merchants.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@router.get("/admin/riders")
async def get_riders(admin: dict = Depends(get_admin_user)):
    items = await db.riders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@router.get("/admin/contacts")
async def get_contacts(admin: dict = Depends(get_admin_user)):
    items = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@router.get("/admin/users")
async def get_users(admin: dict = Depends(get_admin_user)):
    items = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return items


# ============ STATUS MANAGEMENT ============

@router.patch("/admin/merchants/{merchant_id}/status")
async def update_merchant_status(merchant_id: str, data: StatusUpdate, admin: dict = Depends(get_admin_user)):
    merchant = await db.merchants.find_one({"id": merchant_id}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Commerçant non trouvé")

    await db.merchants.update_one(
        {"id": merchant_id},
        {"$set": {"status": data.status}}
    )

    # If accepted, create user account
    if data.status == "accepte":
        existing_user = await db.users.find_one({"email": merchant["email"].lower()})
        if not existing_user:
            # Generate default password
            default_password = f"GoLiv{merchant['telephone'][-4:]}"
            user = User(
                email=merchant["email"].lower(),
                password_hash=hash_password(default_password),
                role="merchant",
                nom=merchant["nom_contact"],
                telephone=merchant["telephone"],
                linked_id=merchant_id
            )
            await db.users.insert_one(user.model_dump())
            await db.merchants.update_one(
                {"id": merchant_id},
                {"$set": {"user_id": user.id}}
            )

            # Send welcome email with credentials
            html = f"""
            <h2>✅ Bienvenue chez GoLiv Logistique !</h2>
            <p>Bonjour {merchant['nom_contact']},</p>
            <p>Votre candidature commerçant pour <strong>{merchant['nom_entreprise']}</strong> a été acceptée !</p>
            <p>Voici vos identifiants de connexion :</p>
            <ul>
                <li><strong>Email:</strong> {merchant['email']}</li>
                <li><strong>Mot de passe:</strong> {default_password}</li>
            </ul>
            <p>Connectez-vous sur notre plateforme pour gérer vos livraisons.</p>
            <p>Cordialement,<br>L'équipe GoLiv Logistique</p>
            """
            await send_notification_email(f"✅ Bienvenue {merchant['nom_entreprise']} !", html, merchant['email'])
        else:
            await db.users.update_one(
                {"email": merchant["email"].lower()},
                {"$set": {"linked_id": merchant_id}}
            )
            await db.merchants.update_one(
                {"id": merchant_id},
                {"$set": {"user_id": existing_user["id"]}}
            )
    else:
        # Send notification email
        status_labels = {"refuse": "❌ Refusée"}
        status_label = status_labels.get(data.status, data.status)

        html = f"""
        <h2>Mise à jour de votre candidature - GoLiv Logistique</h2>
        <p>Bonjour {merchant['nom_contact']},</p>
        <p>Votre candidature pour <strong>{merchant['nom_entreprise']}</strong> a été <strong>{status_label}</strong>.</p>
        {"<p><strong>Raison:</strong> " + data.reason + "</p>" if data.reason else ""}
        <p>Cordialement,<br>L'équipe GoLiv Logistique</p>
        """
        await send_notification_email(f"GoLiv Logistique - Candidature {status_label}", html, merchant['email'])

    return {"success": True, "message": f"Statut mis à jour: {data.status}"}


@router.patch("/admin/riders/{rider_id}/status")
async def update_rider_status(rider_id: str, data: StatusUpdate, admin: dict = Depends(get_admin_user)):
    rider = await db.riders.find_one({"id": rider_id}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Livreur non trouvé")

    await db.riders.update_one(
        {"id": rider_id},
        {"$set": {"status": data.status}}
    )

    # If accepted, create user account
    if data.status == "accepte":
        existing_user = await db.users.find_one({"email": rider["email"].lower()})
        if not existing_user:
            # Generate default password
            default_password = f"GoLiv{rider['telephone'][-4:]}"
            user = User(
                email=rider["email"].lower(),
                password_hash=hash_password(default_password),
                role="rider",
                nom=f"{rider['prenom']} {rider['nom']}",
                telephone=rider["telephone"],
                linked_id=rider_id
            )
            await db.users.insert_one(user.model_dump())
            await db.riders.update_one(
                {"id": rider_id},
                {"$set": {"user_id": user.id}}
            )

            # Send welcome email with credentials
            html = f"""
            <h2>✅ Bienvenue chez GoLiv Logistique !</h2>
            <p>Bonjour {rider['prenom']} {rider['nom']},</p>
            <p>Votre candidature livreur a été acceptée !</p>
            <p>Voici vos identifiants de connexion :</p>
            <ul>
                <li><strong>Email:</strong> {rider['email']}</li>
                <li><strong>Mot de passe:</strong> {default_password}</li>
            </ul>
            <p>Connectez-vous sur notre plateforme pour voir vos livraisons assignées.</p>
            <p>Cordialement,<br>L'équipe GoLiv Logistique</p>
            """
            await send_notification_email(f"✅ Bienvenue {rider['prenom']} !", html, rider['email'])
        else:
            await db.users.update_one(
                {"email": rider["email"].lower()},
                {"$set": {"linked_id": rider_id}}
            )
            await db.riders.update_one(
                {"id": rider_id},
                {"$set": {"user_id": existing_user["id"]}}
            )
    else:
        status_labels = {"refuse": "❌ Refusée"}
        status_label = status_labels.get(data.status, data.status)

        html = f"""
        <h2>Mise à jour de votre candidature - GoLiv Logistique</h2>
        <p>Bonjour {rider['prenom']} {rider['nom']},</p>
        <p>Votre candidature livreur a été <strong>{status_label}</strong>.</p>
        {"<p><strong>Raison:</strong> " + data.reason + "</p>" if data.reason else ""}
        <p>Cordialement,<br>L'équipe GoLiv Logistique</p>
        """
        await send_notification_email(f"GoLiv Logistique - Candidature {status_label}", html, rider['email'])

    return {"success": True, "message": f"Statut mis à jour: {data.status}"}


# ============ DELETE ENDPOINTS ============

@router.delete("/admin/merchants/{merchant_id}")
async def delete_merchant(merchant_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.merchants.delete_one({"id": merchant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Commerçant non trouvé")

    return {"success": True, "message": "Commerçant supprimé"}


@router.delete("/admin/riders/{rider_id}")
async def delete_rider(rider_id: str, admin: dict = Depends(get_admin_user)):
    active_deliveries = await db.delivery_requests.count_documents({
        "livreur_id": rider_id,
        "status": {"$in": ["assigne", "en_cours"]}
    })

    if active_deliveries > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Ce livreur a {active_deliveries} livraison(s) en cours"
        )

    result = await db.riders.delete_one({"id": rider_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Livreur non trouvé")

    return {"success": True, "message": "Livreur supprimé"}


@router.delete("/admin/delivery-requests/{delivery_id}")
async def delete_delivery_request(delivery_id: str, admin: dict = Depends(get_admin_user)):
    delivery = await db.delivery_requests.find_one({"id": delivery_id}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if delivery.get('livreur_id') and delivery.get('status') in ['assigne', 'en_cours']:
        await db.riders.update_one(
            {"id": delivery['livreur_id']},
            {"$inc": {"livraisons_en_cours": -1}}
        )

    await db.delivery_requests.delete_one({"id": delivery_id})

    return {"success": True, "message": "Commande supprimée"}

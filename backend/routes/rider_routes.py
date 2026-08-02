"""Rider dashboard endpoints: profile, deliveries, stats, accept/refuse/status."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException

from database import db
from models import DeliveryNoteUpdate, DeliveryStatusUpdate
from notifications import notify_admins, notify_merchant_by_id
from security import get_current_user

router = APIRouter()


@router.get("/rider/deliveries")
async def get_rider_deliveries(user: dict = Depends(get_current_user)):
    if user["role"] != "rider":
        raise HTTPException(status_code=403, detail="Accès réservé aux livreurs")

    # Get rider profile
    rider = await db.riders.find_one({"user_id": user["id"]}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Profil livreur non trouvé")

    # Get assigned deliveries
    deliveries = await db.delivery_requests.find(
        {"livreur_id": rider["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)

    return deliveries


@router.get("/rider/stats")
async def get_rider_stats(user: dict = Depends(get_current_user)):
    if user["role"] != "rider":
        raise HTTPException(status_code=403, detail="Accès réservé aux livreurs")

    rider = await db.riders.find_one({"user_id": user["id"]}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Profil livreur non trouvé")

    # Calculate stats
    total = await db.delivery_requests.count_documents({"livreur_id": rider["id"]})
    completed = await db.delivery_requests.count_documents({"livreur_id": rider["id"], "status": "livre"})
    in_progress = await db.delivery_requests.count_documents({"livreur_id": rider["id"], "status": {"$in": ["assigne", "en_cours"]}})
    failed = await db.delivery_requests.count_documents({"livreur_id": rider["id"], "status": "echec"})

    # Recent 7 days
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_completed = await db.delivery_requests.count_documents({
        "livreur_id": rider["id"],
        "status": "livre",
        "completed_at": {"$gte": seven_days_ago}
    })

    return {
        "rider": {
            "id": rider["id"],
            "nom": f"{rider['prenom']} {rider['nom']}",
            "zone": rider["zone_couverture"],
            "vehicule": rider["type_vehicule"]
        },
        "stats": {
            "total_assignees": total,
            "completees": completed,
            "en_cours": in_progress,
            "echecs": failed,
            "completees_7j": recent_completed
        }
    }


@router.get("/rider/profile")
async def get_rider_profile(user: dict = Depends(get_current_user)):
    if user["role"] != "rider":
        raise HTTPException(status_code=403, detail="Accès réservé aux livreurs")

    rider = await db.riders.find_one({"user_id": user["id"]}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Profil livreur non trouvé")

    return rider


@router.patch("/rider/deliveries/{delivery_id}/accept")
async def rider_accept_delivery(delivery_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "rider":
        raise HTTPException(status_code=403, detail="Accès réservé aux livreurs")

    rider = await db.riders.find_one({"user_id": user["id"]}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Profil livreur non trouvé")

    delivery = await db.delivery_requests.find_one({"id": delivery_id, "livreur_id": rider["id"]}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    await db.delivery_requests.update_one(
        {"id": delivery_id},
        {"$set": {"rider_accepted": True, "status": "en_cours"}}
    )

    # In-app: notify merchant and admins that the rider accepted (now en_cours)
    tracking = delivery.get("tracking_number", "")
    if delivery.get("merchant_id"):
        await notify_merchant_by_id(
            merchant_id=delivery["merchant_id"],
            type="status_changed",
            title="Livraison en cours",
            message=f"{tracking} • Pris en charge par {rider['prenom']}",
            link="/espace-commercant"
        )
    await notify_admins(
        type="status_changed",
        title="Livraison en cours",
        message=f"{tracking} • {rider['prenom']} {rider['nom']}",
        link="/admin"
    )

    return {"success": True, "message": "Livraison acceptée"}


@router.patch("/rider/deliveries/{delivery_id}/refuse")
async def rider_refuse_delivery(delivery_id: str, data: DeliveryNoteUpdate, user: dict = Depends(get_current_user)):
    if user["role"] != "rider":
        raise HTTPException(status_code=403, detail="Accès réservé aux livreurs")

    rider = await db.riders.find_one({"user_id": user["id"]}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Profil livreur non trouvé")

    delivery = await db.delivery_requests.find_one({"id": delivery_id, "livreur_id": rider["id"]}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Refuse and unassign
    await db.delivery_requests.update_one(
        {"id": delivery_id},
        {"$set": {
            "rider_accepted": False,
            "status": "nouveau",
            "livreur_id": None,
            "livreur_nom": None,
            "assigned_at": None,
            "delivery_notes": f"Refusé par {rider['prenom']} {rider['nom']}: {data.notes}"
        }}
    )

    # Update rider stats
    await db.riders.update_one(
        {"id": rider["id"]},
        {"$inc": {"livraisons_en_cours": -1}}
    )

    # In-app: notify admins that rider refused (needs reassignment)
    await notify_admins(
        type="delivery_refused",
        title="Livraison refusée par un livreur",
        message=f"{delivery.get('tracking_number', '')} • {rider['prenom']} {rider['nom']}",
        link="/admin"
    )

    return {"success": True, "message": "Livraison refusée"}


@router.patch("/rider/deliveries/{delivery_id}/status")
async def rider_update_delivery_status(delivery_id: str, data: DeliveryStatusUpdate, user: dict = Depends(get_current_user)):
    if user["role"] != "rider":
        raise HTTPException(status_code=403, detail="Accès réservé aux livreurs")

    rider = await db.riders.find_one({"user_id": user["id"]}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Profil livreur non trouvé")

    delivery = await db.delivery_requests.find_one({"id": delivery_id, "livreur_id": rider["id"]}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    update_data = {"status": data.status}

    if data.notes:
        update_data["delivery_notes"] = data.notes

    if data.proof:
        update_data["delivery_proof"] = data.proof

    old_status = delivery.get("status")

    # Update stats based on status change
    if data.status == "livre" and old_status != "livre":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        await db.riders.update_one(
            {"id": rider["id"]},
            {"$inc": {"total_livraisons": 1, "livraisons_en_cours": -1}}
        )
    elif data.status == "echec" and old_status not in ["livre", "echec"]:
        await db.riders.update_one(
            {"id": rider["id"]},
            {"$inc": {"livraisons_en_cours": -1}}
        )

    await db.delivery_requests.update_one(
        {"id": delivery_id},
        {"$set": update_data}
    )

    # In-app: notify merchant and admins on rider status change
    if old_status != data.status:
        status_labels = {
            "en_cours": "En cours",
            "livre": "Livrée",
            "echec": "Échec de livraison"
        }
        label = status_labels.get(data.status, data.status)
        tracking = delivery.get("tracking_number", "")

        if delivery.get("merchant_id"):
            await notify_merchant_by_id(
                merchant_id=delivery["merchant_id"],
                type="delivery_delivered" if data.status == "livre" else "status_changed",
                title=label,
                message=f"{tracking} • {delivery.get('zone_livraison', '')}",
                link="/espace-commercant"
            )
        await notify_admins(
            type="delivery_delivered" if data.status == "livre" else "status_changed",
            title=label,
            message=f"{tracking} • {rider['prenom']} {rider['nom']}",
            link="/admin"
        )

    return {"success": True, "message": f"Statut mis à jour: {data.status}"}

"""Admin analytics, stats, financial dashboard, and CSV exports."""
import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from database import db
from security import get_admin_user

router = APIRouter()


# ============ ANALYTICS ============

@router.get("/admin/analytics")
async def get_analytics(admin: dict = Depends(get_admin_user)):
    total_deliveries = await db.delivery_requests.count_documents({})
    completed_deliveries = await db.delivery_requests.count_documents({"status": "livre"})
    pending_deliveries = await db.delivery_requests.count_documents({"status": {"$in": ["nouveau", "assigne", "en_cours"]}})

    total_merchants = await db.merchants.count_documents({})
    active_merchants = await db.merchants.count_documents({"status": "accepte"})

    total_riders = await db.riders.count_documents({})
    active_riders = await db.riders.count_documents({"status": "accepte"})

    feedback_list = await db.feedback.find({}, {"_id": 0, "note": 1}).to_list(1000)
    avg_rating = sum(f['note'] for f in feedback_list) / len(feedback_list) if feedback_list else 0

    top_riders = await db.riders.find(
        {"status": "accepte"},
        {"_id": 0, "id": 1, "prenom": 1, "nom": 1, "total_livraisons": 1, "livraisons_en_cours": 1}
    ).sort("total_livraisons", -1).limit(10).to_list(10)

    status_counts = {}
    for status in ["nouveau", "assigne", "en_cours", "livre", "annule"]:
        count = await db.delivery_requests.count_documents({"status": status})
        status_counts[status] = count

    urgency_counts = {}
    for urgency in ["standard", "express", "urgent"]:
        count = await db.delivery_requests.count_documents({"urgence": urgency})
        urgency_counts[urgency] = count

    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_deliveries = await db.delivery_requests.count_documents({
        "created_at": {"$gte": seven_days_ago}
    })
    recent_completed = await db.delivery_requests.count_documents({
        "status": "livre",
        "completed_at": {"$gte": seven_days_ago}
    })

    return {
        "overview": {
            "total_livraisons": total_deliveries,
            "livraisons_completees": completed_deliveries,
            "livraisons_en_attente": pending_deliveries,
            "total_commercants": total_merchants,
            "commercants_actifs": active_merchants,
            "total_livreurs": total_riders,
            "livreurs_actifs": active_riders,
            "note_moyenne": round(avg_rating, 1)
        },
        "par_statut": status_counts,
        "par_urgence": urgency_counts,
        "top_livreurs": top_riders,
        "activite_recente": {
            "nouvelles_demandes_7j": recent_deliveries,
            "livraisons_completees_7j": recent_completed
        }
    }


@router.get("/admin/stats")
async def get_stats(admin: dict = Depends(get_admin_user)):
    delivery_count = await db.delivery_requests.count_documents({})
    feedback_count = await db.feedback.count_documents({})
    merchant_count = await db.merchants.count_documents({})
    rider_count = await db.riders.count_documents({})

    return {
        "demandes_livraison": delivery_count,
        "avis_clients": feedback_count,
        "commercants": merchant_count,
        "livreurs": rider_count
    }


# ============ FINANCIAL DASHBOARD ============

@router.get("/admin/financial")
async def get_financial_stats(
    admin: dict = Depends(get_admin_user),
    date_from: str = Query(None),
    date_to: str = Query(None)
):
    # Build date filter
    date_filter = {}
    if date_from:
        date_filter["$gte"] = date_from
    if date_to:
        date_filter["$lte"] = date_to

    query = {}
    if date_filter:
        query["created_at"] = date_filter

    # Get all deliveries with pricing
    deliveries = await db.delivery_requests.find(
        {**query, "prix_total": {"$ne": None}},
        {"_id": 0}
    ).to_list(10000)

    # Calculate totals
    total_revenue = sum(d.get("prix_total", 0) or 0 for d in deliveries)
    total_rider_payments = sum(d.get("paiement_livreur", 0) or 0 for d in deliveries)
    total_commission = sum(d.get("commission_plateforme", 0) or 0 for d in deliveries)

    # Count by status
    delivered = [d for d in deliveries if d.get("status") == "livre"]
    pending = [d for d in deliveries if d.get("status") in ["nouveau", "assigne", "en_cours"]]

    delivered_revenue = sum(d.get("prix_total", 0) or 0 for d in delivered)
    pending_revenue = sum(d.get("prix_total", 0) or 0 for d in pending)

    return {
        "totaux": {
            "chiffre_affaires": total_revenue,
            "paiements_livreurs": total_rider_payments,
            "commission_plateforme": total_commission,
            "marge_nette": total_revenue - total_rider_payments
        },
        "par_statut": {
            "livrees": {
                "count": len(delivered),
                "montant": delivered_revenue
            },
            "en_cours": {
                "count": len(pending),
                "montant": pending_revenue
            }
        },
        "nombre_livraisons": len(deliveries)
    }


# ============ EXPORT ENDPOINTS ============

@router.get("/admin/export/delivery-requests")
async def export_delivery_requests(admin: dict = Depends(get_admin_user)):
    items = await db.delivery_requests.find({}, {"_id": 0}).to_list(1000)

    # Explicit headers to handle varying schemas
    fieldnames = [
        "id", "tracking_number", "nom", "telephone", "zone_enlevement", "zone_livraison",
        "zone_livraison_id", "type_colis", "urgence", "poids", "forfait", "notes", "status",
        "prix_zone", "supplement_nuit", "prix_total", "paiement_livreur", "commission_plateforme",
        "livreur_id", "livreur_nom", "merchant_id", "merchant_nom", "assigned_at",
        "completed_at", "delivery_notes", "delivery_proof", "rider_accepted",
        "last_status_update", "created_at"
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    if items:
        writer.writerows(items)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=demandes_livraison.csv"}
    )


@router.get("/admin/export/feedback")
async def export_feedback(admin: dict = Depends(get_admin_user)):
    items = await db.feedback.find({}, {"_id": 0}).to_list(1000)

    # Explicit headers to handle varying schemas
    fieldnames = ["id", "nom", "telephone", "note", "commentaire", "problemes", "created_at"]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    if items:
        writer.writerows(items)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=avis_clients.csv"}
    )


@router.get("/admin/export/merchants")
async def export_merchants(admin: dict = Depends(get_admin_user)):
    items = await db.merchants.find({}, {"_id": 0}).to_list(1000)

    # Explicit headers to handle varying schemas
    fieldnames = [
        "id", "nom_entreprise", "nom_contact", "telephone", "email", "adresse",
        "type_produits", "volume_mensuel", "message", "status", "total_commandes",
        "user_id", "created_at"
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    if items:
        writer.writerows(items)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=commercants.csv"}
    )


@router.get("/admin/export/riders")
async def export_riders(admin: dict = Depends(get_admin_user)):
    items = await db.riders.find({}, {"_id": 0}).to_list(1000)

    # Explicit headers to handle varying schemas
    fieldnames = [
        "id", "nom", "prenom", "telephone", "email", "zone_couverture",
        "type_vehicule", "experience", "disponibilite", "message", "status",
        "total_livraisons", "livraisons_en_cours", "user_id", "created_at"
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    if items:
        writer.writerows(items)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=livreurs.csv"}
    )


@router.get("/admin/export/finances")
async def export_finances(admin: dict = Depends(get_admin_user)):
    """CSV export of completed (livre) deliveries with financial fields."""
    rows = await db.delivery_requests.find(
        {"status": "livre"},
        {"_id": 0}
    ).sort("completed_at", -1).to_list(10000)
    headers = [
        "tracking_number", "completed_at", "zone_livraison", "poids", "forfait",
        "prix_zone", "supplement_nuit", "prix_total", "commission",
        "paiement_livreur", "livreur_nom", "merchant_nom"
    ]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    for r in rows:
        writer.writerow({h: (r.get(h) if r.get(h) is not None else "") for h in headers})
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=finances.csv"}
    )

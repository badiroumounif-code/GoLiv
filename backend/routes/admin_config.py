"""Admin-managed pricing zones and platform settings."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from database import db
from models import Zone, ZoneCreate, ZoneUpdate
from security import get_admin_user

router = APIRouter()


# ============ ZONES MANAGEMENT ============

@router.get("/admin/zones")
async def get_all_zones(admin: dict = Depends(get_admin_user)):
    zones = await db.zones.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return zones


@router.post("/admin/zones")
async def create_zone(data: ZoneCreate, admin: dict = Depends(get_admin_user)):
    zone = Zone(**data.model_dump())
    await db.zones.insert_one(zone.model_dump())
    return zone


@router.patch("/admin/zones/{zone_id}")
async def update_zone(zone_id: str, data: ZoneUpdate, admin: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")

    result = await db.zones.update_one({"id": zone_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Zone non trouvée")

    return {"success": True, "message": "Zone mise à jour"}


@router.delete("/admin/zones/{zone_id}")
async def delete_zone(zone_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.zones.delete_one({"id": zone_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Zone non trouvée")

    return {"success": True, "message": "Zone supprimée"}


# ============ PLATFORM SETTINGS ============

@router.get("/admin/settings")
async def get_platform_settings(admin: dict = Depends(get_admin_user)):
    settings = await db.platform_settings.find_one({"id": "platform_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        settings = {
            "id": "platform_settings",
            "poids_seuil": 5.0,
            "poids_supplement": 500,
            "commission_type": "percentage",
            "commission_value": 15.0
        }
    return settings


@router.put("/admin/settings")
async def update_platform_settings(
    admin: dict = Depends(get_admin_user),
    poids_seuil: float = Query(None),
    poids_supplement: int = Query(None),
    commission_type: str = Query(None),
    commission_value: float = Query(None)
):
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if poids_seuil is not None:
        update_data["poids_seuil"] = poids_seuil
    if poids_supplement is not None:
        update_data["poids_supplement"] = poids_supplement
    if commission_type is not None:
        update_data["commission_type"] = commission_type
    if commission_value is not None:
        update_data["commission_value"] = commission_value

    await db.platform_settings.update_one(
        {"id": "platform_settings"},
        {"$set": update_data},
        upsert=True
    )

    return {"success": True, "message": "Paramètres mis à jour"}


# ============ INIT DEFAULT ZONES ============

@router.post("/admin/init-zones")
async def init_default_zones(admin: dict = Depends(get_admin_user)):
    """Initialize default zones - only if no zones exist"""
    existing = await db.zones.count_documents({})
    if existing > 0:
        raise HTTPException(status_code=400, detail="Des zones existent déjà")

    default_zones = [
        Zone(nom="Cotonou Centre", prix_base=1500, paiement_livreur=1000, is_active=True),
        Zone(nom="Akpakpa", prix_base=2000, paiement_livreur=1300, is_active=True),
        Zone(nom="Calavi", prix_base=2500, paiement_livreur=1700, is_active=True),
        Zone(nom="Godomey", prix_base=2500, paiement_livreur=1700, is_active=True),
        Zone(nom="Porto-Novo", prix_base=3500, paiement_livreur=2500, is_active=True),
        Zone(nom="Périphérie", prix_base=3000, paiement_livreur=2000, is_active=True),
        Zone(nom="Hors Zone", prix_base=5000, paiement_livreur=3500, is_active=True),
    ]

    for zone in default_zones:
        await db.zones.insert_one(zone.model_dump())

    # Init default platform settings
    await db.platform_settings.update_one(
        {"id": "platform_settings"},
        {"$set": {
            "id": "platform_settings",
            "poids_seuil": 5.0,
            "poids_supplement": 500,
            "commission_type": "percentage",
            "commission_value": 15.0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    return {"success": True, "message": f"{len(default_zones)} zones créées"}

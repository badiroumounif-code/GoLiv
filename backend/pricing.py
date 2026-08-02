"""Tracking-number generation and zone/night/weight pricing calculation."""
from datetime import datetime, timezone

from database import db


async def get_next_tracking_number():
    """Generate next tracking number in format GOLIV-YYYY-XXXXXX"""
    year = datetime.now(timezone.utc).year
    counter_doc = await db.counters.find_one_and_update(
        {"_id": "tracking_number"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    seq = counter_doc.get("seq", 1)
    return f"GOLIV-{year}-{seq:06d}"


async def calculate_delivery_price(zone_id: str, forfait: str = "jour"):
    """Calculate delivery price based on zone and day/night pricing"""
    # Get zone
    zone = await db.zones.find_one({"id": zone_id, "is_active": True}, {"_id": 0})
    if not zone:
        return None

    # Get platform settings
    settings = await db.platform_settings.find_one({"id": "platform_settings"}, {"_id": 0})
    if not settings:
        settings = {
            "commission_type": "percentage",
            "commission_value": 15.0
        }

    # Base price from zone
    prix_zone = zone.get("prix_base", 0)
    paiement_livreur_base = zone.get("paiement_livreur", 0)

    # Night surcharge (+20% for both price and rider payment)
    supplement_nuit = 0
    supplement_livreur_nuit = 0
    if forfait == "nuit":
        supplement_nuit = int(prix_zone * 0.20)
        supplement_livreur_nuit = int(paiement_livreur_base * 0.20)

    # Total price
    prix_total = prix_zone + supplement_nuit
    paiement_livreur = paiement_livreur_base + supplement_livreur_nuit

    # Commission
    if settings.get("commission_type") == "percentage":
        commission = int(prix_total * settings.get("commission_value", 15) / 100)
    else:
        commission = int(settings.get("commission_value", 0))

    return {
        "prix_zone": prix_zone,
        "supplement_nuit": supplement_nuit,
        "prix_total": prix_total,
        "paiement_livreur": paiement_livreur,
        "commission_plateforme": commission
    }

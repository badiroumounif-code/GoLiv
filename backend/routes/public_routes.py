"""Public, unauthenticated endpoints: health, zones, tracking, and the
public creation endpoints (delivery request, feedback, merchant/rider
applications, contact message)."""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from database import db
from emails import send_notification_email
from models import (
    ContactMessage,
    ContactMessageCreate,
    DeliveryRequest,
    DeliveryRequestCreate,
    Feedback,
    FeedbackCreate,
    Merchant,
    MerchantCreate,
    Rider,
    RiderCreate,
)
from notifications import notify_admins
from pricing import calculate_delivery_price, get_next_tracking_number

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "GoLiv Logistique API", "version": "3.0"}


@router.get("/health")
async def health_check():
    return {"status": "healthy"}


@router.get("/zones")
async def get_active_zones():
    """Get all active zones for delivery form"""
    zones = await db.zones.find({"is_active": True}, {"_id": 0}).to_list(100)
    return zones


@router.get("/track/{tracking_number}")
async def track_delivery(tracking_number: str):
    """Public tracking endpoint - no auth required"""
    delivery = await db.delivery_requests.find_one(
        {"tracking_number": tracking_number.upper()},
        {"_id": 0}
    )

    if not delivery:
        raise HTTPException(status_code=404, detail="Numéro de suivi introuvable")

    # Return only public info (no financial data)
    status_labels = {
        "nouveau": "En attente de prise en charge",
        "assigne": "Assigné à un livreur",
        "en_cours": "En cours de livraison",
        "livre": "Livré",
        "echec": "Échec de livraison",
        "annule": "Annulé"
    }

    return {
        "tracking_number": delivery.get("tracking_number"),
        "status": delivery.get("status"),
        "status_label": status_labels.get(delivery.get("status"), delivery.get("status")),
        "zone_enlevement": delivery.get("zone_enlevement"),
        "zone_livraison": delivery.get("zone_livraison"),
        "type_colis": delivery.get("type_colis"),
        "created_at": delivery.get("created_at"),
        "last_status_update": delivery.get("last_status_update") or delivery.get("created_at"),
        "delivery_notes": delivery.get("delivery_notes") if delivery.get("status") in ["livre", "echec"] else None
    }


# Delivery Requests (Public)
@router.post("/delivery-requests")
async def create_delivery_request(data: DeliveryRequestCreate):
    # Generate tracking number
    tracking_number = await get_next_tracking_number()

    # Calculate pricing if zone_id provided
    pricing = None
    if data.zone_livraison_id:
        pricing = await calculate_delivery_price(data.zone_livraison_id, data.forfait)

    delivery = DeliveryRequest(
        **data.model_dump(),
        tracking_number=tracking_number,
        prix_zone=pricing.get("prix_zone") if pricing else None,
        supplement_nuit=pricing.get("supplement_nuit") if pricing else None,
        prix_total=pricing.get("prix_total") if pricing else None,
        paiement_livreur=pricing.get("paiement_livreur") if pricing else None,
        commission_plateforme=pricing.get("commission_plateforme") if pricing else None,
        last_status_update=datetime.now(timezone.utc).isoformat()
    )

    doc = delivery.model_dump()
    await db.delivery_requests.insert_one(doc)

    # Send email notification with tracking number
    prix_display = f"{delivery.prix_total} FCFA" if delivery.prix_total else "À déterminer"
    html = f"""
    <h2>🚚 Nouvelle Demande de Livraison</h2>
    <p><strong>Numéro de suivi:</strong> <span style="font-size: 18px; font-weight: bold; color: #0ea5e9;">{delivery.tracking_number}</span></p>
    <hr>
    <p><strong>Client:</strong> {delivery.nom}</p>
    <p><strong>Téléphone:</strong> {delivery.telephone}</p>
    <p><strong>Zone d'enlèvement:</strong> {delivery.zone_enlevement}</p>
    <p><strong>Zone de livraison:</strong> {delivery.zone_livraison}</p>
    <p><strong>Type de colis:</strong> {delivery.type_colis}</p>
    <p><strong>Poids:</strong> {delivery.poids or 'Non spécifié'} kg</p>
    <p><strong>Urgence:</strong> {delivery.urgence}</p>
    <p><strong>Prix:</strong> {prix_display}</p>
    <p><strong>Notes:</strong> {delivery.notes or 'Aucune'}</p>
    <hr>
    <p><em>Reçu le {delivery.created_at}</em></p>
    <p>Suivez votre colis avec le numéro: <strong>{delivery.tracking_number}</strong></p>
    """
    await send_notification_email(f"🚚 Livraison {delivery.tracking_number} - {delivery.nom}", html)

    # In-app: notify all admins
    await notify_admins(
        type="new_delivery_request",
        title="Nouvelle demande de livraison",
        message=f"{delivery.nom} • {delivery.zone_enlevement} → {delivery.zone_livraison}",
        link="/admin"
    )

    # Return delivery without internal financial data for public
    response = delivery.model_dump()
    # Remove internal fields for public response
    for field in ["commission_plateforme", "paiement_livreur"]:
        response.pop(field, None)

    return response


# Feedback
@router.post("/feedback", response_model=Feedback)
async def create_feedback(data: FeedbackCreate):
    feedback = Feedback(**data.model_dump())
    doc = feedback.model_dump()
    await db.feedback.insert_one(doc)
    return feedback


# Merchants
@router.post("/merchants", response_model=Merchant)
async def create_merchant(data: MerchantCreate):
    merchant = Merchant(**data.model_dump())
    doc = merchant.model_dump()
    await db.merchants.insert_one(doc)

    html = f"""
    <h2>🏪 Nouvelle Candidature Commerçant</h2>
    <p><strong>Entreprise:</strong> {merchant.nom_entreprise}</p>
    <p><strong>Contact:</strong> {merchant.nom_contact}</p>
    <p><strong>Téléphone:</strong> {merchant.telephone}</p>
    <p><strong>Email:</strong> {merchant.email}</p>
    <p><strong>Type de produits:</strong> {merchant.type_produits}</p>
    <p><strong>Volume mensuel:</strong> {merchant.volume_mensuel}</p>
    """
    await send_notification_email(f"🏪 Nouveau commerçant: {merchant.nom_entreprise}", html)

    return merchant


# Riders
@router.post("/riders", response_model=Rider)
async def create_rider(data: RiderCreate):
    rider = Rider(**data.model_dump())
    doc = rider.model_dump()
    await db.riders.insert_one(doc)

    html = f"""
    <h2>🏍️ Nouvelle Candidature Livreur</h2>
    <p><strong>Nom:</strong> {rider.prenom} {rider.nom}</p>
    <p><strong>Téléphone:</strong> {rider.telephone}</p>
    <p><strong>Email:</strong> {rider.email}</p>
    <p><strong>Zone:</strong> {rider.zone_couverture}</p>
    <p><strong>Véhicule:</strong> {rider.type_vehicule}</p>
    """
    await send_notification_email(f"🏍️ Nouveau livreur: {rider.prenom} {rider.nom}", html)

    return rider


# Contact
@router.post("/contact", response_model=ContactMessage)
async def create_contact_message(data: ContactMessageCreate):
    message = ContactMessage(**data.model_dump())
    doc = message.model_dump()
    await db.contact_messages.insert_one(doc)

    html = f"""
    <h2>📩 Nouveau Message de Contact</h2>
    <p><strong>De:</strong> {message.nom}</p>
    <p><strong>Email:</strong> {message.email}</p>
    <p><strong>Sujet:</strong> {message.sujet}</p>
    <p><strong>Message:</strong></p>
    <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">{message.message}</p>
    <p><em>Reçu le {message.created_at}</em></p>
    """
    await send_notification_email(f"📩 Message de {message.nom}: {message.sujet}", html)

    return message

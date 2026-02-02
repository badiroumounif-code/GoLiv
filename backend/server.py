from fastapi import FastAPI, APIRouter, HTTPException, Query, Body
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import io
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin password
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'plb2024')

# Resend configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL')

# Create the main app
app = FastAPI(title="PLB Logistique API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class DeliveryRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    telephone: str
    zone_enlevement: str
    zone_livraison: str
    type_colis: str
    urgence: str
    notes: Optional[str] = None
    status: str = "nouveau"
    livreur_id: Optional[str] = None
    livreur_nom: Optional[str] = None
    assigned_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DeliveryRequestCreate(BaseModel):
    nom: str
    telephone: str
    zone_enlevement: str
    zone_livraison: str
    type_colis: str
    urgence: str
    notes: Optional[str] = None

class Feedback(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    telephone: str
    note: int
    commentaire: str
    problemes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FeedbackCreate(BaseModel):
    nom: str
    telephone: str
    note: int
    commentaire: str
    problemes: Optional[str] = None

class Merchant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom_entreprise: str
    nom_contact: str
    telephone: str
    email: str
    adresse: str
    type_produits: str
    volume_mensuel: str
    message: Optional[str] = None
    status: str = "en_attente"
    total_commandes: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MerchantCreate(BaseModel):
    nom_entreprise: str
    nom_contact: str
    telephone: str
    email: str
    adresse: str
    type_produits: str
    volume_mensuel: str
    message: Optional[str] = None

class Rider(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    prenom: str
    telephone: str
    email: str
    zone_couverture: str
    type_vehicule: str
    experience: str
    disponibilite: str
    message: Optional[str] = None
    status: str = "en_attente"
    total_livraisons: int = 0
    livraisons_en_cours: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RiderCreate(BaseModel):
    nom: str
    prenom: str
    telephone: str
    email: str
    zone_couverture: str
    type_vehicule: str
    experience: str
    disponibilite: str
    message: Optional[str] = None

class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    email: str
    sujet: str
    message: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ContactMessageCreate(BaseModel):
    nom: str
    email: str
    sujet: str
    message: str

class AdminLogin(BaseModel):
    password: str

class StatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None

class AssignRider(BaseModel):
    livreur_id: str

# ============ EMAIL HELPER ============

async def send_notification_email(subject: str, html_content: str, to_email: str = None):
    """Send email notification using Resend"""
    if not RESEND_API_KEY:
        logger.warning("Email not configured - RESEND_API_KEY missing")
        return False
    
    recipient = to_email or ADMIN_EMAIL
    if not recipient:
        logger.warning("No recipient email configured")
        return False
    
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        
        params = {
            "from": SENDER_EMAIL,
            "to": [recipient],
            "subject": subject,
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

# ============ PUBLIC ENDPOINTS ============

@api_router.get("/")
async def root():
    return {"message": "PLB Logistique API", "version": "2.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Delivery Requests
@api_router.post("/delivery-requests", response_model=DeliveryRequest)
async def create_delivery_request(data: DeliveryRequestCreate):
    delivery = DeliveryRequest(**data.model_dump())
    doc = delivery.model_dump()
    await db.delivery_requests.insert_one(doc)
    
    # Send email notification
    html = f"""
    <h2>🚚 Nouvelle Demande de Livraison</h2>
    <p><strong>Client:</strong> {delivery.nom}</p>
    <p><strong>Téléphone:</strong> {delivery.telephone}</p>
    <p><strong>Zone d'enlèvement:</strong> {delivery.zone_enlevement}</p>
    <p><strong>Zone de livraison:</strong> {delivery.zone_livraison}</p>
    <p><strong>Type de colis:</strong> {delivery.type_colis}</p>
    <p><strong>Urgence:</strong> {delivery.urgence}</p>
    <p><strong>Notes:</strong> {delivery.notes or 'Aucune'}</p>
    <p><em>Reçu le {delivery.created_at}</em></p>
    """
    await send_notification_email(f"🚚 Nouvelle demande de {delivery.nom}", html)
    
    return delivery

# Feedback
@api_router.post("/feedback", response_model=Feedback)
async def create_feedback(data: FeedbackCreate):
    feedback = Feedback(**data.model_dump())
    doc = feedback.model_dump()
    await db.feedback.insert_one(doc)
    return feedback

# Merchants
@api_router.post("/merchants", response_model=Merchant)
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
@api_router.post("/riders", response_model=Rider)
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
@api_router.post("/contact", response_model=ContactMessage)
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

# ============ ADMIN ENDPOINTS ============

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    if data.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Connexion réussie"}
    raise HTTPException(status_code=401, detail="Mot de passe incorrect")

@api_router.get("/admin/delivery-requests", response_model=List[DeliveryRequest])
async def get_delivery_requests(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.delivery_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api_router.get("/admin/feedback", response_model=List[Feedback])
async def get_feedback(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.feedback.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api_router.get("/admin/merchants", response_model=List[Merchant])
async def get_merchants(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.merchants.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api_router.get("/admin/riders", response_model=List[Rider])
async def get_riders(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.riders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api_router.get("/admin/contacts", response_model=List[ContactMessage])
async def get_contacts(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

# ============ STATUS MANAGEMENT ============

@api_router.patch("/admin/merchants/{merchant_id}/status")
async def update_merchant_status(merchant_id: str, data: StatusUpdate, password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    merchant = await db.merchants.find_one({"id": merchant_id}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Commerçant non trouvé")
    
    await db.merchants.update_one(
        {"id": merchant_id},
        {"$set": {"status": data.status}}
    )
    
    # Send email notification to merchant
    status_labels = {
        "accepte": "✅ Acceptée",
        "refuse": "❌ Refusée"
    }
    status_label = status_labels.get(data.status, data.status)
    
    html = f"""
    <h2>Mise à jour de votre candidature - PLB Logistique</h2>
    <p>Bonjour {merchant['nom_contact']},</p>
    <p>Votre candidature en tant que commerçant partenaire pour <strong>{merchant['nom_entreprise']}</strong> a été <strong>{status_label}</strong>.</p>
    {"<p><strong>Raison:</strong> " + data.reason + "</p>" if data.reason else ""}
    {"<p>Bienvenue dans notre réseau ! Notre équipe vous contactera prochainement pour les prochaines étapes.</p>" if data.status == "accepte" else ""}
    <p>Cordialement,<br>L'équipe PLB Logistique</p>
    """
    await send_notification_email(
        f"PLB Logistique - Candidature {status_label}", 
        html, 
        merchant['email']
    )
    
    return {"success": True, "message": f"Statut mis à jour: {data.status}"}

@api_router.patch("/admin/riders/{rider_id}/status")
async def update_rider_status(rider_id: str, data: StatusUpdate, password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    rider = await db.riders.find_one({"id": rider_id}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Livreur non trouvé")
    
    await db.riders.update_one(
        {"id": rider_id},
        {"$set": {"status": data.status}}
    )
    
    # Send email notification to rider
    status_labels = {
        "accepte": "✅ Acceptée",
        "refuse": "❌ Refusée"
    }
    status_label = status_labels.get(data.status, data.status)
    
    html = f"""
    <h2>Mise à jour de votre candidature - PLB Logistique</h2>
    <p>Bonjour {rider['prenom']} {rider['nom']},</p>
    <p>Votre candidature en tant que livreur partenaire a été <strong>{status_label}</strong>.</p>
    {"<p><strong>Raison:</strong> " + data.reason + "</p>" if data.reason else ""}
    {"<p>Bienvenue dans notre équipe ! Notre équipe vous contactera prochainement pour la formation et les prochaines étapes.</p>" if data.status == "accepte" else ""}
    <p>Cordialement,<br>L'équipe PLB Logistique</p>
    """
    await send_notification_email(
        f"PLB Logistique - Candidature {status_label}", 
        html, 
        rider['email']
    )
    
    return {"success": True, "message": f"Statut mis à jour: {data.status}"}

# ============ DELETE ENDPOINTS ============

@api_router.delete("/admin/merchants/{merchant_id}")
async def delete_merchant(merchant_id: str, password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    result = await db.merchants.delete_one({"id": merchant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Commerçant non trouvé")
    
    return {"success": True, "message": "Commerçant supprimé"}

@api_router.delete("/admin/riders/{rider_id}")
async def delete_rider(rider_id: str, password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    # Check if rider has active deliveries
    active_deliveries = await db.delivery_requests.count_documents({
        "livreur_id": rider_id,
        "status": {"$in": ["assigne", "en_cours"]}
    })
    
    if active_deliveries > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Ce livreur a {active_deliveries} livraison(s) en cours. Veuillez les réassigner avant de supprimer."
        )
    
    result = await db.riders.delete_one({"id": rider_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Livreur non trouvé")
    
    return {"success": True, "message": "Livreur supprimé"}

@api_router.delete("/admin/delivery-requests/{delivery_id}")
async def delete_delivery_request(delivery_id: str, password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    delivery = await db.delivery_requests.find_one({"id": delivery_id}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    # If delivery was assigned, decrement rider's counter
    if delivery.get('livreur_id') and delivery.get('status') in ['assigne', 'en_cours']:
        await db.riders.update_one(
            {"id": delivery['livreur_id']},
            {"$inc": {"livraisons_en_cours": -1}}
        )
    
    await db.delivery_requests.delete_one({"id": delivery_id})
    
    return {"success": True, "message": "Commande supprimée"}

# ============ DELIVERY MANAGEMENT ============

@api_router.patch("/admin/delivery-requests/{delivery_id}/assign")
async def assign_delivery_to_rider(delivery_id: str, data: AssignRider, password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    delivery = await db.delivery_requests.find_one({"id": delivery_id}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    rider = await db.riders.find_one({"id": data.livreur_id}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Livreur non trouvé")
    
    if rider['status'] != 'accepte':
        raise HTTPException(status_code=400, detail="Ce livreur n'est pas encore validé")
    
    # Update delivery
    await db.delivery_requests.update_one(
        {"id": delivery_id},
        {"$set": {
            "status": "assigne",
            "livreur_id": rider['id'],
            "livreur_nom": f"{rider['prenom']} {rider['nom']}",
            "assigned_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update rider stats
    await db.riders.update_one(
        {"id": data.livreur_id},
        {"$inc": {"livraisons_en_cours": 1}}
    )
    
    # Notify rider by email
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
    <p>Veuillez contacter le client pour organiser l'enlèvement.</p>
    <p>Cordialement,<br>L'équipe PLB Logistique</p>
    """
    await send_notification_email(f"🚚 Nouvelle livraison assignée", html, rider['email'])
    
    return {"success": True, "message": f"Livraison assignée à {rider['prenom']} {rider['nom']}"}

@api_router.patch("/admin/delivery-requests/{delivery_id}/status")
async def update_delivery_status(delivery_id: str, data: StatusUpdate, password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    delivery = await db.delivery_requests.find_one({"id": delivery_id}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    old_status = delivery.get('status')
    new_status = data.status
    update_data = {"status": new_status}
    
    # Handle rider stats based on status transitions
    if delivery.get('livreur_id'):
        rider_id = delivery['livreur_id']
        
        # Going FROM livre to another status (reverting completion)
        if old_status == "livre" and new_status != "livre":
            await db.riders.update_one(
                {"id": rider_id},
                {"$inc": {"total_livraisons": -1, "livraisons_en_cours": 1}}
            )
            update_data["completed_at"] = None
        
        # Going TO livre (completing)
        elif old_status != "livre" and new_status == "livre":
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
            await db.riders.update_one(
                {"id": rider_id},
                {"$inc": {"total_livraisons": 1, "livraisons_en_cours": -1}}
            )
        
        # Going TO annule from active status (canceling)
        elif new_status == "annule" and old_status in ["assigne", "en_cours"]:
            await db.riders.update_one(
                {"id": rider_id},
                {"$inc": {"livraisons_en_cours": -1}}
            )
        
        # Going FROM annule to active status (reactivating)
        elif old_status == "annule" and new_status in ["assigne", "en_cours"]:
            await db.riders.update_one(
                {"id": rider_id},
                {"$inc": {"livraisons_en_cours": 1}}
            )
    
    # If going back to nouveau, remove rider assignment
    if new_status == "nouveau":
        update_data["livreur_id"] = None
        update_data["livreur_nom"] = None
        update_data["assigned_at"] = None
        update_data["completed_at"] = None
        
        # Decrement rider's in-progress if was assigned/en_cours
        if delivery.get('livreur_id') and old_status in ["assigne", "en_cours"]:
            await db.riders.update_one(
                {"id": delivery['livreur_id']},
                {"$inc": {"livraisons_en_cours": -1}}
            )
    
    await db.delivery_requests.update_one(
        {"id": delivery_id},
        {"$set": update_data}
    )
    
    return {"success": True, "message": f"Statut mis à jour: {new_status}"}

# ============ ANALYTICS ============

@api_router.get("/admin/analytics")
async def get_analytics(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    # Get counts
    total_deliveries = await db.delivery_requests.count_documents({})
    completed_deliveries = await db.delivery_requests.count_documents({"status": "livre"})
    pending_deliveries = await db.delivery_requests.count_documents({"status": {"$in": ["nouveau", "assigne", "en_cours"]}})
    
    total_merchants = await db.merchants.count_documents({})
    active_merchants = await db.merchants.count_documents({"status": "accepte"})
    
    total_riders = await db.riders.count_documents({})
    active_riders = await db.riders.count_documents({"status": "accepte"})
    
    # Average rating
    feedback_list = await db.feedback.find({}, {"_id": 0, "note": 1}).to_list(1000)
    avg_rating = sum(f['note'] for f in feedback_list) / len(feedback_list) if feedback_list else 0
    
    # Top riders by deliveries
    top_riders = await db.riders.find(
        {"status": "accepte"},
        {"_id": 0, "id": 1, "prenom": 1, "nom": 1, "total_livraisons": 1, "livraisons_en_cours": 1}
    ).sort("total_livraisons", -1).limit(10).to_list(10)
    
    # Deliveries by status
    status_counts = {}
    for status in ["nouveau", "assigne", "en_cours", "livre", "annule"]:
        count = await db.delivery_requests.count_documents({"status": status})
        status_counts[status] = count
    
    # Deliveries by urgency
    urgency_counts = {}
    for urgency in ["standard", "express", "urgent"]:
        count = await db.delivery_requests.count_documents({"urgence": urgency})
        urgency_counts[urgency] = count
    
    # Recent activity (last 7 days)
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

# ============ STATS ============

@api_router.get("/admin/stats")
async def get_stats(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
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

# ============ EXPORT ENDPOINTS ============

@api_router.get("/admin/export/delivery-requests")
async def export_delivery_requests(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    items = await db.delivery_requests.find({}, {"_id": 0}).to_list(1000)
    
    output = io.StringIO()
    if items:
        writer = csv.DictWriter(output, fieldnames=items[0].keys())
        writer.writeheader()
        writer.writerows(items)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=demandes_livraison.csv"}
    )

@api_router.get("/admin/export/feedback")
async def export_feedback(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    items = await db.feedback.find({}, {"_id": 0}).to_list(1000)
    
    output = io.StringIO()
    if items:
        writer = csv.DictWriter(output, fieldnames=items[0].keys())
        writer.writeheader()
        writer.writerows(items)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=avis_clients.csv"}
    )

@api_router.get("/admin/export/merchants")
async def export_merchants(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    items = await db.merchants.find({}, {"_id": 0}).to_list(1000)
    
    output = io.StringIO()
    if items:
        writer = csv.DictWriter(output, fieldnames=items[0].keys())
        writer.writeheader()
        writer.writerows(items)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=commercants.csv"}
    )

@api_router.get("/admin/export/riders")
async def export_riders(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    items = await db.riders.find({}, {"_id": 0}).to_list(1000)
    
    output = io.StringIO()
    if items:
        writer = csv.DictWriter(output, fieldnames=items[0].keys())
        writer.writeheader()
        writer.writerows(items)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=livreurs.csv"}
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

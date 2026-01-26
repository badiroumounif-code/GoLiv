from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
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

# ============ EMAIL HELPER ============

async def send_notification_email(subject: str, html_content: str):
    """Send email notification using Resend"""
    if not RESEND_API_KEY or not ADMIN_EMAIL:
        logger.warning("Email not configured - RESEND_API_KEY or ADMIN_EMAIL missing")
        return False
    
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
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
    return {"message": "PLB Logistique API", "version": "1.0"}

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
    <h2>Nouvelle Demande de Livraison</h2>
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
    <h2>Nouvelle Candidature Commerçant</h2>
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
    <h2>Nouvelle Candidature Livreur</h2>
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

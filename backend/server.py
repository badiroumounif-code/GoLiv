from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
from datetime import datetime, timezone, timedelta
import io
import csv
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin password
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'plb2024')

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'plb-logistique-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Resend configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL')

# Create the main app
app = FastAPI(title="PLB Logistique API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    role: str  # 'admin', 'rider', 'merchant'
    linked_id: Optional[str] = None  # rider_id or merchant_id
    nom: str
    telephone: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserRegister(BaseModel):
    email: str
    password: str
    role: str
    nom: str
    telephone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

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
    merchant_id: Optional[str] = None
    merchant_nom: Optional[str] = None
    assigned_at: Optional[str] = None
    completed_at: Optional[str] = None
    delivery_notes: Optional[str] = None
    delivery_proof: Optional[str] = None
    rider_accepted: Optional[bool] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DeliveryRequestCreate(BaseModel):
    nom: str
    telephone: str
    zone_enlevement: str
    zone_livraison: str
    type_colis: str
    urgence: str
    notes: Optional[str] = None

class MerchantDeliveryCreate(BaseModel):
    nom_client: str
    telephone_client: str
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
    user_id: Optional[str] = None
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
    user_id: Optional[str] = None
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

class DeliveryStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    proof: Optional[str] = None

class DeliveryNoteUpdate(BaseModel):
    notes: str

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str, linked_id: str = None) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "linked_id": linked_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Compte désactivé")
    
    return user

async def require_role(roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
        return user
    return role_checker

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

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register")
async def register_user(data: UserRegister):
    # Check if email already exists
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Only allow rider and merchant registration
    if data.role not in ["rider", "merchant"]:
        raise HTTPException(status_code=400, detail="Type de compte invalide")
    
    # Create user
    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role=data.role,
        nom=data.nom,
        telephone=data.telephone
    )
    
    await db.users.insert_one(user.model_dump())
    
    token = create_token(user.id, user.role, user.linked_id)
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "nom": user.nom,
            "linked_id": user.linked_id
        }
    }

@api_router.post("/auth/login")
async def login_user(data: UserLogin):
    # First check if this is an admin login with the legacy password
    if data.password == ADMIN_PASSWORD:
        # Check if an admin user exists with this email
        admin_user = await db.users.find_one({"email": data.email.lower(), "role": "admin"}, {"_id": 0})
        if admin_user:
            token = create_token(admin_user["id"], admin_user["role"], admin_user.get("linked_id"))
            return {
                "success": True,
                "token": token,
                "user": {
                    "id": admin_user["id"],
                    "email": admin_user["email"],
                    "role": admin_user["role"],
                    "nom": admin_user["nom"],
                    "linked_id": admin_user.get("linked_id")
                }
            }
    
    user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Compte désactivé")
    
    token = create_token(user["id"], user["role"], user.get("linked_id"))
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "nom": user["nom"],
            "linked_id": user.get("linked_id")
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "nom": user["nom"],
        "telephone": user.get("telephone"),
        "linked_id": user.get("linked_id")
    }

# ============ PUBLIC ENDPOINTS ============

@api_router.get("/")
async def root():
    return {"message": "PLB Logistique API", "version": "2.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Delivery Requests (Public)
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

# ============ RIDER DASHBOARD ENDPOINTS ============

@api_router.get("/rider/deliveries")
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

@api_router.get("/rider/stats")
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

@api_router.get("/rider/profile")
async def get_rider_profile(user: dict = Depends(get_current_user)):
    if user["role"] != "rider":
        raise HTTPException(status_code=403, detail="Accès réservé aux livreurs")
    
    rider = await db.riders.find_one({"user_id": user["id"]}, {"_id": 0})
    if not rider:
        raise HTTPException(status_code=404, detail="Profil livreur non trouvé")
    
    return rider

@api_router.patch("/rider/deliveries/{delivery_id}/accept")
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
    
    return {"success": True, "message": "Livraison acceptée"}

@api_router.patch("/rider/deliveries/{delivery_id}/refuse")
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
    
    return {"success": True, "message": "Livraison refusée"}

@api_router.patch("/rider/deliveries/{delivery_id}/status")
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
    
    return {"success": True, "message": f"Statut mis à jour: {data.status}"}

# ============ MERCHANT DASHBOARD ENDPOINTS ============

@api_router.get("/merchant/deliveries")
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

@api_router.post("/merchant/deliveries")
async def create_merchant_delivery(data: MerchantDeliveryCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "merchant":
        raise HTTPException(status_code=403, detail="Accès réservé aux commerçants")
    
    merchant = await db.merchants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Profil commerçant non trouvé")
    
    delivery = DeliveryRequest(
        nom=data.nom_client,
        telephone=data.telephone_client,
        zone_enlevement=data.zone_enlevement,
        zone_livraison=data.zone_livraison,
        type_colis=data.type_colis,
        urgence=data.urgence,
        notes=data.notes,
        merchant_id=merchant["id"],
        merchant_nom=merchant["nom_entreprise"]
    )
    
    await db.delivery_requests.insert_one(delivery.model_dump())
    
    # Update merchant stats
    await db.merchants.update_one(
        {"id": merchant["id"]},
        {"$inc": {"total_commandes": 1}}
    )
    
    # Send notification
    html = f"""
    <h2>🚚 Nouvelle Commande Commerçant</h2>
    <p><strong>Commerçant:</strong> {merchant['nom_entreprise']}</p>
    <p><strong>Client:</strong> {delivery.nom}</p>
    <p><strong>Téléphone:</strong> {delivery.telephone}</p>
    <p><strong>Trajet:</strong> {delivery.zone_enlevement} → {delivery.zone_livraison}</p>
    <p><strong>Urgence:</strong> {delivery.urgence}</p>
    """
    await send_notification_email(f"🚚 Commande de {merchant['nom_entreprise']}", html)
    
    return delivery

@api_router.get("/merchant/stats")
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

@api_router.get("/merchant/profile")
async def get_merchant_profile(user: dict = Depends(get_current_user)):
    if user["role"] != "merchant":
        raise HTTPException(status_code=403, detail="Accès réservé aux commerçants")
    
    merchant = await db.merchants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not merchant:
        raise HTTPException(status_code=404, detail="Profil commerçant non trouvé")
    
    return merchant

@api_router.patch("/merchant/deliveries/{delivery_id}/notes")
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

@api_router.get("/merchant/export")
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

# ============ ADMIN ENDPOINTS ============

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    if data.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Connexion réussie"}
    raise HTTPException(status_code=401, detail="Mot de passe incorrect")

@api_router.get("/admin/delivery-requests")
async def get_delivery_requests(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.delivery_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api_router.get("/admin/feedback")
async def get_feedback(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.feedback.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api_router.get("/admin/merchants")
async def get_merchants(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.merchants.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api_router.get("/admin/riders")
async def get_riders(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.riders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api_router.get("/admin/contacts")
async def get_contacts(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api_router.get("/admin/users")
async def get_users(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    items = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
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
    
    # If accepted, create user account
    if data.status == "accepte":
        existing_user = await db.users.find_one({"email": merchant["email"].lower()})
        if not existing_user:
            # Generate default password
            default_password = f"PLB{merchant['telephone'][-4:]}"
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
            <h2>✅ Bienvenue chez PLB Logistique !</h2>
            <p>Bonjour {merchant['nom_contact']},</p>
            <p>Votre candidature commerçant pour <strong>{merchant['nom_entreprise']}</strong> a été acceptée !</p>
            <p>Voici vos identifiants de connexion :</p>
            <ul>
                <li><strong>Email:</strong> {merchant['email']}</li>
                <li><strong>Mot de passe:</strong> {default_password}</li>
            </ul>
            <p>Connectez-vous sur notre plateforme pour gérer vos livraisons.</p>
            <p>Cordialement,<br>L'équipe PLB Logistique</p>
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
        <h2>Mise à jour de votre candidature - PLB Logistique</h2>
        <p>Bonjour {merchant['nom_contact']},</p>
        <p>Votre candidature pour <strong>{merchant['nom_entreprise']}</strong> a été <strong>{status_label}</strong>.</p>
        {"<p><strong>Raison:</strong> " + data.reason + "</p>" if data.reason else ""}
        <p>Cordialement,<br>L'équipe PLB Logistique</p>
        """
        await send_notification_email(f"PLB Logistique - Candidature {status_label}", html, merchant['email'])
    
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
    
    # If accepted, create user account
    if data.status == "accepte":
        existing_user = await db.users.find_one({"email": rider["email"].lower()})
        if not existing_user:
            # Generate default password
            default_password = f"PLB{rider['telephone'][-4:]}"
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
            <h2>✅ Bienvenue chez PLB Logistique !</h2>
            <p>Bonjour {rider['prenom']} {rider['nom']},</p>
            <p>Votre candidature livreur a été acceptée !</p>
            <p>Voici vos identifiants de connexion :</p>
            <ul>
                <li><strong>Email:</strong> {rider['email']}</li>
                <li><strong>Mot de passe:</strong> {default_password}</li>
            </ul>
            <p>Connectez-vous sur notre plateforme pour voir vos livraisons assignées.</p>
            <p>Cordialement,<br>L'équipe PLB Logistique</p>
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
        <h2>Mise à jour de votre candidature - PLB Logistique</h2>
        <p>Bonjour {rider['prenom']} {rider['nom']},</p>
        <p>Votre candidature livreur a été <strong>{status_label}</strong>.</p>
        {"<p><strong>Raison:</strong> " + data.reason + "</p>" if data.reason else ""}
        <p>Cordialement,<br>L'équipe PLB Logistique</p>
        """
        await send_notification_email(f"PLB Logistique - Candidature {status_label}", html, rider['email'])
    
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

@api_router.delete("/admin/delivery-requests/{delivery_id}")
async def delete_delivery_request(delivery_id: str, password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
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
    
    return {"success": True, "message": f"Statut mis à jour: {new_status}"}

# ============ ANALYTICS ============

@api_router.get("/admin/analytics")
async def get_analytics(password: str = Query(...)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Non autorisé")
    
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

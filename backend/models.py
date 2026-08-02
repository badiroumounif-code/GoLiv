"""Pydantic models shared across route modules."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field, EmailStr


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


# Zone model for pricing
class Zone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    prix_base: int  # Base price in FCFA
    paiement_livreur: int  # Fixed rider payment in FCFA
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ZoneCreate(BaseModel):
    nom: str
    prix_base: int
    paiement_livreur: int
    is_active: bool = True


class ZoneUpdate(BaseModel):
    nom: Optional[str] = None
    prix_base: Optional[int] = None
    paiement_livreur: Optional[int] = None
    is_active: Optional[bool] = None


# Platform settings model
class PlatformSettings(BaseModel):
    id: str = "platform_settings"
    # Weight surcharge
    poids_seuil: float = 5.0  # kg threshold
    poids_supplement: int = 500  # FCFA surcharge above threshold
    # Commission
    commission_type: str = "percentage"  # "percentage" or "fixed"
    commission_value: float = 15.0  # percentage or FCFA amount
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


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
    tracking_number: Optional[str] = None  # GOLIV-YYYY-XXXXXX
    nom: str
    telephone: str
    zone_enlevement: str
    zone_livraison: str
    zone_livraison_id: Optional[str] = None  # Reference to zone for pricing
    type_colis: str
    urgence: str
    poids: Optional[float] = None  # Weight in kg (informational only)
    forfait: str = "jour"  # "jour" or "nuit" - affects pricing (+20% at night)
    notes: Optional[str] = None
    status: str = "nouveau"
    # Pricing fields
    prix_zone: Optional[int] = None  # Base price from zone
    supplement_nuit: Optional[int] = None  # Night surcharge (+20%)
    prix_total: Optional[int] = None  # Final price
    paiement_livreur: Optional[int] = None  # Rider payment
    commission_plateforme: Optional[int] = None  # Platform commission
    # Assignment fields
    livreur_id: Optional[str] = None
    livreur_nom: Optional[str] = None
    merchant_id: Optional[str] = None
    merchant_nom: Optional[str] = None
    assigned_at: Optional[str] = None
    completed_at: Optional[str] = None
    delivery_notes: Optional[str] = None
    delivery_proof: Optional[str] = None
    rider_accepted: Optional[bool] = None
    last_status_update: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class DeliveryRequestCreate(BaseModel):
    nom: str
    telephone: str
    zone_enlevement: str
    zone_livraison: str
    zone_livraison_id: Optional[str] = None
    type_colis: str
    urgence: str
    poids: Optional[float] = None
    forfait: str = "jour"  # "jour" or "nuit"
    notes: Optional[str] = None


class MerchantDeliveryCreate(BaseModel):
    nom_client: str
    telephone_client: str
    zone_enlevement: str
    zone_livraison: str
    zone_livraison_id: Optional[str] = None
    type_colis: str
    urgence: str
    poids: Optional[float] = None
    forfait: str = "jour"  # "jour" or "nuit"
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


class GoogleSessionRequest(BaseModel):
    session_id: str


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


class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # "delivery_assigned", "status_changed", "new_delivery_request", "delivery_delivered"
    title: str
    message: str
    link: Optional[str] = None
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

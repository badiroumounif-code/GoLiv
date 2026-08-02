"""Registration, login, Google OAuth exchange, /auth/me, and admin bootstrap."""
from fastapi import APIRouter, Depends, HTTPException, Query

from config import ADMIN_PASSWORD, logger
from database import db
from models import GoogleSessionRequest, User, UserLogin, UserRegister
from security import create_token, get_current_user, hash_password, verify_password

router = APIRouter()


@router.post("/auth/register")
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


@router.post("/auth/login")
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


@router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "nom": user["nom"],
        "telephone": user.get("telephone"),
        "linked_id": user.get("linked_id")
    }


@router.post("/auth/google/session")
async def google_auth_session(data: GoogleSessionRequest):
    """
    Exchange Google OAuth session_id for user data and JWT token.
    This endpoint calls Emergent Auth to validate the session and returns a JWT.
    """
    import httpx

    try:
        # Call Emergent Auth to get user data from session_id
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": data.session_id},
                timeout=10.0
            )

            if response.status_code != 200:
                logger.error(f"Emergent Auth error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=401, detail="Session Google invalide")

            google_data = response.json()
    except httpx.RequestError as e:
        logger.error(f"Emergent Auth request failed: {e}")
        raise HTTPException(status_code=500, detail="Erreur de connexion au service d'authentification")

    email = google_data.get("email", "").lower()
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Email non fourni par Google")

    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})

    if existing_user:
        # User exists - update picture if changed and return token
        if picture and existing_user.get("picture") != picture:
            await db.users.update_one(
                {"email": email},
                {"$set": {"picture": picture}}
            )

        user = existing_user
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
    else:
        # New user - create as merchant by default (can be changed later)
        new_user = User(
            email=email,
            password_hash="",  # No password for Google auth users
            role="merchant",   # Default role for new Google users
            nom=name or email.split("@")[0],
            telephone="",
            is_active=True
        )

        # Store picture for Google users
        user_dict = new_user.model_dump()
        user_dict["picture"] = picture
        user_dict["auth_provider"] = "google"

        await db.users.insert_one(user_dict)

        token = create_token(new_user.id, new_user.role, new_user.linked_id)

        logger.info(f"New Google user created: {email}")

        return {
            "success": True,
            "token": token,
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "role": new_user.role,
                "nom": new_user.nom,
                "linked_id": new_user.linked_id
            },
            "is_new_user": True
        }


@router.post("/auth/init-admin")
async def init_admin(password: str = Query(...)):
    """Initialize admin account - only works if no admin exists"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")

    # Check if admin exists
    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Un compte admin existe déjà")

    # Create admin user
    admin = User(
        email="admin@plb.bj",
        password_hash=hash_password(ADMIN_PASSWORD),
        role="admin",
        nom="Administrateur GoLiv",
        telephone=""
    )

    await db.users.insert_one(admin.model_dump())

    token = create_token(admin.id, admin.role, admin.linked_id)

    return {
        "success": True,
        "message": "Compte admin créé",
        "token": token,
        "user": {
            "id": admin.id,
            "email": admin.email,
            "role": admin.role,
            "nom": admin.nom
        }
    }

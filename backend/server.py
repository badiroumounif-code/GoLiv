"""GoLiv Logistique API entrypoint: creates the FastAPI app and wires up
all route modules. Business logic lives in routes/, models.py, security.py,
pricing.py, emails.py, and notifications.py."""
from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import client
from routes import (
    admin_config,
    admin_deliveries,
    admin_directory,
    admin_reports,
    auth_routes,
    merchant_routes,
    notifications_routes,
    public_routes,
    rider_routes,
)

# Create the main app
app = FastAPI(title="GoLiv Logistique API")

# Create a router with the /api prefix and mount every domain router onto it
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_routes.router)
api_router.include_router(public_routes.router)
api_router.include_router(rider_routes.router)
api_router.include_router(merchant_routes.router)
api_router.include_router(admin_directory.router)
api_router.include_router(admin_deliveries.router)
api_router.include_router(admin_reports.router)
api_router.include_router(admin_config.router)
api_router.include_router(notifications_routes.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

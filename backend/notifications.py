"""In-app notification helpers (persisted to the notifications collection)."""
from typing import Optional

from config import logger
from database import db
from models import Notification


async def create_notification(user_id: str, type: str, title: str, message: str, link: Optional[str] = None):
    """Persist an in-app notification for a single user. Silently no-ops on bad input."""
    if not user_id:
        return None
    notif = Notification(user_id=user_id, type=type, title=title, message=message, link=link)
    try:
        await db.notifications.insert_one(notif.model_dump())
        return notif.id
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        return None


async def notify_admins(type: str, title: str, message: str, link: Optional[str] = None):
    """Send a notification to every admin user."""
    admins = await db.users.find({"role": "admin", "is_active": True}, {"_id": 0, "id": 1}).to_list(50)
    for a in admins:
        await create_notification(a["id"], type, title, message, link)


async def notify_rider_by_id(rider_id: str, type: str, title: str, message: str, link: Optional[str] = None):
    """Resolve the rider's linked user_id then send notification."""
    rider = await db.riders.find_one({"id": rider_id}, {"_id": 0, "user_id": 1})
    if rider and rider.get("user_id"):
        await create_notification(rider["user_id"], type, title, message, link)


async def notify_merchant_by_id(merchant_id: str, type: str, title: str, message: str, link: Optional[str] = None):
    """Resolve the merchant's linked user_id then send notification."""
    merchant = await db.merchants.find_one({"id": merchant_id}, {"_id": 0, "user_id": 1})
    if merchant and merchant.get("user_id"):
        await create_notification(merchant["user_id"], type, title, message, link)

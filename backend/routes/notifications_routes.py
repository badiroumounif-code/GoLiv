"""In-app notification endpoints for the current authenticated user."""
from fastapi import APIRouter, Depends, HTTPException

from database import db
from security import get_current_user

router = APIRouter()


@router.get("/notifications")
async def list_my_notifications(limit: int = 20, user: dict = Depends(get_current_user)):
    """Return the current user's latest notifications, newest first."""
    notifs = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(min(max(limit, 1), 100)).to_list(100)
    return notifs


@router.get("/notifications/unread-count")
async def my_unread_count(user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"count": count}


@router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notif_id, "user_id": user["id"]},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    return {"success": True}


@router.patch("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    result = await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"success": True, "updated": result.modified_count}

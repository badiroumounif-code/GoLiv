"""Transactional email delivery via Resend."""
import asyncio

from config import ADMIN_EMAIL, RESEND_API_KEY, SENDER_EMAIL, logger


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

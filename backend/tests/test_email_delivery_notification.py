"""
Email notification tests for delivery request creation.

Verifies:
  1. POST /api/delivery-requests succeeds (200) and returns a tracking_number
  2. Backend log shows either
        - INFO 'Email sent successfully: ... <tracking_number>' on success, OR
        - ERROR 'Failed to send email: ...' on Resend failure (graceful failure)
     but never crashes the request.
  3. When ADMIN_EMAIL matches Resend verified sender (badiroumounif@gmail.com),
     the success path should be hit and the tracking number appears in the log.
  4. send_notification_email is imported and unit-tested directly to confirm
     return value True/False semantics.
"""

import os
import re
import time
import asyncio
import pytest
import requests

def _load_frontend_backend_url() -> str:
    """Read REACT_APP_BACKEND_URL from frontend/.env if not present in os.environ."""
    v = os.environ.get('REACT_APP_BACKEND_URL', '').strip()
    if v:
        return v.rstrip('/')
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip().strip('"').rstrip('/')
    except Exception:
        pass
    return ''


BASE_URL = _load_frontend_backend_url()
BACKEND_LOG = '/var/log/supervisor/backend.err.log'


def _read_log() -> str:
    try:
        with open(BACKEND_LOG, 'r', errors='ignore') as f:
            return f.read()
    except Exception:
        return ''


def _tail_since(offset: int) -> str:
    """Read the backend log starting from the given byte offset."""
    try:
        with open(BACKEND_LOG, 'r', errors='ignore') as f:
            f.seek(offset)
            return f.read()
    except Exception:
        return ''


def _log_offset() -> int:
    try:
        return os.path.getsize(BACKEND_LOG)
    except Exception:
        return 0


# ---------- Fixtures ----------

@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_email_config():
    """Read ADMIN_EMAIL from backend .env for assertion."""
    env_path = '/app/backend/.env'
    admin_email = None
    sender_email = None
    with open(env_path) as f:
        for line in f:
            if line.startswith('ADMIN_EMAIL='):
                admin_email = line.split('=', 1)[1].strip().strip('"')
            if line.startswith('SENDER_EMAIL='):
                sender_email = line.split('=', 1)[1].strip().strip('"')
    return {"admin_email": admin_email, "sender_email": sender_email}


# ---------- Config sanity ----------

class TestEmailConfiguration:
    """Verify env is set up correctly for the Resend sandbox flow."""

    def test_admin_email_is_verified_resend_owner(self, admin_email_config):
        assert admin_email_config["admin_email"] == "badiroumounif@gmail.com", (
            f"ADMIN_EMAIL must equal Resend verified owner. "
            f"Got: {admin_email_config['admin_email']}"
        )

    def test_sender_email_configured(self, admin_email_config):
        assert admin_email_config["sender_email"], "SENDER_EMAIL must be configured"

    def test_backend_url_available(self):
        assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

    def test_health_endpoint(self, api):
        r = api.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"


# ---------- Integration: POST /api/delivery-requests triggers email ----------

class TestDeliveryEmailNotification:
    """End-to-end: create delivery -> verify email log line."""

    def test_create_delivery_triggers_email_and_returns_tracking(self, api):
        # Capture log offset BEFORE the call so we only inspect new lines
        offset_before = _log_offset()

        payload = {
            "nom": "TEST_EmailNotif_Client",
            "telephone": "+22990112233",
            "zone_enlevement": "Cotonou",
            "zone_livraison": "Calavi",
            "type_colis": "Documents",
            "urgence": "standard",
            "poids": 1.5,
            "forfait": "jour",
            "notes": "Automated email delivery notification test"
        }

        r = api.post(f"{BASE_URL}/api/delivery-requests", json=payload, timeout=30)
        # Status assertion: creation must succeed even if email backend fails
        assert r.status_code == 200, (
            f"Expected 200 from /api/delivery-requests, got {r.status_code}: {r.text}"
        )

        body = r.json()
        # Response structural assertions
        assert "tracking_number" in body and body["tracking_number"], "tracking_number missing"
        assert body["status"] == "nouveau"
        assert body["nom"] == payload["nom"]
        # Financial fields must be stripped from public response
        assert "commission_plateforme" not in body
        assert "paiement_livreur" not in body

        tracking = body["tracking_number"]
        assert re.match(r"^GOLIV-\d{4}-\d{6}$", tracking), (
            f"Malformed tracking_number: {tracking}"
        )

        # Give asyncio.to_thread + Resend a moment to complete + flush the log
        time.sleep(5)

        new_log = _tail_since(offset_before)

        success_marker = f"Email sent successfully: 🚚 Livraison {tracking}"
        failure_marker = "Failed to send email"

        success_hit = success_marker in new_log
        failure_hit = failure_marker in new_log

        # === Clear result log for handoff ===
        print("\n" + "=" * 72)
        print(f"TRACKING NUMBER : {tracking}")
        print(f"HTTP STATUS     : {r.status_code}")
        print(f"SUCCESS IN LOG  : {success_hit}")
        print(f"FAILURE IN LOG  : {failure_hit}")
        if success_hit:
            print("RESULT          : ✅ EMAIL SENT SUCCESSFULLY TO ADMIN_EMAIL")
        elif failure_hit:
            print("RESULT          : ⚠️  EMAIL SEND FAILED (graceful) — see error line")
            # Extract the exact error line
            for line in new_log.splitlines():
                if failure_marker in line:
                    print(f"ERROR LINE      : {line}")
                    break
        else:
            print("RESULT          : ❌ NO EMAIL LOG LINE FOUND (function may not have been called)")
        print("=" * 72 + "\n")

        # Assertion: at LEAST one of success/failure log line must appear —
        # i.e., send_notification_email was invoked. It must not crash silently.
        assert success_hit or failure_hit, (
            f"Expected either success or failure email log line for tracking={tracking}. "
            f"Neither was found in the new log window."
        )

        # Primary assertion given the current config (ADMIN_EMAIL == verified owner):
        # the send must succeed.
        assert success_hit, (
            f"ADMIN_EMAIL is set to the Resend verified owner "
            f"(badiroumounif@gmail.com) — email should send successfully. "
            f"Expected marker not found: '{success_marker}'. "
            f"Recent log window excerpt:\n{new_log[-2000:]}"
        )

    def test_create_delivery_does_not_crash_on_email(self, api):
        """
        Even if Resend fails, the endpoint must still return 200 (graceful failure).
        We simulate this by sending a normal request and confirming 200 regardless
        of whether the email succeeded.
        """
        payload = {
            "nom": "TEST_EmailGraceful",
            "telephone": "+22990554433",
            "zone_enlevement": "Ganhi",
            "zone_livraison": "Fidjrosse",
            "type_colis": "Vetements",
            "urgence": "express",
            "poids": 2.0,
            "forfait": "jour",
        }
        r = api.post(f"{BASE_URL}/api/delivery-requests", json=payload, timeout=30)
        assert r.status_code == 200
        assert r.json().get("tracking_number", "").startswith("GOLIV-")


# ---------- Unit test: send_notification_email return value ----------

class TestSendNotificationEmailUnit:
    """Directly exercise send_notification_email() to confirm return semantics."""

    def test_returns_true_on_success(self):
        # Import server (which loads .env) and call the coroutine
        import sys
        sys.path.insert(0, '/app/backend')
        from server import send_notification_email

        async def _run():
            return await send_notification_email(
                subject="🚚 Livraison GOLIV-UNIT-TEST - Direct Unit Test",
                html_content="<p>Unit test — should be delivered to verified owner.</p>",
                to_email="badiroumounif@gmail.com",
            )

        result = asyncio.run(_run())
        print(f"\n[UNIT] send_notification_email(to verified owner) -> {result}")
        assert result is True, "Expected True when sending to Resend verified owner"

    def test_returns_false_on_unverified_recipient(self):
        import sys
        sys.path.insert(0, '/app/backend')
        from server import send_notification_email

        async def _run():
            return await send_notification_email(
                subject="TEST — should fail gracefully",
                html_content="<p>Sending to non-verified address in sandbox.</p>",
                to_email="unverified-target-test@example.com",
            )

        result = asyncio.run(_run())
        print(f"\n[UNIT] send_notification_email(to unverified) -> {result}")
        # In sandbox this should return False (graceful failure), NOT raise.
        assert result is False, "Expected False on Resend sandbox rejection"

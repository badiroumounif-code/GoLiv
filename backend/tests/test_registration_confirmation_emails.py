"""
Confirmation email tests for rider & merchant registration.

Verifies (iteration 10 feature):
  1. POST /api/riders sends BOTH admin notification email AND confirmation email to rider.email
  2. POST /api/merchants sends BOTH admin notification email AND confirmation email to merchant.email
  3. Confirmation email subject is exactly: '✅ GoLiv - Candidature reçue ({name})'
  4. Confirmation emails are sent IN ADDITION to admin notification emails
  5. Backend logs show BOTH 'Email sent successfully' lines (admin + confirmation)
  6. Graceful failure: if confirmation email would fail (unverified recipient), endpoint still returns 200

Uses ADMIN_EMAIL (badiroumounif@gmail.com) as the applicant's email since Resend is in
sandbox mode and only allows sending to that verified owner address. This makes BOTH
outgoing emails succeed.
"""

import os
import time
import pytest
import requests


# ---------- Helpers ----------

def _load_frontend_backend_url() -> str:
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
VERIFIED_OWNER_EMAIL = 'badiroumounif@gmail.com'


def _log_offset() -> int:
    try:
        return os.path.getsize(BACKEND_LOG)
    except Exception:
        return 0


def _tail_since(offset: int) -> str:
    try:
        with open(BACKEND_LOG, 'r', errors='ignore') as f:
            f.seek(offset)
            return f.read()
    except Exception:
        return ''


# ---------- Fixtures ----------

@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Sanity ----------

class TestSanity:
    def test_base_url(self):
        assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

    def test_health(self, api):
        r = api.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200


# ---------- Rider confirmation email ----------

class TestRiderConfirmationEmail:
    """POST /api/riders must send BOTH admin notification + confirmation email."""

    def test_rider_registration_sends_two_emails(self, api):
        offset_before = _log_offset()

        # Unique suffix to distinguish this run's log lines
        suffix = str(int(time.time()))
        prenom = "TEST_RiderConf"
        nom = f"Confirm{suffix}"

        payload = {
            "nom": nom,
            "prenom": prenom,
            "telephone": "+22997001122",
            "email": VERIFIED_OWNER_EMAIL,  # sandbox verified owner
            "zone_couverture": "Cotonou",
            "type_vehicule": "Moto",
            "experience": "2 ans",
            "disponibilite": "Temps plein",
            "message": "Automated confirmation email test",
        }

        r = api.post(f"{BASE_URL}/api/riders", json=payload, timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

        body = r.json()
        assert body.get("email") == VERIFIED_OWNER_EMAIL
        assert body.get("nom") == nom
        assert body.get("prenom") == prenom
        assert body.get("status") == "en_attente"
        assert "id" in body

        # Wait for both async email sends via asyncio.to_thread + Resend
        time.sleep(8)

        new_log = _tail_since(offset_before)

        # 1) Admin notification email
        admin_marker = f"Email sent successfully: 🏍️ Nouveau livreur: {prenom} {nom}"
        # 2) Confirmation email to rider
        confirm_marker = f"Email sent successfully: ✅ GoLiv - Candidature reçue ({prenom} {nom})"

        admin_hit = admin_marker in new_log
        confirm_hit = confirm_marker in new_log

        print("\n" + "=" * 72)
        print(f"RIDER           : {prenom} {nom}")
        print(f"HTTP STATUS     : {r.status_code}")
        print(f"ADMIN EMAIL LOG : {admin_hit}  -> '{admin_marker}'")
        print(f"CONFIRM EMAIL   : {confirm_hit} -> '{confirm_marker}'")
        if not (admin_hit and confirm_hit):
            print("---- new log tail (last 3000 chars) ----")
            print(new_log[-3000:])
        print("=" * 72 + "\n")

        assert admin_hit, (
            f"Admin notification email log line missing. Expected marker: '{admin_marker}'"
        )
        assert confirm_hit, (
            f"Rider confirmation email log line missing. Expected marker: '{confirm_marker}'"
        )

    def test_rider_confirmation_graceful_when_unverified(self, api):
        """Even if the rider's email is not verified by Resend, POST must still return 200
        and the admin notification must still succeed."""
        offset_before = _log_offset()

        suffix = str(int(time.time())) + "b"
        prenom = "TEST_RiderGraceful"
        nom = f"Unverified{suffix}"

        payload = {
            "nom": nom,
            "prenom": prenom,
            "telephone": "+22997889977",
            # Unverified target -> confirmation email will be rejected by Resend sandbox
            "email": "unverified-rider-target@example.com",
            "zone_couverture": "Calavi",
            "type_vehicule": "Vélo",
            "experience": "1 an",
            "disponibilite": "Weekends",
        }

        r = api.post(f"{BASE_URL}/api/riders", json=payload, timeout=30)
        assert r.status_code == 200, (
            f"Endpoint must not crash on email failure. Got {r.status_code}: {r.text}"
        )
        body = r.json()
        assert body.get("email") == payload["email"]

        time.sleep(6)
        new_log = _tail_since(offset_before)

        admin_marker = f"Email sent successfully: 🏍️ Nouveau livreur: {prenom} {nom}"
        confirm_success = f"Email sent successfully: ✅ GoLiv - Candidature reçue ({prenom} {nom})"
        failure_marker = "Failed to send email"

        print("\n" + "=" * 72)
        print(f"RIDER (unverified email) : {prenom} {nom}")
        print(f"ADMIN EMAIL SENT         : {admin_marker in new_log}")
        print(f"CONFIRM EMAIL SENT       : {confirm_success in new_log}")
        print(f"FAILURE LINE PRESENT     : {failure_marker in new_log}")
        print("=" * 72 + "\n")

        # Admin email should still succeed (goes to badiroumounif@gmail.com)
        assert admin_marker in new_log, (
            "Admin notification email should succeed even when rider email is unverified"
        )
        # Confirmation email will fail — verify function was called (either success or failure line)
        assert (confirm_success in new_log) or (failure_marker in new_log), (
            "Confirmation email path must be invoked (either success or failure line expected)"
        )


# ---------- Merchant confirmation email ----------

class TestMerchantConfirmationEmail:
    """POST /api/merchants must send BOTH admin notification + confirmation email."""

    def test_merchant_registration_sends_two_emails(self, api):
        offset_before = _log_offset()

        suffix = str(int(time.time())) + "m"
        nom_entreprise = f"TEST_MerchantCorp{suffix}"

        payload = {
            "nom_entreprise": nom_entreprise,
            "nom_contact": "TEST_Contact Confirm",
            "telephone": "+22996112233",
            "email": VERIFIED_OWNER_EMAIL,
            "adresse": "Cotonou, Zone Test",
            "type_produits": "Électronique",
            "volume_mensuel": "50-100 colis",
            "message": "Automated merchant confirmation test",
        }

        r = api.post(f"{BASE_URL}/api/merchants", json=payload, timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

        body = r.json()
        assert body.get("nom_entreprise") == nom_entreprise
        assert body.get("email") == VERIFIED_OWNER_EMAIL
        assert body.get("status") == "en_attente"
        assert "id" in body

        time.sleep(8)
        new_log = _tail_since(offset_before)

        admin_marker = f"Email sent successfully: 🏪 Nouveau commerçant: {nom_entreprise}"
        confirm_marker = f"Email sent successfully: ✅ GoLiv - Candidature reçue ({nom_entreprise})"

        admin_hit = admin_marker in new_log
        confirm_hit = confirm_marker in new_log

        print("\n" + "=" * 72)
        print(f"MERCHANT        : {nom_entreprise}")
        print(f"HTTP STATUS     : {r.status_code}")
        print(f"ADMIN EMAIL LOG : {admin_hit}  -> '{admin_marker}'")
        print(f"CONFIRM EMAIL   : {confirm_hit} -> '{confirm_marker}'")
        if not (admin_hit and confirm_hit):
            print("---- new log tail (last 3000 chars) ----")
            print(new_log[-3000:])
        print("=" * 72 + "\n")

        assert admin_hit, (
            f"Admin notification email log line missing. Expected marker: '{admin_marker}'"
        )
        assert confirm_hit, (
            f"Merchant confirmation email log line missing. Expected marker: '{confirm_marker}'"
        )

    def test_merchant_confirmation_graceful_when_unverified(self, api):
        offset_before = _log_offset()

        suffix = str(int(time.time())) + "mg"
        nom_entreprise = f"TEST_MerchantGrace{suffix}"

        payload = {
            "nom_entreprise": nom_entreprise,
            "nom_contact": "TEST_Grace Contact",
            "telephone": "+22996223344",
            "email": "unverified-merchant-target@example.com",
            "adresse": "Calavi Test",
            "type_produits": "Cosmétiques",
            "volume_mensuel": "10-20 colis",
        }

        r = api.post(f"{BASE_URL}/api/merchants", json=payload, timeout=30)
        assert r.status_code == 200, (
            f"Endpoint must not crash on email failure. Got {r.status_code}: {r.text}"
        )

        time.sleep(6)
        new_log = _tail_since(offset_before)

        admin_marker = f"Email sent successfully: 🏪 Nouveau commerçant: {nom_entreprise}"
        confirm_success = f"Email sent successfully: ✅ GoLiv - Candidature reçue ({nom_entreprise})"
        failure_marker = "Failed to send email"

        print("\n" + "=" * 72)
        print(f"MERCHANT (unverified email) : {nom_entreprise}")
        print(f"ADMIN EMAIL SENT            : {admin_marker in new_log}")
        print(f"CONFIRM EMAIL SENT          : {confirm_success in new_log}")
        print(f"FAILURE LINE PRESENT        : {failure_marker in new_log}")
        print("=" * 72 + "\n")

        assert admin_marker in new_log, (
            "Admin notification email should succeed even when merchant email is unverified"
        )
        assert (confirm_success in new_log) or (failure_marker in new_log), (
            "Confirmation email path must be invoked (either success or failure line expected)"
        )

"""
Iteration 6 backend tests:
- Google Auth endpoint /api/auth/google/session (invalid session_id -> 401, missing payload -> 422)
- Standard JWT login for admin (admin@plb.bj / plb2024)
- CSV export endpoints (delivery-requests, riders, merchants, feedback) return 200 with proper headers
"""
import csv
import io
import os
import pytest
import requests


def _resolve_base_url():
    val = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if not val:
        try:
            with open("/app/frontend/.env") as fh:
                for line in fh:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        val = line.split("=", 1)[1].strip()
                        break
        except FileNotFoundError:
            pass
    return val.rstrip("/")


BASE_URL = _resolve_base_url()
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@plb.bj')  # Use env var in production
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'plb2024')  # Use env var in production


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --------- Google Auth ---------

class TestGoogleAuthSession:
    """Google OAuth session exchange endpoint."""

    def test_google_session_invalid_session_id_returns_401(self, session):
        """Invalid session_id should be rejected with 401 by Emergent Auth -> our endpoint returns 401."""
        resp = session.post(
            f"{BASE_URL}/api/auth/google/session",
            json={"session_id": "invalid-session-id-xyz-12345"},
        )
        # Emergent Auth rejects the bad session id -> our endpoint surfaces 401
        # (500 would also indicate an upstream connection error which is acceptable to flag separately)
        assert resp.status_code == 401, (
            f"Expected 401 for invalid session_id, got {resp.status_code}: {resp.text}"
        )
        data = resp.json()
        assert "detail" in data
        assert "invalide" in data["detail"].lower() or "invalid" in data["detail"].lower()

    def test_google_session_missing_session_id_returns_422(self, session):
        """Empty/missing payload should fail Pydantic validation (422)."""
        resp = session.post(f"{BASE_URL}/api/auth/google/session", json={})
        assert resp.status_code == 422, (
            f"Expected 422 for missing session_id, got {resp.status_code}: {resp.text}"
        )

    def test_google_session_empty_session_id_returns_401(self, session):
        """Empty string session_id is technically valid pydantic but will be rejected upstream."""
        resp = session.post(
            f"{BASE_URL}/api/auth/google/session",
            json={"session_id": ""},
        )
        # Empty string -> Emergent Auth returns non-200 -> we return 401
        assert resp.status_code in (401, 400, 422), (
            f"Expected 401/400/422 for empty session_id, got {resp.status_code}: {resp.text}"
        )


# --------- Standard JWT login (regression) ---------

class TestStandardLogin:
    def test_admin_login_jwt(self, session):
        resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert resp.status_code == 200, f"Admin login failed: {resp.status_code} {resp.text}"
        data = resp.json()
        assert data.get("success") is True
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"

    def test_admin_login_wrong_password(self, session):
        resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrong"},
        )
        assert resp.status_code == 401

    def test_auth_me_with_token(self, session):
        login = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        token = login.json()["token"]
        me = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me.status_code == 200
        body = me.json()
        assert body["email"] == ADMIN_EMAIL
        assert body["role"] == "admin"


# --------- CSV Exports ---------

EXPORT_PATHS = [
    ("delivery-requests", "demandes_livraison.csv",
     ["id", "tracking_number", "status", "prix_total"]),
    ("riders", "livreurs.csv",
     ["id", "nom", "prenom", "telephone", "status"]),
    ("merchants", "commercants.csv",
     ["id", "nom_entreprise", "nom_contact", "telephone", "status"]),
    ("feedback", "avis_clients.csv",
     ["id", "nom", "note"]),
]


@pytest.mark.parametrize("endpoint,filename,expected_headers", EXPORT_PATHS)
def test_csv_export_returns_200(session, endpoint, filename, expected_headers):
    url = f"{BASE_URL}/api/admin/export/{endpoint}?password={ADMIN_PASSWORD}"
    resp = requests.get(url, timeout=20)
    assert resp.status_code == 200, (
        f"/api/admin/export/{endpoint} returned {resp.status_code}: {resp.text[:300]}"
    )

    # Content-Type CSV
    ct = resp.headers.get("content-type", "")
    assert "text/csv" in ct.lower(), f"Expected text/csv content-type, got {ct}"

    # Content-Disposition includes filename
    disp = resp.headers.get("content-disposition", "")
    assert filename in disp, f"Expected filename {filename} in content-disposition, got {disp}"

    # Parse CSV body and check header row
    body = resp.text
    reader = csv.reader(io.StringIO(body))
    header_row = next(reader, None)
    assert header_row is not None and len(header_row) > 0, "CSV has no header row"
    for col in expected_headers:
        assert col in header_row, (
            f"Expected column '{col}' in {endpoint} CSV header, got {header_row}"
        )


def test_csv_export_wrong_password(session):
    resp = requests.get(
        f"{BASE_URL}/api/admin/export/delivery-requests?password=wrong"
    )
    assert resp.status_code == 401

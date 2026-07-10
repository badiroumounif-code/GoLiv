"""
Security regression tests for the JWT admin auth migration.

Verifies that all admin routes previously using `password: str = Query(...)`
now require a JWT Bearer token via `get_admin_user`:
  - 401 without any Authorization header
  - 403 with a non-admin (rider) token
  - 200 with an admin token
"""

import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is not set")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@plb.bj"
ADMIN_PASSWORD = "plb2024"
RIDER_EMAIL = "badirouadeniyi@gmail.com"
RIDER_PASSWORD = "PLB7514"


# --------- fixtures ---------

@pytest.fixture(scope="session")
def admin_token():
    # Ensure admin exists (idempotent)
    try:
        requests.post(f"{API}/auth/init-admin", params={"password": ADMIN_PASSWORD}, timeout=15)
    except requests.RequestException:
        pass
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    data = r.json()
    assert data.get("user", {}).get("role") == "admin"
    return data["token"]


@pytest.fixture(scope="session")
def rider_token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": RIDER_EMAIL, "password": RIDER_PASSWORD}, timeout=15)
    if r.status_code != 200:
        # Try to register a rider for testing role-based rejection.
        reg = requests.post(f"{API}/auth/register", json={
            "email": f"TEST_rider_jwt_{os.getpid()}@example.com",
            "password": "TestRider!234",
            "nom": "TEST Rider JWT",
            "telephone": "+22990000000",
            "role": "rider"
        }, timeout=15)
        if reg.status_code == 200:
            return reg.json()["token"]
        pytest.skip(f"Rider login failed ({r.status_code}) and rider register failed ({reg.status_code})")
    data = r.json()
    role = data.get("user", {}).get("role")
    if role == "admin":
        pytest.skip(f"Rider fixture unexpectedly logged in as admin (role={role})")
    return data["token"]


# --------- helpers ---------

ADMIN_GET_ENDPOINTS = [
    "/admin/stats",
    "/admin/analytics",
    "/admin/delivery-requests",
    "/admin/feedback",
    "/admin/merchants",
    "/admin/riders",
    "/admin/contacts",
    "/admin/users",
    "/admin/zones",
    "/admin/settings",
    "/admin/financial",
    "/admin/export/delivery-requests",
    "/admin/export/feedback",
    "/admin/export/merchants",
    "/admin/export/riders",
    "/admin/export/finances",
]


# --------- 401 without any token ---------

@pytest.mark.parametrize("path", ADMIN_GET_ENDPOINTS)
def test_admin_get_returns_401_without_token(path):
    r = requests.get(f"{API}{path}", timeout=15)
    # FastAPI HTTPBearer without a header returns 403 by default (Not authenticated).
    # After the fix the correct expectation is 401 or 403 — but critically NOT 200 and
    # NOT the old password-query behaviour.
    assert r.status_code in (401, 403), \
        f"{path} expected 401/403 without token, got {r.status_code}: {r.text[:200]}"
    # Ensure the endpoint no longer accepts password= as a bypass
    r2 = requests.get(f"{API}{path}", params={"password": ADMIN_PASSWORD}, timeout=15)
    assert r2.status_code in (401, 403), \
        f"SECURITY: {path} still returns {r2.status_code} with ?password= query"


# --------- 403 with non-admin token ---------

@pytest.mark.parametrize("path", ADMIN_GET_ENDPOINTS)
def test_admin_get_returns_403_with_non_admin_token(path, rider_token):
    r = requests.get(f"{API}{path}",
                     headers={"Authorization": f"Bearer {rider_token}"}, timeout=15)
    assert r.status_code == 403, \
        f"{path} expected 403 with rider token, got {r.status_code}: {r.text[:200]}"
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    detail = (body.get("detail") or "").lower()
    assert "admin" in detail or "réserv" in detail or "reserv" in detail, \
        f"{path} 403 detail should mention admin-only, got: {body}"


# --------- 200 with admin token (core endpoints) ---------

@pytest.mark.parametrize("path", [
    "/admin/stats",
    "/admin/delivery-requests",
    "/admin/zones",
    "/admin/financial",
    "/admin/merchants",
    "/admin/riders",
])
def test_admin_get_returns_200_with_admin_token(path, admin_token):
    r = requests.get(f"{API}{path}",
                     headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
    assert r.status_code == 200, \
        f"{path} expected 200 with admin token, got {r.status_code}: {r.text[:200]}"
    # Response should be JSON list or dict
    ctype = r.headers.get("content-type", "")
    assert "application/json" in ctype, f"{path} unexpected content-type: {ctype}"


# --------- CSV export with admin token ---------

@pytest.mark.parametrize("path", [
    "/admin/export/delivery-requests",
    "/admin/export/riders",
    "/admin/export/merchants",
    "/admin/export/feedback",
    "/admin/export/finances",
])
def test_admin_csv_export_with_admin_token(path, admin_token):
    r = requests.get(f"{API}{path}",
                     headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
    assert r.status_code == 200, \
        f"{path} expected 200 with admin token, got {r.status_code}: {r.text[:200]}"
    ctype = r.headers.get("content-type", "")
    assert "text/csv" in ctype, f"{path} should return text/csv, got {ctype}"
    assert "attachment" in r.headers.get("content-disposition", "").lower()


# --------- Zone PATCH / DELETE with JWT auth ---------

def test_admin_zone_crud_with_jwt(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Ensure default zones exist
    requests.post(f"{API}/admin/init-zones", headers=headers, timeout=15)

    # CREATE
    zone_payload = {
        "nom": f"TEST_ZONE_{os.getpid()}",
        "prix_base": 1200,
        "paiement_livreur": 700,
    }
    r = requests.post(f"{API}/admin/zones", json=zone_payload, headers=headers, timeout=15)
    assert r.status_code == 200, f"POST /admin/zones failed: {r.status_code} {r.text[:200]}"
    zone = r.json()
    assert zone.get("nom") == zone_payload["nom"]
    zone_id = zone["id"]

    # PATCH — no token → 401/403
    r_no_auth = requests.patch(f"{API}/admin/zones/{zone_id}", json={"prix_base": 1500}, timeout=15)
    assert r_no_auth.status_code in (401, 403)

    # PATCH — with admin token → 200
    r_patch = requests.patch(f"{API}/admin/zones/{zone_id}",
                             json={"prix_base": 1500}, headers=headers, timeout=15)
    assert r_patch.status_code == 200, f"PATCH failed: {r_patch.status_code} {r_patch.text[:200]}"

    # Verify persistence via GET
    r_get = requests.get(f"{API}/admin/zones", headers=headers, timeout=15)
    assert r_get.status_code == 200
    updated = next((z for z in r_get.json() if z["id"] == zone_id), None)
    assert updated is not None
    assert updated["prix_base"] == 1500

    # DELETE — no token → 401/403
    r_del_no_auth = requests.delete(f"{API}/admin/zones/{zone_id}", timeout=15)
    assert r_del_no_auth.status_code in (401, 403)

    # DELETE — with admin token → 200
    r_del = requests.delete(f"{API}/admin/zones/{zone_id}", headers=headers, timeout=15)
    assert r_del.status_code == 200, f"DELETE failed: {r_del.status_code} {r_del.text[:200]}"


# --------- delivery status update with JWT (PATCH admin route) ---------

def test_admin_delivery_status_update_requires_admin_jwt(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Get one delivery to try updating (if any exists)
    r = requests.get(f"{API}/admin/delivery-requests", headers=headers, timeout=15)
    assert r.status_code == 200
    items = r.json()
    if not items:
        pytest.skip("No delivery requests to test PATCH against")

    delivery_id = items[0]["id"]

    # No auth → 401/403
    r_no = requests.patch(f"{API}/admin/delivery-requests/{delivery_id}/status",
                          json={"status": items[0].get("status", "en_attente")}, timeout=15)
    assert r_no.status_code in (401, 403)

    # Old ?password= should NOT work anymore
    r_pwd = requests.patch(f"{API}/admin/delivery-requests/{delivery_id}/status",
                           params={"password": ADMIN_PASSWORD},
                           json={"status": items[0].get("status", "en_attente")}, timeout=15)
    assert r_pwd.status_code in (401, 403), \
        f"SECURITY: password query still accepted (got {r_pwd.status_code})"


# --------- financial dashboard sanity ---------

def test_admin_financial_with_jwt(admin_token):
    r = requests.get(f"{API}/admin/financial",
                     headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
    assert r.status_code == 200
    body = r.json()
    # Should have at least top-level totals keys — smoke check only
    assert isinstance(body, dict)


# --------- invalid / expired token ---------

def test_admin_route_rejects_garbage_token():
    r = requests.get(f"{API}/admin/stats",
                     headers={"Authorization": "Bearer not-a-real-jwt"}, timeout=15)
    assert r.status_code == 401

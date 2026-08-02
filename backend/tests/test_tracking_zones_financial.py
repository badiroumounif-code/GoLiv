"""
Backend API Tests for GoLiv Logistique - Tracking, Zones, and Financial Features
Tests: Tracking numbers, Zone-based pricing, Weight surcharge, Financial dashboard

Note: previously relied on (a) a `?password=` query param on admin routes,
removed when admin routes migrated to JWT Bearer auth (see
test_admin_jwt_security.py), and (b) hardcoded PLB-2026-0000xx tracking
numbers assumed to pre-exist in the DB, which no longer applies now that
tracking numbers are generated as GOLIV-YYYY-XXXXXX. Both are fixed here:
admin calls use a real admin JWT, and tracking tests create their own
delivery first instead of depending on pre-seeded records.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@plb.bj"
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'plb2024')


@pytest.fixture(scope="module")
def admin_token():
    """Log in as admin, self-seeding the account if it doesn't exist yet."""
    try:
        requests.post(f"{API}/auth/init-admin", params={"password": ADMIN_PASSWORD}, timeout=15)
    except requests.RequestException:
        pass
    r = requests.post(f"{API}/auth/login",
                       json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _create_test_delivery(**overrides):
    """Create a delivery request and return its JSON body (includes tracking_number)."""
    zones = requests.get(f"{API}/zones", timeout=15).json()
    assert zones, "No active zones to create a test delivery against"
    zone = zones[0]
    payload = {
        "nom": "TEST_TrackingFixture",
        "telephone": "+229 97 00 11 22",
        "zone_enlevement": "Cotonou - Centre",
        "zone_livraison": zone["nom"],
        "zone_livraison_id": zone["id"],
        "type_colis": "petit_colis",
        "urgence": "standard",
        "poids": 3.0,
        "notes": "Seeded by test_tracking_zones_financial.py",
    }
    payload.update(overrides)
    response = requests.post(f"{API}/delivery-requests", json=payload, timeout=15)
    assert response.status_code == 200, f"Failed to seed delivery: {response.status_code} {response.text}"
    return response.json(), zone


class TestTrackingEndpoint:
    """Public tracking endpoint tests"""

    def test_track_valid_number(self):
        """Test tracking a freshly created delivery returns matching data"""
        created, _ = _create_test_delivery()
        response = requests.get(f"{API}/track/{created['tracking_number']}")
        assert response.status_code == 200
        data = response.json()
        assert data["tracking_number"] == created["tracking_number"]
        assert "status" in data
        assert "status_label" in data
        assert "zone_enlevement" in data
        assert "zone_livraison" in data
        assert "created_at" in data
        print(f"SUCCESS: Tracking {created['tracking_number']} returned status: {data['status_label']}")

    def test_track_invalid_number(self):
        """Test tracking with invalid tracking number returns 404"""
        response = requests.get(f"{API}/track/INVALID-NUMBER")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "introuvable" in data["detail"].lower()
        print("SUCCESS: Invalid tracking number correctly returns 404")

    def test_track_case_insensitive(self):
        """Test tracking is case insensitive"""
        created, _ = _create_test_delivery()
        response = requests.get(f"{API}/track/{created['tracking_number'].lower()}")
        assert response.status_code == 200
        data = response.json()
        assert data["tracking_number"] == created["tracking_number"]
        print("SUCCESS: Tracking is case insensitive")


class TestZonesEndpoint:
    """Zone pricing endpoint tests"""

    def test_get_active_zones(self):
        """Test public zones endpoint returns active zones with prices"""
        response = requests.get(f"{API}/zones")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

        zone = data[0]
        assert "id" in zone
        assert "nom" in zone
        assert "prix_base" in zone
        assert "paiement_livreur" in zone
        assert "is_active" in zone

        for z in data:
            assert z["is_active"] == True

        print(f"SUCCESS: Got {len(data)} active zones with pricing")
        for z in data:
            print(f"  - {z['nom']}: {z['prix_base']} FCFA (rider: {z['paiement_livreur']} FCFA)")

    def test_zones_have_expected_shape(self):
        """Test zones have the expected pricing fields with sane values"""
        response = requests.get(f"{API}/zones")
        assert response.status_code == 200
        data = response.json()
        assert data, "No active zones returned"

        for z in data:
            assert isinstance(z["prix_base"], (int, float)) and z["prix_base"] > 0
            assert isinstance(z["paiement_livreur"], (int, float)) and z["paiement_livreur"] >= 0

        print("SUCCESS: Zones have well-formed pricing fields")


class TestAdminZonesManagement:
    """Admin zone management tests"""

    def test_admin_get_all_zones(self, admin_headers):
        """Test admin can get all zones"""
        response = requests.get(f"{API}/admin/zones", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Admin retrieved {len(data)} zones")

    def test_admin_create_zone(self, admin_headers):
        """Test admin can create a new zone"""
        new_zone = {
            "nom": f"Test Zone {uuid.uuid4().hex[:6]}",
            "prix_base": 4000,
            "paiement_livreur": 2800,
            "is_active": True
        }
        response = requests.post(
            f"{API}/admin/zones",
            json=new_zone,
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == new_zone["nom"]
        assert data["prix_base"] == new_zone["prix_base"]
        assert data["paiement_livreur"] == new_zone["paiement_livreur"]
        print(f"SUCCESS: Created zone '{new_zone['nom']}' with price {new_zone['prix_base']} FCFA")
        return data["id"]

    def test_admin_update_zone(self, admin_headers):
        """Test admin can update a zone"""
        zones_response = requests.get(f"{API}/admin/zones", headers=admin_headers)
        zones = zones_response.json()
        if not zones:
            pytest.skip("No zones to update")

        zone_id = zones[0]["id"]
        original_price = zones[0]["prix_base"]

        update_response = requests.patch(
            f"{API}/admin/zones/{zone_id}",
            json={"prix_base": original_price + 100},
            headers=admin_headers
        )
        assert update_response.status_code == 200

        requests.patch(
            f"{API}/admin/zones/{zone_id}",
            json={"prix_base": original_price},
            headers=admin_headers
        )
        print("SUCCESS: Admin can update zone pricing")

    def test_admin_zones_unauthorized(self):
        """Test admin zones endpoint rejects requests without a valid admin token"""
        response = requests.get(f"{API}/admin/zones")
        assert response.status_code == 401
        print("SUCCESS: Admin zones endpoint correctly rejects unauthenticated requests")


class TestPlatformSettings:
    """Platform settings tests (weight surcharge, commission)"""

    def test_get_platform_settings(self, admin_headers):
        """Test admin can get platform settings"""
        response = requests.get(f"{API}/admin/settings", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()

        assert "poids_seuil" in data
        assert "poids_supplement" in data
        assert "commission_type" in data
        assert "commission_value" in data

        print(f"SUCCESS: Platform settings retrieved")
        print(f"  - Weight threshold: {data['poids_seuil']} kg")
        print(f"  - Weight surcharge: {data['poids_supplement']} FCFA")
        print(f"  - Commission: {data['commission_value']}% ({data['commission_type']})")

    def test_update_platform_settings(self, admin_headers):
        """Test admin can update platform settings"""
        current = requests.get(f"{API}/admin/settings", headers=admin_headers).json()

        response = requests.put(
            f"{API}/admin/settings",
            params={"poids_supplement": 600},
            headers=admin_headers
        )
        assert response.status_code == 200

        updated = requests.get(f"{API}/admin/settings", headers=admin_headers).json()
        assert updated["poids_supplement"] == 600

        requests.put(
            f"{API}/admin/settings",
            params={"poids_supplement": current["poids_supplement"]},
            headers=admin_headers
        )
        print("SUCCESS: Admin can update platform settings")

    def test_settings_unauthorized(self):
        """Test settings endpoint rejects requests without a valid admin token"""
        response = requests.get(f"{API}/admin/settings")
        assert response.status_code == 401
        print("SUCCESS: Settings endpoint correctly rejects unauthenticated requests")


class TestFinancialDashboard:
    """Financial dashboard tests"""

    def test_get_financial_stats(self, admin_headers):
        """Test admin can get financial statistics"""
        response = requests.get(f"{API}/admin/financial", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()

        assert "totaux" in data
        assert "par_statut" in data
        assert "nombre_livraisons" in data

        totaux = data["totaux"]
        assert "chiffre_affaires" in totaux
        assert "paiements_livreurs" in totaux
        assert "commission_plateforme" in totaux
        assert "marge_nette" in totaux

        print(f"SUCCESS: Financial stats retrieved")
        print(f"  - Revenue: {totaux['chiffre_affaires']} FCFA")
        print(f"  - Rider payments: {totaux['paiements_livreurs']} FCFA")
        print(f"  - Commission: {totaux['commission_plateforme']} FCFA")
        print(f"  - Net margin: {totaux['marge_nette']} FCFA")
        print(f"  - Total deliveries: {data['nombre_livraisons']}")

    def test_financial_with_date_filter(self, admin_headers):
        """Test financial stats with date filter"""
        response = requests.get(
            f"{API}/admin/financial",
            params={"date_from": "2026-01-01", "date_to": "2026-12-31"},
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "totaux" in data
        print("SUCCESS: Financial stats with date filter works")

    def test_financial_unauthorized(self):
        """Test financial endpoint rejects requests without a valid admin token"""
        response = requests.get(f"{API}/admin/financial")
        assert response.status_code == 401
        print("SUCCESS: Financial endpoint correctly rejects unauthenticated requests")


class TestDeliveryCreationWithPricing:
    """Test delivery creation with zone-based pricing"""

    def test_create_delivery_with_zone_pricing(self):
        """Test creating delivery with zone pricing"""
        data, zone = _create_test_delivery(
            nom="TEST_Client_Pricing",
            poids=3.0,  # Under 5kg, no surcharge
        )

        assert data["tracking_number"].startswith("GOLIV-")
        assert "prix_zone" in data
        assert "prix_total" in data
        assert data["prix_zone"] == zone["prix_base"]
        assert data["prix_total"] == zone["prix_base"]

        print(f"SUCCESS: Delivery created with tracking {data['tracking_number']}")
        print(f"  - Zone price: {data['prix_zone']} FCFA")
        print(f"  - Total price: {data['prix_total']} FCFA")

    def test_create_delivery_with_weight_surcharge(self):
        """Test creating delivery with weight surcharge (>5kg)"""
        data, zone = _create_test_delivery(
            nom="TEST_Client_Heavy",
            type_colis="colis_moyen",
            poids=7.5,  # Over 5kg, should have surcharge
        )

        assert "supplement_poids" in data
        assert data["supplement_poids"] == 500
        assert data["prix_total"] == zone["prix_base"] + 500

        print(f"SUCCESS: Delivery with weight surcharge created")
        print(f"  - Zone price: {data['prix_zone']} FCFA")
        print(f"  - Weight surcharge: {data['supplement_poids']} FCFA")
        print(f"  - Total price: {data['prix_total']} FCFA")


class TestDeliveryRequestsWithTracking:
    """Test delivery requests include tracking numbers"""

    def test_admin_delivery_list_has_tracking(self, admin_headers):
        """Test admin delivery list includes tracking numbers"""
        response = requests.get(f"{API}/admin/delivery-requests", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()

        if len(data) > 0:
            delivery = data[0]
            assert "tracking_number" in delivery
            if delivery["tracking_number"]:
                assert delivery["tracking_number"].startswith(("PLB-", "GOLIV-"))
            print(f"SUCCESS: Admin delivery list includes tracking numbers")
            print(f"  - Sample tracking: {delivery.get('tracking_number', 'N/A')}")
        else:
            print("SUCCESS: Admin delivery list endpoint works (no deliveries yet)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

"""
Backend API Tests for PLB Logistique - Tracking, Zones, and Financial Features
Tests: Tracking numbers, Zone-based pricing, Weight surcharge, Financial dashboard
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "plb2024"


class TestTrackingEndpoint:
    """Public tracking endpoint tests"""
    
    def test_track_valid_number(self):
        """Test tracking with valid tracking number PLB-2026-000001"""
        response = requests.get(f"{BASE_URL}/api/track/PLB-2026-000001")
        assert response.status_code == 200
        data = response.json()
        assert "tracking_number" in data
        assert data["tracking_number"] == "PLB-2026-000001"
        assert "status" in data
        assert "status_label" in data
        assert "zone_enlevement" in data
        assert "zone_livraison" in data
        assert "created_at" in data
        print(f"SUCCESS: Tracking PLB-2026-000001 returned status: {data['status_label']}")
    
    def test_track_valid_number_002(self):
        """Test tracking with valid tracking number PLB-2026-000002"""
        response = requests.get(f"{BASE_URL}/api/track/PLB-2026-000002")
        assert response.status_code == 200
        data = response.json()
        assert data["tracking_number"] == "PLB-2026-000002"
        print(f"SUCCESS: Tracking PLB-2026-000002 returned status: {data['status_label']}")
    
    def test_track_invalid_number(self):
        """Test tracking with invalid tracking number returns 404"""
        response = requests.get(f"{BASE_URL}/api/track/INVALID-NUMBER")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "introuvable" in data["detail"].lower()
        print("SUCCESS: Invalid tracking number correctly returns 404")
    
    def test_track_case_insensitive(self):
        """Test tracking is case insensitive"""
        response = requests.get(f"{BASE_URL}/api/track/plb-2026-000001")
        assert response.status_code == 200
        data = response.json()
        assert data["tracking_number"] == "PLB-2026-000001"
        print("SUCCESS: Tracking is case insensitive")


class TestZonesEndpoint:
    """Zone pricing endpoint tests"""
    
    def test_get_active_zones(self):
        """Test public zones endpoint returns active zones with prices"""
        response = requests.get(f"{BASE_URL}/api/zones")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check zone structure
        zone = data[0]
        assert "id" in zone
        assert "nom" in zone
        assert "prix_base" in zone
        assert "paiement_livreur" in zone
        assert "is_active" in zone
        
        # Verify all zones are active
        for z in data:
            assert z["is_active"] == True
        
        print(f"SUCCESS: Got {len(data)} active zones with pricing")
        
        # Print zone details for verification
        for z in data:
            print(f"  - {z['nom']}: {z['prix_base']} FCFA (rider: {z['paiement_livreur']} FCFA)")
    
    def test_zones_have_expected_values(self):
        """Test zones have expected default values"""
        response = requests.get(f"{BASE_URL}/api/zones")
        assert response.status_code == 200
        data = response.json()
        
        zone_names = [z["nom"] for z in data]
        assert "Cotonou Centre" in zone_names
        assert "Akpakpa" in zone_names
        assert "Calavi" in zone_names
        
        # Check Cotonou Centre price
        cotonou = next((z for z in data if z["nom"] == "Cotonou Centre"), None)
        assert cotonou is not None
        assert cotonou["prix_base"] == 1500
        
        print("SUCCESS: Zones have expected default values")


class TestAdminZonesManagement:
    """Admin zone management tests"""
    
    def test_admin_get_all_zones(self):
        """Test admin can get all zones"""
        response = requests.get(f"{BASE_URL}/api/admin/zones?password={ADMIN_PASSWORD}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Admin retrieved {len(data)} zones")
    
    def test_admin_create_zone(self):
        """Test admin can create a new zone"""
        new_zone = {
            "nom": f"Test Zone {uuid.uuid4().hex[:6]}",
            "prix_base": 4000,
            "paiement_livreur": 2800,
            "is_active": True
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/zones?password={ADMIN_PASSWORD}",
            json=new_zone
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == new_zone["nom"]
        assert data["prix_base"] == new_zone["prix_base"]
        assert data["paiement_livreur"] == new_zone["paiement_livreur"]
        print(f"SUCCESS: Created zone '{new_zone['nom']}' with price {new_zone['prix_base']} FCFA")
        return data["id"]
    
    def test_admin_update_zone(self):
        """Test admin can update a zone"""
        # First get zones
        zones_response = requests.get(f"{BASE_URL}/api/admin/zones?password={ADMIN_PASSWORD}")
        zones = zones_response.json()
        if not zones:
            pytest.skip("No zones to update")
        
        zone_id = zones[0]["id"]
        original_price = zones[0]["prix_base"]
        
        # Update zone
        update_response = requests.patch(
            f"{BASE_URL}/api/admin/zones/{zone_id}?password={ADMIN_PASSWORD}",
            json={"prix_base": original_price + 100}
        )
        assert update_response.status_code == 200
        
        # Revert change
        requests.patch(
            f"{BASE_URL}/api/admin/zones/{zone_id}?password={ADMIN_PASSWORD}",
            json={"prix_base": original_price}
        )
        print("SUCCESS: Admin can update zone pricing")
    
    def test_admin_zones_unauthorized(self):
        """Test admin zones endpoint requires correct password"""
        response = requests.get(f"{BASE_URL}/api/admin/zones?password=wrongpassword")
        assert response.status_code == 401
        print("SUCCESS: Admin zones endpoint correctly rejects wrong password")


class TestPlatformSettings:
    """Platform settings tests (weight surcharge, commission)"""
    
    def test_get_platform_settings(self):
        """Test admin can get platform settings"""
        response = requests.get(f"{BASE_URL}/api/admin/settings?password={ADMIN_PASSWORD}")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "poids_seuil" in data
        assert "poids_supplement" in data
        assert "commission_type" in data
        assert "commission_value" in data
        
        # Verify default values
        assert data["poids_seuil"] == 5.0  # 5kg threshold
        assert data["poids_supplement"] == 500  # +500 FCFA surcharge
        assert data["commission_type"] == "percentage"
        assert data["commission_value"] == 15.0  # 15% commission
        
        print(f"SUCCESS: Platform settings retrieved")
        print(f"  - Weight threshold: {data['poids_seuil']} kg")
        print(f"  - Weight surcharge: {data['poids_supplement']} FCFA")
        print(f"  - Commission: {data['commission_value']}% ({data['commission_type']})")
    
    def test_update_platform_settings(self):
        """Test admin can update platform settings"""
        # Get current settings
        current = requests.get(f"{BASE_URL}/api/admin/settings?password={ADMIN_PASSWORD}").json()
        
        # Update settings
        response = requests.put(
            f"{BASE_URL}/api/admin/settings?password={ADMIN_PASSWORD}&poids_supplement=600"
        )
        assert response.status_code == 200
        
        # Verify update
        updated = requests.get(f"{BASE_URL}/api/admin/settings?password={ADMIN_PASSWORD}").json()
        assert updated["poids_supplement"] == 600
        
        # Revert
        requests.put(
            f"{BASE_URL}/api/admin/settings?password={ADMIN_PASSWORD}&poids_supplement={current['poids_supplement']}"
        )
        print("SUCCESS: Admin can update platform settings")
    
    def test_settings_unauthorized(self):
        """Test settings endpoint requires correct password"""
        response = requests.get(f"{BASE_URL}/api/admin/settings?password=wrongpassword")
        assert response.status_code == 401
        print("SUCCESS: Settings endpoint correctly rejects wrong password")


class TestFinancialDashboard:
    """Financial dashboard tests"""
    
    def test_get_financial_stats(self):
        """Test admin can get financial statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/financial?password={ADMIN_PASSWORD}")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "totaux" in data
        assert "par_statut" in data
        assert "nombre_livraisons" in data
        
        # Check totaux structure
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
    
    def test_financial_with_date_filter(self):
        """Test financial stats with date filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/financial?password={ADMIN_PASSWORD}&date_from=2026-01-01&date_to=2026-12-31"
        )
        assert response.status_code == 200
        data = response.json()
        assert "totaux" in data
        print("SUCCESS: Financial stats with date filter works")
    
    def test_financial_unauthorized(self):
        """Test financial endpoint requires correct password"""
        response = requests.get(f"{BASE_URL}/api/admin/financial?password=wrongpassword")
        assert response.status_code == 401
        print("SUCCESS: Financial endpoint correctly rejects wrong password")


class TestDeliveryCreationWithPricing:
    """Test delivery creation with zone-based pricing"""
    
    def test_create_delivery_with_zone_pricing(self):
        """Test creating delivery with zone pricing"""
        # Get a zone ID first
        zones = requests.get(f"{BASE_URL}/api/zones").json()
        zone = zones[0]  # Cotonou Centre
        
        delivery_data = {
            "nom": "Test Client Pricing",
            "telephone": "+229 97 00 11 22",
            "zone_enlevement": "Cotonou - Centre",
            "zone_livraison": zone["nom"],
            "zone_livraison_id": zone["id"],
            "type_colis": "petit_colis",
            "urgence": "standard",
            "poids": 3.0,  # Under 5kg, no surcharge
            "notes": "Test delivery for pricing"
        }
        
        response = requests.post(f"{BASE_URL}/api/delivery-requests", json=delivery_data)
        assert response.status_code == 200
        data = response.json()
        
        # Check tracking number generated
        assert "tracking_number" in data
        assert data["tracking_number"].startswith("PLB-")
        
        # Check pricing applied
        assert "prix_zone" in data
        assert "prix_total" in data
        assert data["prix_zone"] == zone["prix_base"]
        assert data["prix_total"] == zone["prix_base"]  # No surcharge for < 5kg
        
        print(f"SUCCESS: Delivery created with tracking {data['tracking_number']}")
        print(f"  - Zone price: {data['prix_zone']} FCFA")
        print(f"  - Total price: {data['prix_total']} FCFA")
    
    def test_create_delivery_with_weight_surcharge(self):
        """Test creating delivery with weight surcharge (>5kg)"""
        # Get a zone ID first
        zones = requests.get(f"{BASE_URL}/api/zones").json()
        zone = zones[0]  # Cotonou Centre
        
        delivery_data = {
            "nom": "Test Client Heavy",
            "telephone": "+229 97 00 33 44",
            "zone_enlevement": "Cotonou - Centre",
            "zone_livraison": zone["nom"],
            "zone_livraison_id": zone["id"],
            "type_colis": "colis_moyen",
            "urgence": "standard",
            "poids": 7.5,  # Over 5kg, should have surcharge
            "notes": "Heavy package test"
        }
        
        response = requests.post(f"{BASE_URL}/api/delivery-requests", json=delivery_data)
        assert response.status_code == 200
        data = response.json()
        
        # Check weight surcharge applied
        assert "supplement_poids" in data
        assert data["supplement_poids"] == 500  # +500 FCFA for >5kg
        assert data["prix_total"] == zone["prix_base"] + 500
        
        print(f"SUCCESS: Delivery with weight surcharge created")
        print(f"  - Zone price: {data['prix_zone']} FCFA")
        print(f"  - Weight surcharge: {data['supplement_poids']} FCFA")
        print(f"  - Total price: {data['prix_total']} FCFA")


class TestDeliveryRequestsWithTracking:
    """Test delivery requests include tracking numbers"""
    
    def test_admin_delivery_list_has_tracking(self):
        """Test admin delivery list includes tracking numbers"""
        response = requests.get(f"{BASE_URL}/api/admin/delivery-requests?password={ADMIN_PASSWORD}")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            delivery = data[0]
            assert "tracking_number" in delivery
            if delivery["tracking_number"]:
                assert delivery["tracking_number"].startswith("PLB-")
            print(f"SUCCESS: Admin delivery list includes tracking numbers")
            print(f"  - Sample tracking: {delivery.get('tracking_number', 'N/A')}")
        else:
            print("SUCCESS: Admin delivery list endpoint works (no deliveries yet)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

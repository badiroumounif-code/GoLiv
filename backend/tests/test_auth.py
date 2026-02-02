"""
Backend API Tests for PLB Logistique Authentication System
Tests: Login, Registration, JWT tokens, Role-based access
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("SUCCESS: API health check passed")
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "PLB Logistique" in data["message"]
        print("SUCCESS: API root endpoint working")


class TestAdminLogin:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@plb.bj",
            "password": "plb2024"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == "admin@plb.bj"
        print(f"SUCCESS: Admin login successful, token received")
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@plb.bj",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print("SUCCESS: Admin login with wrong password correctly rejected")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@plb.bj",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("SUCCESS: Login with non-existent user correctly rejected")


class TestUserRegistration:
    """User registration tests for riders and merchants"""
    
    def test_rider_registration(self):
        """Test rider registration"""
        unique_email = f"test.rider.{uuid.uuid4().hex[:8]}@plb.bj"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "rider",
            "nom": "Test Rider",
            "telephone": "+229 97 00 11 22"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "token" in data
        assert data["user"]["role"] == "rider"
        assert data["user"]["email"] == unique_email.lower()
        print(f"SUCCESS: Rider registration successful for {unique_email}")
        return data
    
    def test_merchant_registration(self):
        """Test merchant registration"""
        unique_email = f"test.merchant.{uuid.uuid4().hex[:8]}@plb.bj"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "merchant",
            "nom": "Test Merchant",
            "telephone": "+229 97 00 33 44"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "token" in data
        assert data["user"]["role"] == "merchant"
        assert data["user"]["email"] == unique_email.lower()
        print(f"SUCCESS: Merchant registration successful for {unique_email}")
        return data
    
    def test_registration_duplicate_email(self):
        """Test registration with duplicate email"""
        unique_email = f"test.dup.{uuid.uuid4().hex[:8]}@plb.bj"
        # First registration
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "rider",
            "nom": "First User",
            "telephone": "+229 97 00 55 66"
        })
        assert response1.status_code == 200
        
        # Second registration with same email
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "merchant",
            "nom": "Second User",
            "telephone": "+229 97 00 77 88"
        })
        assert response2.status_code == 400
        data = response2.json()
        assert "detail" in data
        print("SUCCESS: Duplicate email registration correctly rejected")
    
    def test_registration_invalid_role(self):
        """Test registration with invalid role (admin not allowed)"""
        unique_email = f"test.admin.{uuid.uuid4().hex[:8]}@plb.bj"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "admin",
            "nom": "Fake Admin",
            "telephone": "+229 97 00 99 00"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print("SUCCESS: Admin role registration correctly rejected")


class TestJWTAuthentication:
    """JWT token authentication tests"""
    
    @pytest.fixture
    def rider_token(self):
        """Get a rider token for testing"""
        unique_email = f"test.rider.jwt.{uuid.uuid4().hex[:8]}@plb.bj"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "rider",
            "nom": "JWT Test Rider",
            "telephone": "+229 97 11 22 33"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not create rider for JWT test")
    
    @pytest.fixture
    def merchant_token(self):
        """Get a merchant token for testing"""
        unique_email = f"test.merchant.jwt.{uuid.uuid4().hex[:8]}@plb.bj"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "merchant",
            "nom": "JWT Test Merchant",
            "telephone": "+229 97 44 55 66"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not create merchant for JWT test")
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for testing"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@plb.bj",
            "password": "plb2024"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not login as admin")
    
    def test_auth_me_with_valid_token(self, rider_token):
        """Test /auth/me endpoint with valid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {rider_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "role" in data
        assert data["role"] == "rider"
        print("SUCCESS: /auth/me returns correct user data with valid token")
    
    def test_auth_me_without_token(self):
        """Test /auth/me endpoint without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("SUCCESS: /auth/me correctly rejects request without token")
    
    def test_auth_me_with_invalid_token(self):
        """Test /auth/me endpoint with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401
        print("SUCCESS: /auth/me correctly rejects invalid token")


class TestRiderDashboardAccess:
    """Test rider dashboard API access"""
    
    @pytest.fixture
    def rider_token(self):
        """Get a rider token for testing"""
        unique_email = f"test.rider.dash.{uuid.uuid4().hex[:8]}@plb.bj"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "rider",
            "nom": "Dashboard Test Rider",
            "telephone": "+229 97 77 88 99"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not create rider for dashboard test")
    
    @pytest.fixture
    def merchant_token(self):
        """Get a merchant token for testing"""
        unique_email = f"test.merchant.dash.{uuid.uuid4().hex[:8]}@plb.bj"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "merchant",
            "nom": "Dashboard Test Merchant",
            "telephone": "+229 97 00 00 11"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not create merchant for dashboard test")
    
    def test_rider_profile_not_linked(self, rider_token):
        """Test rider profile endpoint for new user (not linked)"""
        response = requests.get(
            f"{BASE_URL}/api/rider/profile",
            headers={"Authorization": f"Bearer {rider_token}"}
        )
        # New riders without linked profile should get 404
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print("SUCCESS: Rider profile correctly returns 404 for unlinked user")
    
    def test_rider_deliveries_not_linked(self, rider_token):
        """Test rider deliveries endpoint for new user (not linked)"""
        response = requests.get(
            f"{BASE_URL}/api/rider/deliveries",
            headers={"Authorization": f"Bearer {rider_token}"}
        )
        # New riders without linked profile should get 404
        assert response.status_code == 404
        print("SUCCESS: Rider deliveries correctly returns 404 for unlinked user")
    
    def test_rider_stats_not_linked(self, rider_token):
        """Test rider stats endpoint for new user (not linked)"""
        response = requests.get(
            f"{BASE_URL}/api/rider/stats",
            headers={"Authorization": f"Bearer {rider_token}"}
        )
        # New riders without linked profile should get 404
        assert response.status_code == 404
        print("SUCCESS: Rider stats correctly returns 404 for unlinked user")
    
    def test_merchant_cannot_access_rider_endpoints(self, merchant_token):
        """Test that merchant cannot access rider endpoints"""
        response = requests.get(
            f"{BASE_URL}/api/rider/profile",
            headers={"Authorization": f"Bearer {merchant_token}"}
        )
        assert response.status_code == 403
        print("SUCCESS: Merchant correctly denied access to rider endpoints")


class TestMerchantDashboardAccess:
    """Test merchant dashboard API access"""
    
    @pytest.fixture
    def merchant_token(self):
        """Get a merchant token for testing"""
        unique_email = f"test.merchant.mdash.{uuid.uuid4().hex[:8]}@plb.bj"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "merchant",
            "nom": "Merchant Dashboard Test",
            "telephone": "+229 97 22 33 44"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not create merchant for dashboard test")
    
    @pytest.fixture
    def rider_token(self):
        """Get a rider token for testing"""
        unique_email = f"test.rider.mdash.{uuid.uuid4().hex[:8]}@plb.bj"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "rider",
            "nom": "Rider for Merchant Test",
            "telephone": "+229 97 55 66 77"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not create rider for merchant test")
    
    def test_merchant_profile_not_linked(self, merchant_token):
        """Test merchant profile endpoint for new user (not linked)"""
        response = requests.get(
            f"{BASE_URL}/api/merchant/profile",
            headers={"Authorization": f"Bearer {merchant_token}"}
        )
        # New merchants without linked profile should get 404
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print("SUCCESS: Merchant profile correctly returns 404 for unlinked user")
    
    def test_merchant_deliveries_not_linked(self, merchant_token):
        """Test merchant deliveries endpoint for new user (not linked)"""
        response = requests.get(
            f"{BASE_URL}/api/merchant/deliveries",
            headers={"Authorization": f"Bearer {merchant_token}"}
        )
        # New merchants without linked profile should get 404
        assert response.status_code == 404
        print("SUCCESS: Merchant deliveries correctly returns 404 for unlinked user")
    
    def test_merchant_stats_not_linked(self, merchant_token):
        """Test merchant stats endpoint for new user (not linked)"""
        response = requests.get(
            f"{BASE_URL}/api/merchant/stats",
            headers={"Authorization": f"Bearer {merchant_token}"}
        )
        # New merchants without linked profile should get 404
        assert response.status_code == 404
        print("SUCCESS: Merchant stats correctly returns 404 for unlinked user")
    
    def test_rider_cannot_access_merchant_endpoints(self, rider_token):
        """Test that rider cannot access merchant endpoints"""
        response = requests.get(
            f"{BASE_URL}/api/merchant/profile",
            headers={"Authorization": f"Bearer {rider_token}"}
        )
        assert response.status_code == 403
        print("SUCCESS: Rider correctly denied access to merchant endpoints")


class TestLoginAndRedirection:
    """Test login flow and role-based redirection data"""
    
    def test_admin_login_returns_correct_role(self):
        """Test admin login returns admin role for redirection"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@plb.bj",
            "password": "plb2024"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
        print("SUCCESS: Admin login returns correct role for dashboard redirection")
    
    def test_rider_login_returns_correct_role(self):
        """Test rider login returns rider role for redirection"""
        unique_email = f"test.rider.redir.{uuid.uuid4().hex[:8]}@plb.bj"
        # Register first
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "rider",
            "nom": "Redirect Test Rider",
            "telephone": "+229 97 88 99 00"
        })
        assert reg_response.status_code == 200
        
        # Then login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "Test1234"
        })
        assert login_response.status_code == 200
        data = login_response.json()
        assert data["user"]["role"] == "rider"
        print("SUCCESS: Rider login returns correct role for dashboard redirection")
    
    def test_merchant_login_returns_correct_role(self):
        """Test merchant login returns merchant role for redirection"""
        unique_email = f"test.merchant.redir.{uuid.uuid4().hex[:8]}@plb.bj"
        # Register first
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "role": "merchant",
            "nom": "Redirect Test Merchant",
            "telephone": "+229 97 11 22 33"
        })
        assert reg_response.status_code == 200
        
        # Then login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "Test1234"
        })
        assert login_response.status_code == 200
        data = login_response.json()
        assert data["user"]["role"] == "merchant"
        print("SUCCESS: Merchant login returns correct role for dashboard redirection")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

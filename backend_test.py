#!/usr/bin/env python3
"""
Backend API Testing for PLB Logistique
Tests all endpoints including forms submission and admin functionality
"""

import requests
import sys
import json
from datetime import datetime

class PLBLogistiqueAPITester:
    def __init__(self, base_url="https://cargo-connect-162.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_password = "plb2024"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log_result(self, test_name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            self.passed_tests.append(test_name)
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append({"test": test_name, "details": details})
            print(f"❌ {test_name} - FAILED: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            if not success:
                try:
                    error_detail = response.json()
                    details += f" - {error_detail}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_result(name, success, details if not success else "")
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_delivery_request_submission(self):
        """Test delivery request form submission"""
        print("\n🚚 Testing Delivery Request Submission...")
        
        test_data = {
            "nom": "Jean Test",
            "telephone": "+229 12 34 56 78",
            "zone_enlevement": "Cotonou - Centre",
            "zone_livraison": "Calavi - Godomey",
            "type_colis": "petit_colis",
            "urgence": "standard",
            "notes": "Test delivery request from automated testing"
        }
        
        success, response = self.run_test(
            "Create Delivery Request", 
            "POST", 
            "delivery-requests", 
            200, 
            data=test_data
        )
        
        if success and 'id' in response:
            print(f"   Created delivery request with ID: {response['id']}")
            return response['id']
        return None

    def test_feedback_submission(self):
        """Test feedback form submission"""
        print("\n⭐ Testing Feedback Submission...")
        
        test_data = {
            "nom": "Marie Test",
            "telephone": "+229 87 65 43 21",
            "note": 5,
            "commentaire": "Excellent service de livraison, très satisfaite!",
            "problemes": ""
        }
        
        success, response = self.run_test(
            "Create Feedback", 
            "POST", 
            "feedback", 
            200, 
            data=test_data
        )
        
        if success and 'id' in response:
            print(f"   Created feedback with ID: {response['id']}")
            return response['id']
        return None

    def test_merchant_submission(self):
        """Test merchant partner form submission"""
        print("\n🏪 Testing Merchant Partner Submission...")
        
        test_data = {
            "nom_entreprise": "Test Commerce SARL",
            "nom_contact": "Pierre Commerçant",
            "telephone": "+229 11 22 33 44",
            "email": "pierre@testcommerce.bj",
            "adresse": "Rue des Commerçants, Cotonou",
            "type_produits": "Électronique",
            "volume_mensuel": "50-100 colis",
            "message": "Nous souhaitons devenir partenaire pour nos livraisons"
        }
        
        success, response = self.run_test(
            "Create Merchant Application", 
            "POST", 
            "merchants", 
            200, 
            data=test_data
        )
        
        if success and 'id' in response:
            print(f"   Created merchant application with ID: {response['id']}")
            return response['id']
        return None

    def test_rider_submission(self):
        """Test rider partner form submission"""
        print("\n🏍️ Testing Rider Partner Submission...")
        
        test_data = {
            "nom": "Kouassi",
            "prenom": "Alain",
            "telephone": "+229 55 66 77 88",
            "email": "alain.kouassi@email.bj",
            "zone_couverture": "Cotonou",
            "type_vehicule": "Moto",
            "experience": "2-5 ans",
            "disponibilite": "Temps plein",
            "message": "Livreur expérimenté, disponible immédiatement"
        }
        
        success, response = self.run_test(
            "Create Rider Application", 
            "POST", 
            "riders", 
            200, 
            data=test_data
        )
        
        if success and 'id' in response:
            print(f"   Created rider application with ID: {response['id']}")
            return response['id']
        return None

    def test_contact_submission(self):
        """Test contact form submission"""
        print("\n📧 Testing Contact Form Submission...")
        
        test_data = {
            "nom": "Fatou Utilisatrice",
            "email": "fatou@email.bj",
            "sujet": "Question sur les tarifs",
            "message": "Bonjour, j'aimerais connaître vos tarifs pour les livraisons express."
        }
        
        success, response = self.run_test(
            "Create Contact Message", 
            "POST", 
            "contact", 
            200, 
            data=test_data
        )
        
        if success and 'id' in response:
            print(f"   Created contact message with ID: {response['id']}")
            return response['id']
        return None

    def test_admin_login(self):
        """Test admin login functionality"""
        print("\n🔐 Testing Admin Login...")
        
        # Test correct password
        success, response = self.run_test(
            "Admin Login (Correct Password)", 
            "POST", 
            "admin/login", 
            200, 
            data={"password": self.admin_password}
        )
        
        # Test incorrect password
        self.run_test(
            "Admin Login (Wrong Password)", 
            "POST", 
            "admin/login", 
            401, 
            data={"password": "wrongpassword"}
        )
        
        return success

    def test_admin_data_retrieval(self):
        """Test admin data retrieval endpoints"""
        print("\n📊 Testing Admin Data Retrieval...")
        
        params = {"password": self.admin_password}
        
        # Test all admin GET endpoints
        endpoints = [
            ("delivery-requests", "Admin Get Delivery Requests"),
            ("feedback", "Admin Get Feedback"),
            ("merchants", "Admin Get Merchants"),
            ("riders", "Admin Get Riders"),
            ("contacts", "Admin Get Contacts"),
            ("stats", "Admin Get Stats")
        ]
        
        for endpoint, test_name in endpoints:
            success, data = self.run_test(
                test_name, 
                "GET", 
                f"admin/{endpoint}", 
                200, 
                params=params
            )
            
            if success and endpoint == "stats":
                print(f"   Stats: {data}")

    def test_admin_unauthorized_access(self):
        """Test admin endpoints without proper authentication"""
        print("\n🚫 Testing Admin Unauthorized Access...")
        
        # Test without password
        self.run_test(
            "Admin Access Without Password", 
            "GET", 
            "admin/delivery-requests", 
            422  # FastAPI validation error for missing query param
        )
        
        # Test with wrong password
        params = {"password": "wrongpassword"}
        self.run_test(
            "Admin Access With Wrong Password", 
            "GET", 
            "admin/delivery-requests", 
            401, 
            params=params
        )

    def test_csv_export_endpoints(self):
        """Test CSV export functionality"""
        print("\n📥 Testing CSV Export Endpoints...")
        
        params = {"password": self.admin_password}
        
        export_endpoints = [
            "delivery-requests",
            "feedback", 
            "merchants",
            "riders"
        ]
        
        for endpoint in export_endpoints:
            try:
                url = f"{self.base_url}/admin/export/{endpoint}"
                response = requests.get(url, params=params, timeout=10)
                
                success = response.status_code == 200
                test_name = f"Export {endpoint.replace('-', ' ').title()}"
                
                if success:
                    # Check if response is CSV
                    content_type = response.headers.get('content-type', '')
                    is_csv = 'text/csv' in content_type or 'attachment' in response.headers.get('content-disposition', '')
                    
                    if is_csv:
                        self.log_result(test_name, True)
                        print(f"   CSV export successful, size: {len(response.content)} bytes")
                    else:
                        self.log_result(test_name, False, f"Not CSV format: {content_type}")
                else:
                    self.log_result(test_name, False, f"Status {response.status_code}")
                    
            except Exception as e:
                self.log_result(f"Export {endpoint}", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting PLB Logistique Backend API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic health tests
        self.test_health_endpoints()
        
        # Form submission tests
        self.test_delivery_request_submission()
        self.test_feedback_submission()
        self.test_merchant_submission()
        self.test_rider_submission()
        self.test_contact_submission()
        
        # Admin functionality tests
        admin_login_success = self.test_admin_login()
        if admin_login_success:
            self.test_admin_data_retrieval()
            self.test_csv_export_endpoints()
        
        self.test_admin_unauthorized_access()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['details']}")
        
        print(f"\n✅ PASSED TESTS: {len(self.passed_tests)}")
        for test in self.passed_tests:
            print(f"  - {test}")
        
        return len(self.failed_tests) == 0

def main():
    """Main test execution"""
    tester = PLBLogistiqueAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
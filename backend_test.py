import requests
import sys
import json
from datetime import datetime

class MemoraAPITester:
    def __init__(self, base_url="https://photo-order-app-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.content else {}
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            self.test_results.append({
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success,
                'response': response.text[:500] if not success else 'OK'
            })

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'actual_status': 'ERROR',
                'success': False,
                'response': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_get_settings(self):
        """Test getting settings"""
        success, response = self.run_test("Get Settings", "GET", "settings", 200)
        if success:
            required_fields = ['couple_names', 'welcome_text']
            for field in required_fields:
                if field not in response:
                    print(f"⚠️  Warning: Missing field '{field}' in settings response")
        return success, response

    def test_admin_login_invalid(self):
        """Test admin login with invalid password"""
        return self.run_test(
            "Admin Login (Invalid)",
            "POST",
            "admin/login",
            401,
            data={"password": "wrongpassword"}
        )

    def test_admin_login_valid(self):
        """Test admin login with valid password"""
        return self.run_test(
            "Admin Login (Valid)",
            "POST",
            "admin/login",
            200,
            data={"password": "memora2024"}
        )

    def test_create_memory(self):
        """Test creating a memory"""
        memory_data = {
            "guest_name": "Test Guest",
            "message": "This is a test memory message for the happy couple!",
            "photo": None
        }
        success, response = self.run_test(
            "Create Memory",
            "POST",
            "memories",
            201,
            data=memory_data
        )
        return success, response

    def test_create_memory_with_tone(self):
        """Test creating a memory with tone"""
        memory_data = {
            "guest_name": "Test Guest with Tone",
            "message": "This is a wise message for the couple!",
            "photo": None,
            "tone": "wise"
        }
        success, response = self.run_test(
            "Create Memory with Tone",
            "POST",
            "memories",
            201,
            data=memory_data
        )
        if success and response.get('tone') != 'wise':
            print(f"⚠️  Warning: Expected tone 'wise', got '{response.get('tone')}'")
        return success, response

    def test_get_memories(self):
        """Test getting all memories"""
        return self.run_test("Get Memories", "GET", "memories", 200)

    def test_update_settings(self):
        """Test updating settings"""
        settings_data = {
            "couple_names": "Test Couple",
            "welcome_text": "Test welcome message"
        }
        return self.run_test(
            "Update Settings",
            "PUT",
            "admin/settings",
            200,
            data=settings_data
        )

    def test_tone_settings(self):
        """Test tone page settings"""
        # Test enabling/disabling tone page
        tone_settings = {
            "tone_page_enabled": False
        }
        success1, _ = self.run_test(
            "Disable Tone Page",
            "PUT",
            "admin/settings",
            200,
            data=tone_settings
        )
        
        # Test updating tone questions
        tone_questions = {
            "tone_questions": {
                "wise": "What wisdom would you share with them?",
                "funny": "What's a funny memory or joke for them?",
                "advice": "What advice would you give them?",
                "emotional": "What heartfelt message do you have for them?"
            }
        }
        success2, _ = self.run_test(
            "Update Tone Questions",
            "PUT",
            "admin/settings",
            200,
            data=tone_questions
        )
        
        # Re-enable tone page
        tone_settings["tone_page_enabled"] = True
        success3, _ = self.run_test(
            "Enable Tone Page",
            "PUT",
            "admin/settings",
            200,
            data=tone_settings
        )
        
        return success1 and success2 and success3

    def test_pdf_download(self):
        """Test PDF download endpoint"""
        success, _ = self.run_test("Download PDF", "GET", "memories/pdf", 200)
        return success

    def test_delete_memory(self, memory_id):
        """Test deleting a memory"""
        return self.run_test(
            "Delete Memory",
            "DELETE",
            f"memories/{memory_id}",
            200
        )

def main():
    print("🚀 Starting Memora API Tests...")
    print("=" * 50)
    
    tester = MemoraAPITester()
    
    # Test sequence
    print("\n📋 Testing Basic Endpoints...")
    tester.test_root_endpoint()
    
    print("\n📋 Testing Settings...")
    tester.test_get_settings()
    
    print("\n📋 Testing Admin Authentication...")
    tester.test_admin_login_invalid()
    tester.test_admin_login_valid()
    
    print("\n📋 Testing Memory Operations...")
    success, memory_response = tester.test_create_memory()
    memory_id = memory_response.get('id') if success else None
    
    # Test memory with tone
    success_tone, memory_tone_response = tester.test_create_memory_with_tone()
    memory_tone_id = memory_tone_response.get('id') if success_tone else None
    
    tester.test_get_memories()
    
    print("\n📋 Testing Admin Operations...")
    tester.test_update_settings()
    tester.test_tone_settings()
    tester.test_pdf_download()
    
    # Clean up - delete test memories if created
    if memory_id:
        print("\n🧹 Cleaning up test data...")
        tester.test_delete_memory(memory_id)
    if memory_tone_id:
        tester.test_delete_memory(memory_tone_id)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        print("\nFailed tests:")
        for result in tester.test_results:
            if not result['success']:
                print(f"  - {result['name']}: {result['response']}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
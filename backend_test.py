#!/usr/bin/env python3
"""
Backend API Test Suite for Quantix Construction Takeoff App
Tests all backend endpoints: health, projects CRUD, AI chat, AI vision extraction
"""

import requests
import json
import time
import sys

# Base URL from .env NEXT_PUBLIC_BASE_URL
BASE_URL = "https://buildquant-3.preview.emergentagent.com/api"

# Test data
PROJECT_DATA = {
    "name": "Marina Bay Tower",
    "client": "Emirates Construction Group",
    "location": "Dubai Marina, UAE",
    "currency": "AED"
}

BOQ_ITEMS = [
    {
        "id": "boq-001",
        "category": "floor",
        "description": "Porcelain tiles 60x60cm - Premium grade",
        "quantity": 250,
        "unit": "m2",
        "unitPrice": 85.50
    },
    {
        "id": "boq-002",
        "category": "wall",
        "description": "Cement plaster 15mm thickness",
        "quantity": 180,
        "unit": "m2",
        "unitPrice": 32.00
    }
]

# Small 1x1 white PNG for vision test
TINY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

CHAT_MESSAGES = [
    {
        "role": "user",
        "content": "How much cement is needed for 10 cubic meters of concrete C25? Answer in 2 sentences."
    }
]

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_success(message):
    print(f"✅ SUCCESS: {message}")

def print_error(message):
    print(f"❌ ERROR: {message}")

def print_info(message):
    print(f"ℹ️  INFO: {message}")

def test_health_check():
    """Test GET /api/health"""
    print_test_header("Health Check Endpoint")
    
    try:
        url = f"{BASE_URL}/health"
        print_info(f"Testing: GET {url}")
        
        response = requests.get(url, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_error(f"Expected status 200, got {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
        
        data = response.json()
        print_info(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify structure
        if "status" not in data or "ts" not in data:
            print_error("Response missing 'status' or 'ts' fields")
            return False
        
        if data["status"] != "ok":
            print_error(f"Expected status='ok', got '{data['status']}'")
            return False
        
        if not isinstance(data["ts"], (int, float)):
            print_error(f"Expected 'ts' to be a number, got {type(data['ts'])}")
            return False
        
        print_success("Health check endpoint working correctly")
        return True
        
    except Exception as e:
        print_error(f"Health check failed with exception: {str(e)}")
        return False

def test_projects_crud():
    """Test Projects CRUD operations"""
    print_test_header("Projects CRUD Operations")
    
    project_id = None
    
    try:
        # 1. CREATE PROJECT
        print_info("\n--- Step 1: Create Project ---")
        url = f"{BASE_URL}/projects"
        print_info(f"Testing: POST {url}")
        print_info(f"Body: {json.dumps(PROJECT_DATA, indent=2)}")
        
        response = requests.post(url, json=PROJECT_DATA, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_error(f"Create failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
        
        project = response.json()
        print_info(f"Created Project: {json.dumps(project, indent=2)}")
        
        # Verify created project structure
        if "id" not in project:
            print_error("Created project missing 'id' field")
            return False
        
        project_id = project["id"]
        print_success(f"Project created with ID: {project_id}")
        
        # Verify fields
        for key in ["name", "client", "location", "currency"]:
            if project.get(key) != PROJECT_DATA[key]:
                print_error(f"Field '{key}' mismatch: expected '{PROJECT_DATA[key]}', got '{project.get(key)}'")
                return False
        
        if "boqItems" not in project or not isinstance(project["boqItems"], list):
            print_error("Project missing 'boqItems' array")
            return False
        
        if "createdAt" not in project or "updatedAt" not in project:
            print_error("Project missing timestamp fields")
            return False
        
        print_success("Project created with correct structure")
        
        # 2. LIST PROJECTS
        print_info("\n--- Step 2: List All Projects ---")
        url = f"{BASE_URL}/projects"
        print_info(f"Testing: GET {url}")
        
        response = requests.get(url, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_error(f"List failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
        
        projects = response.json()
        print_info(f"Found {len(projects)} project(s)")
        
        if not isinstance(projects, list):
            print_error("Expected array response")
            return False
        
        # Find our project
        found = False
        for p in projects:
            if p.get("id") == project_id:
                found = True
                print_success(f"Found created project in list: {p.get('name')}")
                break
        
        if not found:
            print_error("Created project not found in list")
            return False
        
        # 3. GET SINGLE PROJECT
        print_info("\n--- Step 3: Get Single Project ---")
        url = f"{BASE_URL}/projects/{project_id}"
        print_info(f"Testing: GET {url}")
        
        response = requests.get(url, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_error(f"Get single failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
        
        single_project = response.json()
        print_info(f"Retrieved Project: {json.dumps(single_project, indent=2)}")
        
        if single_project.get("id") != project_id:
            print_error("Retrieved project ID mismatch")
            return False
        
        print_success("Single project retrieved successfully")
        
        # 4. UPDATE PROJECT WITH BOQ ITEMS
        print_info("\n--- Step 4: Update Project with BOQ Items ---")
        url = f"{BASE_URL}/projects/{project_id}"
        update_data = {"boqItems": BOQ_ITEMS}
        print_info(f"Testing: PUT {url}")
        print_info(f"Body: {json.dumps(update_data, indent=2)}")
        
        response = requests.put(url, json=update_data, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_error(f"Update failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
        
        updated_project = response.json()
        print_info(f"Updated Project BOQ Items: {json.dumps(updated_project.get('boqItems', []), indent=2)}")
        
        if "boqItems" not in updated_project:
            print_error("Updated project missing 'boqItems'")
            return False
        
        if len(updated_project["boqItems"]) != len(BOQ_ITEMS):
            print_error(f"BOQ items count mismatch: expected {len(BOQ_ITEMS)}, got {len(updated_project['boqItems'])}")
            return False
        
        print_success("Project updated with BOQ items")
        
        # 5. VERIFY BOQ PERSISTENCE
        print_info("\n--- Step 5: Verify BOQ Items Persisted ---")
        url = f"{BASE_URL}/projects/{project_id}"
        print_info(f"Testing: GET {url}")
        
        response = requests.get(url, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_error(f"Verification GET failed with status {response.status_code}")
            return False
        
        verified_project = response.json()
        
        if "boqItems" not in verified_project or len(verified_project["boqItems"]) != len(BOQ_ITEMS):
            print_error("BOQ items not persisted correctly")
            return False
        
        print_success("BOQ items persisted correctly in database")
        
        # 6. DELETE PROJECT
        print_info("\n--- Step 6: Delete Project ---")
        url = f"{BASE_URL}/projects/{project_id}"
        print_info(f"Testing: DELETE {url}")
        
        response = requests.delete(url, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_error(f"Delete failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
        
        delete_response = response.json()
        print_info(f"Delete Response: {json.dumps(delete_response, indent=2)}")
        
        if delete_response.get("ok") != True:
            print_error("Delete response missing 'ok: true'")
            return False
        
        print_success("Project deleted successfully")
        
        # 7. VERIFY DELETION
        print_info("\n--- Step 7: Verify Project Deleted ---")
        url = f"{BASE_URL}/projects/{project_id}"
        print_info(f"Testing: GET {url} (should return 404)")
        
        response = requests.get(url, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code != 404:
            print_error(f"Expected 404 after deletion, got {response.status_code}")
            return False
        
        print_success("Project deletion verified - returns 404 as expected")
        
        print_success("\n🎉 All Projects CRUD operations passed!")
        return True
        
    except Exception as e:
        print_error(f"Projects CRUD failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_ai_chat():
    """Test POST /api/ai/chat"""
    print_test_header("AI Assistant Chat Endpoint")
    
    try:
        url = f"{BASE_URL}/ai/chat"
        payload = {
            "messages": CHAT_MESSAGES,
            "sessionId": "test-session-" + str(int(time.time()))
        }
        
        print_info(f"Testing: POST {url}")
        print_info(f"Body: {json.dumps(payload, indent=2)}")
        print_info("⏳ This may take 10-30 seconds (calling gpt-5)...")
        
        start_time = time.time()
        response = requests.post(url, json=payload, timeout=60)
        elapsed = time.time() - start_time
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response Time: {elapsed:.2f}s")
        
        if response.status_code != 200:
            print_error(f"Chat failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
        
        data = response.json()
        print_info(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify structure
        if "reply" not in data:
            print_error("Response missing 'reply' field")
            return False
        
        reply = data["reply"]
        
        if not isinstance(reply, str):
            print_error(f"Expected 'reply' to be string, got {type(reply)}")
            return False
        
        if len(reply) == 0:
            print_error("Reply is empty string")
            return False
        
        print_info(f"Reply length: {len(reply)} characters")
        print_info(f"Reply preview: {reply[:200]}...")
        
        # Check if reply mentions cement/kg/numbers (basic content validation)
        reply_lower = reply.lower()
        has_cement = "cement" in reply_lower
        has_kg = "kg" in reply_lower or "kilogram" in reply_lower
        has_numbers = any(char.isdigit() for char in reply)
        
        if has_cement or has_kg or has_numbers:
            print_success(f"Reply contains relevant content (cement: {has_cement}, kg: {has_kg}, numbers: {has_numbers})")
        else:
            print_info("Reply doesn't contain expected keywords, but endpoint returned valid response")
        
        print_success("AI chat endpoint working correctly")
        return True
        
    except Exception as e:
        print_error(f"AI chat failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_ai_extract():
    """Test POST /api/ai/extract"""
    print_test_header("AI Vision Quantity Extraction Endpoint")
    
    try:
        url = f"{BASE_URL}/ai/extract"
        payload = {
            "imageBase64": TINY_PNG_BASE64,
            "mimeType": "image/png"
        }
        
        print_info(f"Testing: POST {url}")
        print_info(f"Body: imageBase64 (length: {len(TINY_PNG_BASE64)}), mimeType: image/png")
        print_info("⏳ This may take 15-45 seconds (calling gpt-5 vision)...")
        
        start_time = time.time()
        response = requests.post(url, json=payload, timeout=90)
        elapsed = time.time() - start_time
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response Time: {elapsed:.2f}s")
        
        if response.status_code != 200:
            print_error(f"Extract failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
        
        data = response.json()
        print_info(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify structure - must have summary, rooms, items keys
        required_keys = ["summary", "rooms", "items"]
        for key in required_keys:
            if key not in data:
                print_error(f"Response missing required key: '{key}'")
                return False
        
        print_success("Response has all required keys: summary, rooms, items")
        
        # Verify types
        if not isinstance(data["rooms"], list):
            print_error("'rooms' should be an array")
            return False
        
        if not isinstance(data["items"], list):
            print_error("'items' should be an array")
            return False
        
        if not isinstance(data["summary"], dict):
            print_error("'summary' should be an object")
            return False
        
        print_success(f"Structure valid: {len(data['rooms'])} rooms, {len(data['items'])} items")
        
        print_success("AI vision extraction endpoint working correctly")
        return True
        
    except Exception as e:
        print_error(f"AI extract failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("\n" + "="*80)
    print("QUANTIX CONSTRUCTION TAKEOFF - BACKEND API TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Run all tests
    results["Health Check"] = test_health_check()
    results["Projects CRUD"] = test_projects_crud()
    results["AI Chat"] = test_ai_chat()
    results["AI Extract"] = test_ai_extract()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Backend is working correctly.")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. See details above.")
        sys.exit(1)

if __name__ == "__main__":
    main()

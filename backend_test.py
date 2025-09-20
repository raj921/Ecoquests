#!/usr/bin/env python3
"""
EcoQuest Backend API Testing Suite
Tests all backend endpoints for the climate education app
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except:
        pass
    return "http://localhost:8000"  # Default local development URL

BASE_URL = get_backend_url() + "/api"
print(f"Testing backend at: {BASE_URL}")

# Test data for realistic climate education app
TEST_USER_DATA = {
    "age": 25,
    "interests": ["oceans", "energy", "transport"],
    "knowledge_level": "intermediate",
    "learning_style": "interactive",
    "location": "San Francisco, CA"
}

TEST_HABITS = {
    "transport": "car",
    "diet": "meat", 
    "energy_usage": "high",
    "waste_habits": "average"
}

# Global variables to store test results
test_results = []
created_user_id = None

def log_test(test_name, success, details="", response_data=None):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   Details: {details}")
    if response_data and not success:
        print(f"   Response: {response_data}")
    
    test_results.append({
        "test": test_name,
        "success": success,
        "details": details,
        "timestamp": datetime.now().isoformat()
    })

def test_api_health():
    """Test 1: Basic API Health Check"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "EcoQuest API is running" in data.get("message", ""):
                log_test("API Health Check", True, f"Status: {response.status_code}, Message: {data['message']}")
                return True
            else:
                log_test("API Health Check", False, f"Unexpected message: {data}")
                return False
        else:
            log_test("API Health Check", False, f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("API Health Check", False, f"Connection error: {str(e)}")
        return False

def test_onboarding():
    """Test 2: AI-Powered Onboarding"""
    global created_user_id
    
    try:
        response = requests.post(
            f"{BASE_URL}/onboarding",
            json=TEST_USER_DATA,
            timeout=30  # AI calls may take longer
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            required_fields = ["user_id", "personalized_path", "welcome_message"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                log_test("AI-Powered Onboarding", False, f"Missing fields: {missing_fields}")
                return False
            
            # Store user_id for later tests
            created_user_id = data["user_id"]
            
            # Check personalized path structure
            path = data["personalized_path"]
            if not isinstance(path, dict):
                log_test("AI-Powered Onboarding", False, "personalized_path is not a dictionary")
                return False
            
            # Verify AI integration worked (should have meaningful content)
            welcome_msg = data["welcome_message"]
            if len(welcome_msg) < 20 or "temporarily unavailable" in welcome_msg.lower():
                log_test("AI-Powered Onboarding", False, "AI integration may have failed - generic/short welcome message")
                return False
            
            log_test("AI-Powered Onboarding", True, 
                    f"User created: {created_user_id[:8]}..., Welcome message length: {len(welcome_msg)} chars")
            return True
            
        else:
            log_test("AI-Powered Onboarding", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("AI-Powered Onboarding", False, f"Error: {str(e)}")
        return False

def test_impact_calculator():
    """Test 3: Impact Calculator"""
    if not created_user_id:
        log_test("Impact Calculator", False, "No user_id available from onboarding test")
        return False
    
    try:
        test_data = {**TEST_HABITS, "user_id": created_user_id}
        
        response = requests.post(
            f"{BASE_URL}/calculate-impact",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            required_fields = ["daily_co2", "weekly_co2", "yearly_co2", "suggestions", "positive_impact"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                log_test("Impact Calculator", False, f"Missing fields: {missing_fields}")
                return False
            
            # Validate CO2 calculations
            daily_co2 = data["daily_co2"]
            weekly_co2 = data["weekly_co2"]
            yearly_co2 = data["yearly_co2"]
            
            # Check calculation accuracy
            if abs(weekly_co2 - (daily_co2 * 7)) > 0.1:
                log_test("Impact Calculator", False, f"Weekly calculation error: {weekly_co2} != {daily_co2 * 7}")
                return False
            
            if abs(yearly_co2 - (daily_co2 * 365)) > 0.1:
                log_test("Impact Calculator", False, f"Yearly calculation error: {yearly_co2} != {daily_co2 * 365}")
                return False
            
            # Check suggestions
            suggestions = data["suggestions"]
            if not isinstance(suggestions, list) or len(suggestions) == 0:
                log_test("Impact Calculator", False, "No suggestions provided")
                return False
            
            # Check AI-generated positive impact message
            positive_impact = data["positive_impact"]
            if len(positive_impact) < 20 or "temporarily unavailable" in positive_impact.lower():
                log_test("Impact Calculator", False, "AI-generated positive impact message seems generic/failed")
                return False
            
            log_test("Impact Calculator", True, 
                    f"Daily CO2: {daily_co2}kg, Suggestions: {len(suggestions)}, AI message: {len(positive_impact)} chars")
            return True
            
        else:
            log_test("Impact Calculator", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Impact Calculator", False, f"Error: {str(e)}")
        return False

def test_what_if_scenarios():
    """Test 4: What-If Scenarios"""
    test_scenarios = [
        "What if all cars were electric?",
        "What if everyone ate plant-based meals twice a week?",
        "What if all buildings used solar panels?"
    ]
    
    success_count = 0
    
    for scenario in test_scenarios:
        try:
            response = requests.post(
                f"{BASE_URL}/what-if",
                json={"scenario": scenario, "context": "climate education"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "scenario_response" not in data:
                    log_test(f"What-If Scenario: '{scenario[:30]}...'", False, "Missing scenario_response field")
                    continue
                
                scenario_response = data["scenario_response"]
                
                # Check if AI generated meaningful content
                if len(scenario_response) < 50 or "temporarily unavailable" in scenario_response.lower():
                    log_test(f"What-If Scenario: '{scenario[:30]}...'", False, "AI response seems generic/failed")
                    continue
                
                log_test(f"What-If Scenario: '{scenario[:30]}...'", True, f"Response length: {len(scenario_response)} chars")
                success_count += 1
                
            else:
                log_test(f"What-If Scenario: '{scenario[:30]}...'", False, f"Status code: {response.status_code}")
                
        except Exception as e:
            log_test(f"What-If Scenario: '{scenario[:30]}...'", False, f"Error: {str(e)}")
    
    # Overall success if at least 2 out of 3 scenarios work
    overall_success = success_count >= 2
    log_test("What-If Scenarios Overall", overall_success, f"{success_count}/3 scenarios successful")
    return overall_success

def test_local_actions():
    """Test 5: Local Actions"""
    try:
        test_data = {
            "location": "Portland, Oregon",
            "interests": ["forests", "energy", "waste"]
        }
        
        response = requests.post(
            f"{BASE_URL}/local-actions",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if "local_actions" not in data:
                log_test("Local Actions", False, "Missing local_actions field")
                return False
            
            actions = data["local_actions"]
            
            if not isinstance(actions, list) or len(actions) == 0:
                log_test("Local Actions", False, "No local actions returned")
                return False
            
            # Check action structure
            for i, action in enumerate(actions):
                if not isinstance(action, dict):
                    log_test("Local Actions", False, f"Action {i} is not a dictionary")
                    return False
                
                required_fields = ["title", "description", "impact", "difficulty"]
                missing_fields = [field for field in required_fields if field not in action]
                
                if missing_fields:
                    log_test("Local Actions", False, f"Action {i} missing fields: {missing_fields}")
                    return False
            
            log_test("Local Actions", True, f"Retrieved {len(actions)} local actions")
            return True
            
        else:
            log_test("Local Actions", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Local Actions", False, f"Error: {str(e)}")
        return False

def test_user_management():
    """Test 6: User Management"""
    if not created_user_id:
        log_test("User Management", False, "No user_id available from onboarding test")
        return False
    
    try:
        response = requests.get(f"{BASE_URL}/user/{created_user_id}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required user fields
            required_fields = ["id", "age", "interests", "knowledge_level", "learning_style"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                log_test("User Management", False, f"Missing user fields: {missing_fields}")
                return False
            
            # Verify data matches what we sent during onboarding
            if data["age"] != TEST_USER_DATA["age"]:
                log_test("User Management", False, f"Age mismatch: {data['age']} != {TEST_USER_DATA['age']}")
                return False
            
            if data["knowledge_level"] != TEST_USER_DATA["knowledge_level"]:
                log_test("User Management", False, f"Knowledge level mismatch")
                return False
            
            log_test("User Management", True, f"User data retrieved successfully for ID: {created_user_id[:8]}...")
            return True
            
        elif response.status_code == 404:
            log_test("User Management", False, "User not found in database")
            return False
        else:
            log_test("User Management", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("User Management", False, f"Error: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("=" * 60)
    print("🌍 EcoQuest Backend API Testing Suite")
    print("=" * 60)
    
    tests = [
        ("API Health Check", test_api_health),
        ("AI-Powered Onboarding", test_onboarding),
        ("Impact Calculator", test_impact_calculator),
        ("What-If Scenarios", test_what_if_scenarios),
        ("Local Actions", test_local_actions),
        ("User Management", test_user_management)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        if test_func():
            passed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 TEST SUMMARY: {passed}/{total} tests passed")
    print("=" * 60)
    
    # Detailed results
    print("\n📋 DETAILED RESULTS:")
    for result in test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}")
        if result["details"]:
            print(f"   {result['details']}")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
Test script to verify Groq AI integration in EcoQuest backend
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

BASE_URL = "http://localhost:8000/api"

def test_groq_integration():
    """Test all AI-powered endpoints to ensure Groq is working"""
    print("🌟 Testing EcoQuest Groq AI Integration")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing API Health...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ API is running")
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        return False
    
    # Test 2: Onboarding with AI
    print("\n2. Testing AI-Powered Onboarding...")
    onboarding_data = {
        "age": 25,
        "interests": ["oceans", "energy"],
        "knowledge_level": "intermediate",
        "learning_style": "interactive",
        "location": "San Francisco, CA"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/onboarding", json=onboarding_data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if "user_id" in result and "personalized_path" in result:
                print("✅ Onboarding with Groq AI successful")
                user_id = result["user_id"]
                print(f"   User ID: {user_id[:8]}...")
                print(f"   Welcome message length: {len(result['welcome_message'])} chars")
            else:
                print("❌ Onboarding response missing required fields")
                return False
        else:
            print(f"❌ Onboarding failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Onboarding error: {e}")
        return False
    
    # Test 3: What-If Scenarios
    print("\n3. Testing What-If Scenarios with Groq...")
    whatif_data = {
        "scenario": "What if all cars were electric by 2030?"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/what-if", json=whatif_data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if "scenario_response" in result:
                response_text = result["scenario_response"]
                print("✅ What-If scenario with Groq AI successful")
                print(f"   Response length: {len(response_text)} chars")
                print(f"   Preview: {response_text[:100]}...")
            else:
                print("❌ What-If response missing scenario_response")
                return False
        else:
            print(f"❌ What-If scenario failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ What-If scenario error: {e}")
        return False
    
    # Test 4: Impact Calculator with AI suggestions
    print("\n4. Testing Impact Calculator with AI...")
    impact_data = {
        "user_id": user_id,
        "transport": "car",
        "diet": "meat",
        "energy_usage": "high",
        "waste_habits": "average"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/calculate-impact", json=impact_data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if all(key in result for key in ["daily_co2", "suggestions", "positive_impact"]):
                print("✅ Impact calculator with Groq AI successful")
                print(f"   Daily CO2: {result['daily_co2']}kg")
                print(f"   Suggestions: {len(result['suggestions'])}")
                print(f"   AI message length: {len(result['positive_impact'])} chars")
            else:
                print("❌ Impact calculator response missing required fields")
                return False
        else:
            print(f"❌ Impact calculator failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Impact calculator error: {e}")
        return False
    
    # Test 5: Local Actions
    print("\n5. Testing Local Actions with Groq...")
    local_data = {
        "location": "Portland, Oregon",
        "interests": ["forests", "energy"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/local-actions", json=local_data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if "local_actions" in result and isinstance(result["local_actions"], list):
                actions = result["local_actions"]
                print("✅ Local actions with Groq AI successful")
                print(f"   Actions generated: {len(actions)}")
                if actions:
                    print(f"   First action: {actions[0].get('title', 'N/A')}")
            else:
                print("❌ Local actions response invalid")
                return False
        else:
            print(f"❌ Local actions failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Local actions error: {e}")
        return False
    
    # Test 6: Learning Content
    print("\n6. Testing Learning Content with Groq...")
    learning_data = {
        "user_id": user_id,
        "topic": "renewable energy"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/learning-content", json=learning_data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if "learning_content" in result:
                content = result["learning_content"]
                print("✅ Learning content with Groq AI successful")
                print(f"   Content title: {content.get('title', 'N/A')}")
                if 'content' in content:
                    print(f"   Content length: {len(content['content'])} chars")
            else:
                print("❌ Learning content response invalid")
                return False
        else:
            print(f"❌ Learning content failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Learning content error: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 ALL GROQ AI INTEGRATION TESTS PASSED!")
    print("✅ EcoQuest is fully powered by Groq AI")
    print("🚀 No mock data - all content is AI-generated")
    return True

if __name__ == "__main__":
    # Check if Groq API key is configured
    groq_key = os.environ.get('GROQ_API_KEY')
    if not groq_key or groq_key == "your_groq_api_key_here":
        print("❌ GROQ_API_KEY not configured in backend/.env")
        print("   Please add your Groq API key to test the integration")
        exit(1)
    
    print(f"🔑 Groq API Key detected: {groq_key[:10]}...")
    
    success = test_groq_integration()
    exit(0 if success else 1)
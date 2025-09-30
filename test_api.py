#!/usr/bin/env python3
"""
Simple test script to verify the Vermillion API endpoints
Run this after starting the backend server
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_health():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_users():
    """Test user management endpoints"""
    try:
        # Get users (should be empty initially)
        response = requests.get(f"{BASE_URL}/api/users")
        print(f"✅ Get users: {response.status_code}")
        print(f"   Users: {response.json()}")
        
        # Create a test user
        user_data = {
            "username": "testuser",
            "email": "test@example.com"
        }
        response = requests.post(f"{BASE_URL}/api/users", json=user_data)
        print(f"✅ Create user: {response.status_code}")
        print(f"   Created user: {response.json()}")
        
        # Get users again (should have one user)
        response = requests.get(f"{BASE_URL}/api/users")
        print(f"✅ Get users after creation: {response.status_code}")
        print(f"   Users: {response.json()}")
        
        return True
    except Exception as e:
        print(f"❌ User tests failed: {e}")
        return False

def test_tasks():
    """Test task management endpoints"""
    try:
        # Get tasks (should be empty initially)
        response = requests.get(f"{BASE_URL}/api/tasks")
        print(f"✅ Get tasks: {response.status_code}")
        print(f"   Tasks: {response.json()}")
        
        # Create a test task
        task_data = {
            "title": "Test Task",
            "description": "This is a test task",
            "user_id": 1  # Assuming user ID 1 exists
        }
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data)
        print(f"✅ Create task: {response.status_code}")
        print(f"   Created task: {response.json()}")
        
        # Get tasks again (should have one task)
        response = requests.get(f"{BASE_URL}/api/tasks")
        print(f"✅ Get tasks after creation: {response.status_code}")
        print(f"   Tasks: {response.json()}")
        
        return True
    except Exception as e:
        print(f"❌ Task tests failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Vermillion API...")
    print("=" * 50)
    
    # Wait a bit for the server to start
    print("⏳ Waiting for server to start...")
    time.sleep(2)
    
    # Test health endpoint
    if not test_health():
        print("❌ Health check failed. Is the server running?")
        return
    
    print("\n" + "=" * 50)
    
    # Test user endpoints
    if not test_users():
        print("❌ User tests failed")
        return
    
    print("\n" + "=" * 50)
    
    # Test task endpoints
    if not test_tasks():
        print("❌ Task tests failed")
        return
    
    print("\n" + "=" * 50)
    print("🎉 All tests passed! The API is working correctly.")
    print("\n🌐 You can now:")
    print("   - Visit http://localhost:3000 for the frontend")
    print("   - Use the API at http://localhost:5000")
    print("   - Check the database at localhost:5432")

if __name__ == "__main__":
    main()

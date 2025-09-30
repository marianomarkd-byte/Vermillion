#!/usr/bin/env python3
"""
Test script for the Projects API endpoints
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5001"

def test_projects_api():
    """Test all Projects API endpoints"""
    
    print("🧪 Testing Projects API...")
    print("=" * 50)
    
    # Test 1: Get all projects (should be empty initially)
    print("1. Testing GET /api/projects (empty)")
    try:
        response = requests.get(f"{BASE_URL}/api/projects")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        print("   ✅ GET projects successful")
    except Exception as e:
        print(f"   ❌ GET projects failed: {e}")
        return False
    
    print()
    
    # Test 2: Create a project
    print("2. Testing POST /api/projects (create)")
    project_data = {
        "project_number": "PRJ-001",
        "project_name": "Test Project Alpha",
        "project_start_date": "2024-01-01",
        "project_end_date": "2024-12-31"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/projects", json=project_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 201:
            created_project = response.json()
            print(f"   ✅ Project created successfully!")
            print(f"   VUID: {created_project['vuid']}")
            print(f"   Project Number: {created_project['project_number']}")
            print(f"   Project Name: {created_project['project_name']}")
            print(f"   Start Date: {created_project['project_start_date']}")
            print(f"   End Date: {created_project['project_end_date']}")
            vuid = created_project['vuid']
        else:
            print(f"   ❌ Project creation failed: {response.json()}")
            return False
    except Exception as e:
        print(f"   ❌ Project creation failed: {e}")
        return False
    
    print()
    
    # Test 3: Get all projects (should have one now)
    print("3. Testing GET /api/projects (with data)")
    try:
        response = requests.get(f"{BASE_URL}/api/projects")
        print(f"   Status: {response.status_code}")
        projects = response.json()
        print(f"   Found {len(projects)} projects")
        print("   ✅ GET projects successful")
    except Exception as e:
        print(f"   ❌ GET projects failed: {e}")
        return False
    
    print()
    
    # Test 4: Get specific project by VUID
    print("4. Testing GET /api/projects/<vuid>")
    try:
        response = requests.get(f"{BASE_URL}/api/projects/{vuid}")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            project = response.json()
            print(f"   ✅ Retrieved project: {project['project_name']}")
        else:
            print(f"   ❌ GET project failed: {response.json()}")
            return False
    except Exception as e:
        print(f"   ❌ GET project failed: {e}")
        return False
    
    print()
    
    # Test 5: Update project
    print("5. Testing PUT /api/projects/<vuid> (update)")
    update_data = {
        "project_name": "Updated Test Project Alpha",
        "project_end_date": "2025-06-30"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/api/projects/{vuid}", json=update_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            updated_project = response.json()
            print(f"   ✅ Project updated successfully!")
            print(f"   New Name: {updated_project['project_name']}")
            print(f"   New End Date: {updated_project['project_end_date']}")
        else:
            print(f"   ❌ Project update failed: {response.json()}")
            return False
    except Exception as e:
        print(f"   ❌ Project update failed: {e}")
        return False
    
    print()
    
    # Test 6: Create another project
    print("6. Testing POST /api/projects (create second project)")
    project_data_2 = {
        "project_number": "PRJ-002",
        "project_name": "Test Project Beta",
        "project_start_date": "2024-06-01",
        "project_end_date": "2025-05-31"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/projects", json=project_data_2)
        print(f"   Status: {response.status_code}")
        if response.status_code == 201:
            created_project_2 = response.json()
            print(f"   ✅ Second project created successfully!")
            print(f"   VUID: {created_project_2['vuid']}")
            print(f"   Project Number: {created_project_2['project_number']}")
        else:
            print(f"   ❌ Second project creation failed: {response.json()}")
            return False
    except Exception as e:
        print(f"   ❌ Second project creation failed: {e}")
        return False
    
    print()
    
    # Test 7: Get all projects (should have two now)
    print("7. Testing GET /api/projects (final count)")
    try:
        response = requests.get(f"{BASE_URL}/api/projects")
        print(f"   Status: {response.status_code}")
        projects = response.json()
        print(f"   Found {len(projects)} projects")
        print("   ✅ GET projects successful")
    except Exception as e:
        print(f"   ❌ GET projects failed: {e}")
        return False
    
    print()
    print("🎉 All Projects API tests passed!")
    return True

if __name__ == "__main__":
    success = test_projects_api()
    
    if success:
        print("\n✅ Projects API is working correctly!")
        print("   You can now use the Projects endpoints in your application.")
    else:
        print("\n💥 Projects API tests failed!")
        print("   Please check the error messages above.")

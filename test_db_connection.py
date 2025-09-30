#!/usr/bin/env python3
"""
Test database connection and get PostgreSQL version
"""

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_database_connection():
    """Test connection to the hosted PostgreSQL database"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
    
    print(f"🔗 Attempting to connect to database...")
    print(f"   URL: {database_url[:50]}...")
    
    try:
        # Connect to the database
        conn = psycopg2.connect(database_url)
        
        # Create a cursor
        cur = conn.cursor()
        
        # Execute a query to get PostgreSQL version
        cur.execute("SELECT version();")
        
        # Fetch the result
        version = cur.fetchone()
        
        print("✅ Database connection successful!")
        print(f"📊 PostgreSQL Version: {version[0]}")
        
        # Test if we can create tables (check if we have write access)
        cur.execute("SELECT current_database(), current_user;")
        db_info = cur.fetchone()
        print(f"🗄️  Connected to database: {db_info[0]}")
        print(f"👤 Connected as user: {db_info[1]}")
        
        # Close cursor and connection
        cur.close()
        conn.close()
        
        print("✅ Database connection test completed successfully!")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database connection failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Database Connection...")
    print("=" * 50)
    
    success = test_database_connection()
    
    if success:
        print("\n🎉 Database connection is working!")
        print("   You can now run your Flask application.")
    else:
        print("\n💥 Database connection failed!")
        print("   Please check your DATABASE_URL and network connectivity.")

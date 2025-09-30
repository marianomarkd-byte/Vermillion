#!/usr/bin/env python3
"""
Test Flask app database connection and basic functionality
"""

from app import app, db

def test_flask_app():
    """Test if the Flask app can start and connect to database"""
    
    print("🧪 Testing Flask App...")
    print("=" * 50)
    
    try:
        # Test database connection within app context
        with app.app_context():
            print("✅ App context created successfully")
            
            # Test database connection
            with db.engine.connect() as conn:
                result = conn.execute(db.text('SELECT 1'))
                print("✅ Database connection successful")
            
            # Test if tables exist
            print("📊 Checking database tables...")
            with db.engine.connect() as conn:
                result = conn.execute(db.text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
                tables = [row[0] for row in result]
                print(f"✅ Found {len(tables)} tables: {tables[:5]}...")
            
            print("\n🎉 Flask app database test successful!")
            return True
            
    except Exception as e:
        print(f"❌ Flask app test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_flask_app()
    
    if success:
        print("\n🚀 Flask app is ready to run!")
    else:
        print("\n💥 Flask app has issues that need to be fixed!")

from app import app, db

def test_db_connection():
    try:
        with app.app_context():
            # Test database connection
            result = db.session.execute(db.text('SELECT 1'))
            print("✅ Database connection successful!")
            
            # Test if tables exist and have data
            result = db.session.execute(db.text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            print(f"📊 Found {len(tables)} tables: {tables}")
            
            # Test if projects table has data
            result = db.session.execute(db.text('SELECT COUNT(*) FROM project'))
            count = result.scalar()
            print(f"📝 Projects table has {count} records")
            
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_db_connection()




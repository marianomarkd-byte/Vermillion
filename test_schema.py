from app import app, db
from sqlalchemy import inspect

def test_schema():
    try:
        with app.app_context():
            inspector = inspect(db.engine)
            
            print("🔍 Checking database schemas...")
            print("=" * 50)
            
            # Get all tables
            tables = inspector.get_table_names()
            print(f"\n📊 Found {len(tables)} tables")
            
            for table in tables:
                print(f"\n📝 Table: {table}")
                
                # Get columns
                columns = inspector.get_columns(table)
                print("  Columns:")
                for col in columns:
                    print(f"    - {col['name']}: {col['type']}")
                
                # Get foreign keys
                fks = inspector.get_foreign_keys(table)
                if fks:
                    print("  Foreign Keys:")
                    for fk in fks:
                        print(f"    - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
                
                # Get primary keys
                pks = inspector.get_primary_keys(table)
                if pks:
                    print(f"  Primary Keys: {pks}")
                
                # Get indexes
                indexes = inspector.get_indexes(table)
                if indexes:
                    print("  Indexes:")
                    for idx in indexes:
                        print(f"    - {idx['name']}: {idx['column_names']}")

            print("\n✅ Schema check completed!")
            return True
            
    except Exception as e:
        print(f"\n❌ Schema check failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_schema()




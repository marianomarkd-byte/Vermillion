#!/usr/bin/env python3
"""
Script to create the posted records tables for the journal entry posting system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app, db, PostedRecord, PostedRecordLineItem

def create_posted_records_tables():
    """Create the posted records tables"""
    with app.app_context():
        try:
            print("Creating posted_records table...")
            db.create_all()
            print("✅ Posted records tables created successfully!")
            
            # Verify tables were created
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'posted_records' in tables:
                print("✅ posted_records table exists")
            else:
                print("❌ posted_records table not found")
                
            if 'posted_record_line_items' in tables:
                print("✅ posted_record_line_items table exists")
            else:
                print("❌ posted_record_line_items table not found")
                
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            return False
            
    return True

if __name__ == "__main__":
    print("Creating Posted Records Tables...")
    success = create_posted_records_tables()
    if success:
        print("\n🎉 Posted records system is ready!")
        print("\nNext steps:")
        print("1. Restart the backend server")
        print("2. Test the posting API endpoints")
        print("3. Add posting buttons to the frontend")
    else:
        print("\n❌ Failed to create tables")
        sys.exit(1)


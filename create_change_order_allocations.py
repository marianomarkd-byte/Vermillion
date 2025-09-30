#!/usr/bin/env python3
"""
Migration script to create change order line allocation tables
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the Flask app and database from main.py
from app.main import app, db, InternalChangeOrderLineAllocation, ExternalChangeOrderLineAllocation

def create_allocation_tables():
    """Create the allocation tables for change order lines"""
    with app.app_context():
        try:
            # Create the tables
            db.create_all()
            print("✅ Successfully created change order line allocation tables")
            print("   - internal_change_order_line_allocations")
            print("   - external_change_order_line_allocations")
            
        except Exception as e:
            print(f"❌ Error creating allocation tables: {str(e)}")
            return False
    
    return True

if __name__ == "__main__":
    print("🔄 Creating change order line allocation tables...")
    success = create_allocation_tables()
    
    if success:
        print("✅ Migration completed successfully!")
    else:
        print("❌ Migration failed!")
        sys.exit(1)

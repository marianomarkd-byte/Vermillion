#!/usr/bin/env python3
"""
Fix project_contract_items table to support both global and project-specific cost codes
by removing the foreign key constraint on cost_code_vuid
"""

import sqlite3
import sys
import os

def fix_contract_items_cost_code_fk():
    """Remove foreign key constraint on cost_code_vuid in project_contract_items table"""
    
    # Get the database path
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'vermillion.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Current foreign keys on project_contract_items:")
        cursor.execute('PRAGMA foreign_key_list(project_contract_items)')
        fks = cursor.fetchall()
        for fk in fks:
            print(f"  {fk[3]} -> {fk[2]}.{fk[4]}")
        
        # SQLite doesn't support dropping foreign key constraints directly
        # We need to recreate the table without the constraint
        
        print("\nCreating new table without cost_code_vuid foreign key constraint...")
        
        # Get the current table structure
        cursor.execute('PRAGMA table_info(project_contract_items)')
        columns = cursor.fetchall()
        
        # Create the new table definition
        create_sql = """
        CREATE TABLE project_contract_items_new (
            vuid VARCHAR(36) PRIMARY KEY,
            contract_vuid VARCHAR(36) NOT NULL,
            item_number VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
            unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'EA',
            unit_price NUMERIC(15, 2),
            total_amount NUMERIC(15, 2),
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            cost_code_vuid VARCHAR(36),
            cost_type_vuid VARCHAR(36),
            specifications TEXT,
            delivery_location VARCHAR(200),
            delivery_date DATE,
            warranty_info TEXT,
            notes TEXT,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (contract_vuid) REFERENCES project_contracts(vuid),
            FOREIGN KEY (cost_type_vuid) REFERENCES cost_types(vuid)
        )
        """
        
        cursor.execute(create_sql)
        
        # Copy data from old table to new table
        print("Copying data to new table...")
        cursor.execute('INSERT INTO project_contract_items_new SELECT * FROM project_contract_items')
        
        # Drop the old table
        print("Dropping old table...")
        cursor.execute('DROP TABLE project_contract_items')
        
        # Rename new table to original name
        print("Renaming new table...")
        cursor.execute('ALTER TABLE project_contract_items_new RENAME TO project_contract_items')
        
        # Commit changes
        conn.commit()
        
        print("\nNew foreign keys on project_contract_items:")
        cursor.execute('PRAGMA foreign_key_list(project_contract_items)')
        fks = cursor.fetchall()
        for fk in fks:
            print(f"  {fk[3]} -> {fk[2]}.{fk[4]}")
        
        print("\n✅ Successfully removed cost_code_vuid foreign key constraint!")
        print("   Now cost_code_vuid can reference either global cost_codes or project_cost_codes")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    success = fix_contract_items_cost_code_fk()
    sys.exit(0 if success else 1)



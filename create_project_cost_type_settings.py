#!/usr/bin/env python3
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_project_cost_type_settings_table():
    """Create the project_cost_type_settings table for project-specific cost type expense account overrides"""
    
    try:
        # Connect to database
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        
        # Create the project_cost_type_settings table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS project_cost_type_settings (
            vuid VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            project_vuid VARCHAR(36) NOT NULL,
            cost_type_vuid VARCHAR(36) NOT NULL,
            expense_account VARCHAR(50) NOT NULL,
            is_override BOOLEAN NOT NULL DEFAULT true,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Foreign key constraints
            CONSTRAINT fk_project_cost_type_settings_project 
                FOREIGN KEY (project_vuid) REFERENCES project(vuid) ON DELETE CASCADE,
            CONSTRAINT fk_project_cost_type_settings_cost_type 
                FOREIGN KEY (cost_type_vuid) REFERENCES cost_type(vuid) ON DELETE CASCADE,
            
            -- Unique constraint to prevent duplicate project-cost type combinations
            CONSTRAINT unique_project_cost_type UNIQUE (project_vuid, cost_type_vuid)
        );
        """
        
        cursor.execute(create_table_sql)
        print("✅ Created project_cost_type_settings table")
        
        # Create index for better performance
        create_index_sql = """
        CREATE INDEX IF NOT EXISTS idx_project_cost_type_settings_project 
        ON project_cost_type_settings (project_vuid);
        """
        
        cursor.execute(create_index_sql)
        print("✅ Created index on project_vuid")
        
        # Create index for cost type lookups
        create_index_sql2 = """
        CREATE INDEX IF NOT EXISTS idx_project_cost_type_settings_cost_type 
        ON project_cost_type_settings (cost_type_vuid);
        """
        
        cursor.execute(create_index_sql2)
        print("✅ Created index on cost_type_vuid")
        
        # Commit the changes
        conn.commit()
        print("✅ Database changes committed successfully")
        
        # Verify the table was created
        cursor.execute("""
            SELECT table_name, column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'project_cost_type_settings' 
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("\n📋 Table structure created:")
        for column in columns:
            table_name, column_name, data_type, is_nullable = column
            nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
            print(f"  • {column_name}: {data_type} {nullable}")
        
        # Show sample data structure
        print("\n📊 Sample data structure:")
        print("  • project_vuid: UUID of the project")
        print("  • cost_type_vuid: UUID of the cost type")
        print("  • expense_account: Custom expense account for this project/cost type combination")
        print("  • is_override: Boolean indicating if this is an override (default: true)")
        print("  • notes: Optional notes about the override")
        
        print("\n🎯 Use cases:")
        print("  • Override default expense account for Labor cost type on specific projects")
        print("  • Set different expense accounts for Materials on different project types")
        print("  • Customize expense tracking per project while maintaining cost type defaults")
        
        cursor.close()
        conn.close()
        print("\n✅ Database connection closed")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    print("🚀 Creating Project Cost Type Settings Table")
    print("=" * 50)
    create_project_cost_type_settings_table()

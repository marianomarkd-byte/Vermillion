#!/usr/bin/env python3
"""
Fix project_billing_line_items table foreign key constraint for cost_code_vuid to support project-specific cost codes.

This script removes the foreign key constraint on project_billing_line_items.cost_code_vuid that only allowed
references to the cost_codes table. This is necessary because we now support project-specific 
cost codes which are stored in the project_cost_codes table.

The application will handle validation to ensure cost_code_vuid references either:
- A valid entry in cost_codes table (global cost codes)  
- A valid entry in project_cost_codes table (project-specific cost codes)
"""

import psycopg2
import os
from urllib.parse import urlparse

def get_db_connection():
    """Get database connection from environment variables"""
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        # Parse DATABASE_URL (format: postgresql://user:password@host:port/database)
        parsed = urlparse(database_url)
        return psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path[1:]  # Remove leading slash
        )
    else:
        # Fallback to individual environment variables
        return psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password'),
            database=os.getenv('DB_NAME', 'vermillion')
        )

def main():
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("Connected to PostgreSQL database")
        
        # Check if the foreign key constraint exists
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'project_billing_line_items' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%cost_code_vuid%';
        """)
        
        constraints = cursor.fetchall()
        print(f"Found {len(constraints)} cost_code_vuid foreign key constraints on project_billing_line_items table:")
        for constraint in constraints:
            print(f"  - {constraint[0]}")
        
        if not constraints:
            print("No cost_code_vuid foreign key constraints found on project_billing_line_items table")
            return
        
        # Drop each foreign key constraint
        for constraint in constraints:
            constraint_name = constraint[0]
            print(f"\nDropping foreign key constraint: {constraint_name}")
            
            drop_sql = f"ALTER TABLE project_billing_line_items DROP CONSTRAINT {constraint_name};"
            cursor.execute(drop_sql)
            print(f"✅ Successfully dropped constraint: {constraint_name}")
        
        # Commit changes
        conn.commit()
        print(f"\n🎉 Successfully removed {len(constraints)} foreign key constraint(s) from project_billing_line_items table")
        print("The application will now handle cost_code_vuid validation for both global and project-specific cost codes")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("Database connection closed")

if __name__ == "__main__":
    main()



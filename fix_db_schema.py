#!/usr/bin/env python3
"""
Script to fix the database schema by renaming columns to match the expected model structure.
"""

from app import create_app, db
from sqlalchemy import text

def fix_database_schema():
    """Fix the database schema by renaming columns."""
    app = create_app()
    
    with app.app_context():
        try:
            # Rename columns in project table
            print("Renaming columns in project table...")
            
            # Rename project_start_date to start_date
            db.session.execute(text("""
                ALTER TABLE project 
                RENAME COLUMN project_start_date TO start_date
            """))
            
            # Rename project_end_date to end_date
            db.session.execute(text("""
                ALTER TABLE project 
                RENAME COLUMN project_end_date TO end_date
            """))
            
            # Rename project_description to description
            db.session.execute(text("""
                ALTER TABLE project 
                RENAME COLUMN project_description TO description
            """))
            
            # Add missing columns
            print("Adding missing columns...")
            
            # Add total_budget column
            db.session.execute(text("""
                ALTER TABLE project 
                ADD COLUMN total_budget NUMERIC(15, 2)
            """))
            
            # Add currency column
            db.session.execute(text("""
                ALTER TABLE project 
                ADD COLUMN currency VARCHAR(3) DEFAULT 'USD'
            """))
            
            # Add client_name column
            db.session.execute(text("""
                ALTER TABLE project 
                ADD COLUMN client_name VARCHAR(200)
            """))
            
            # Add project_manager column
            db.session.execute(text("""
                ALTER TABLE project 
                ADD COLUMN project_manager VARCHAR(100)
            """))
            
            # Add location column
            db.session.execute(text("""
                ALTER TABLE project 
                ADD COLUMN location VARCHAR(200)
            """))
            
            # Add notes column
            db.session.execute(text("""
                ALTER TABLE project 
                ADD COLUMN notes TEXT
            """))
            
            # Commit the changes
            db.session.commit()
            print("Database schema updated successfully!")
            
        except Exception as e:
            print(f"Error updating database schema: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    fix_database_schema()

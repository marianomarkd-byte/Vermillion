#!/usr/bin/env python3
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def delete_cost_types_except_four():
    """Delete all cost types except Labor, Subcontractor, Materials, and Equipment"""
    
    # The four cost types to keep
    keep_cost_types = ['Labor', 'Subcontractor', 'Materials', 'Equipment']
    
    try:
        # Connect to database
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        
        # First, let's see what cost types we currently have
        cursor.execute("SELECT cost_type FROM cost_type ORDER BY created_at")
        current_cost_types = cursor.fetchall()
        
        print(f"Current cost types ({len(current_cost_types)} total):")
        for i, (cost_type,) in enumerate(current_cost_types, 1):
            print(f"  {i:2d}. {cost_type}")
        
        # Find which ones we'll keep and which ones we'll delete
        cost_types_to_keep = []
        cost_types_to_delete = []
        
        for (cost_type,) in current_cost_types:
            if cost_type in keep_cost_types:
                cost_types_to_keep.append(cost_type)
            else:
                cost_types_to_delete.append(cost_type)
        
        print(f"\nCost types to KEEP ({len(cost_types_to_keep)}):")
        for cost_type in cost_types_to_keep:
            print(f"  ✅ {cost_type}")
        
        print(f"\nCost types to DELETE ({len(cost_types_to_delete)}):")
        for cost_type in cost_types_to_delete:
            print(f"  ❌ {cost_type}")
        
        if not cost_types_to_delete:
            print("\n✅ No cost types to delete. All specified types are already present.")
            return
        
        # Confirm deletion
        print(f"\n⚠️  About to delete {len(cost_types_to_delete)} cost types")
        confirm = input("Are you sure you want to proceed? (yes/no): ")
        
        if confirm.lower() != 'yes':
            print("❌ Deletion cancelled")
            return
        
        # Delete all cost types except the four specified
        cursor.execute("""
            DELETE FROM cost_type 
            WHERE cost_type NOT IN (%s, %s, %s, %s)
        """, tuple(keep_cost_types))
        
        deleted_count = cursor.rowcount
        
        # Commit changes
        conn.commit()
        print(f"✅ Successfully deleted {deleted_count} cost types")
        
        # Show remaining cost types
        cursor.execute("SELECT cost_type FROM cost_type ORDER BY created_at")
        remaining_cost_types = cursor.fetchall()
        
        print(f"\nRemaining cost types ({len(remaining_cost_types)} total):")
        for i, (cost_type,) in enumerate(remaining_cost_types, 1):
            print(f"  {i:2d}. {cost_type}")
        
        # Verify the count matches what we expect
        if len(remaining_cost_types) == 4:
            print("\n✅ Perfect! Exactly 4 cost types remain as requested.")
        else:
            print(f"\n⚠️  Warning: Expected 4 cost types, but found {len(remaining_cost_types)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    delete_cost_types_except_four()

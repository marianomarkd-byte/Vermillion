#!/usr/bin/env python3
"""
Database Orphaned Records Checker
Checks for orphaned records that could cause relationship issues
"""

import sqlite3
import os
from datetime import datetime

def check_database_integrity():
    """Check for orphaned records and database integrity issues"""
    
    # Find the database file
    db_path = None
    possible_paths = [
        'instance/test_journal.db',
        'test_journal.db',
        'vermillion.db',
        'app.db'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("❌ No database file found!")
        return
    
    print(f"🔍 Checking database: {db_path}")
    print(f"📅 Check time: {datetime.now()}")
    print("=" * 60)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"📋 Found tables: {', '.join(tables)}")
        print()
        
        # Check for orphaned contract items
        print("🔍 CHECKING CONTRACT ITEMS:")
        print("-" * 40)
        
        # Check if contract_items table exists
        if 'project_contract_items' in tables:
            # Check for items without valid contract_vuid
            cursor.execute("""
                SELECT COUNT(*) FROM project_contract_items 
                WHERE contract_vuid IS NULL OR contract_vuid = ''
            """)
            null_contract_count = cursor.fetchone()[0]
            print(f"Items with NULL/empty contract_vuid: {null_contract_count}")
            
            # Check for items with contract_vuid that don't exist in contracts table
            cursor.execute("""
                SELECT COUNT(*) FROM project_contract_items pci
                LEFT JOIN project_contracts pc ON pci.contract_vuid = pc.vuid
                WHERE pc.vuid IS NULL AND pci.contract_vuid IS NOT NULL
            """)
            orphaned_items_count = cursor.fetchone()[0]
            print(f"Items with non-existent contract_vuid: {orphaned_items_count}")
            
            # Show examples of orphaned items
            if orphaned_items_count > 0:
                cursor.execute("""
                    SELECT pci.vuid, pci.item_number, pci.contract_vuid, pci.total_amount
                    FROM project_contract_items pci
                    LEFT JOIN project_contracts pc ON pci.contract_vuid = pc.vuid
                    WHERE pc.vuid IS NULL AND pci.contract_vuid IS NOT NULL
                    LIMIT 5
                """)
                orphaned_examples = cursor.fetchall()
                print("  Examples of orphaned items:")
                for item in orphaned_examples:
                    print(f"    - Item {item[1]} (VUID: {item[0]}) -> Contract VUID: {item[2]} | Amount: ${item[3]}")
            
            # Check total items count
            cursor.execute("SELECT COUNT(*) FROM project_contract_items")
            total_items = cursor.fetchone()[0]
            print(f"Total contract items: {total_items}")
            
            # Check items by contract
            cursor.execute("""
                SELECT contract_vuid, COUNT(*) as item_count, SUM(CAST(total_amount AS REAL)) as total_amount
                FROM project_contract_items 
                WHERE contract_vuid IS NOT NULL 
                GROUP BY contract_vuid
                ORDER BY item_count DESC
            """)
            items_by_contract = cursor.fetchall()
            print(f"Items by contract (top 10):")
            for i, (contract_vuid, count, amount) in enumerate(items_by_contract[:10]):
                print(f"  {i+1}. Contract {contract_vuid}: {count} items, Total: ${amount or 0:.2f}")
        
        print()
        
        # Check contracts table
        print("🔍 CHECKING CONTRACTS:")
        print("-" * 40)
        
        if 'project_contracts' in tables:
            cursor.execute("SELECT COUNT(*) FROM project_contracts")
            total_contracts = cursor.fetchone()[0]
            print(f"Total contracts: {total_contracts}")
            
            # Check contracts without valid project_vuid
            cursor.execute("""
                SELECT COUNT(*) FROM project_contracts 
                WHERE project_vuid IS NULL OR project_vuid = ''
            """)
            null_project_count = cursor.fetchone()[0]
            print(f"Contracts with NULL/empty project_vuid: {null_project_count}")
            
            # Check contract amounts
            cursor.execute("""
                SELECT contract_number, contract_amount, vuid
                FROM project_contracts 
                ORDER BY CAST(contract_amount AS REAL) DESC
                LIMIT 10
            """)
            top_amounts = cursor.fetchall()
            print(f"Top 10 contract amounts:")
            for i, (number, amount, vuid) in enumerate(top_amounts):
                print(f"  {i+1}. {number}: ${amount or 0:.2f} (VUID: {vuid})")
        
        print()
        
        # Check allocations table
        print("🔍 CHECKING ALLOCATIONS:")
        print("-" * 40)
        
        if 'project_contract_item_allocations' in tables:
            cursor.execute("SELECT COUNT(*) FROM project_contract_item_allocations")
            total_allocations = cursor.fetchone()[0]
            print(f"Total allocations: {total_allocations}")
            
            # Check allocations without valid item_vuid
            cursor.execute("""
                SELECT COUNT(*) FROM project_contract_item_allocations pcia
                LEFT JOIN project_contract_items pci ON pcia.item_vuid = pci.vuid
                WHERE pci.vuid IS NULL
            """)
            orphaned_allocations_count = cursor.fetchone()[0]
            print(f"Allocations with non-existent item_vuid: {orphaned_allocations_count}")
        
        print()
        
        # Check for data inconsistencies
        print("🔍 CHECKING FOR DATA INCONSISTENCIES:")
        print("-" * 40)
        
        if 'project_contract_items' in tables and 'project_contracts' in tables:
            # Check if contract amounts match sum of items
            cursor.execute("""
                SELECT 
                    pc.contract_number,
                    pc.vuid as contract_vuid,
                    pc.contract_amount as contract_total,
                    COALESCE(SUM(CAST(pci.total_amount AS REAL)), 0) as items_total,
                    COUNT(pci.vuid) as item_count
                FROM project_contracts pc
                LEFT JOIN project_contract_items pci ON pc.vuid = pci.contract_vuid
                GROUP BY pc.vuid, pc.contract_number, pc.contract_amount
                HAVING ABS(COALESCE(pc.contract_amount, 0) - COALESCE(SUM(CAST(pci.total_amount AS REAL)), 0)) > 0.01
                ORDER BY ABS(COALESCE(pc.contract_amount, 0) - COALESCE(SUM(CAST(pci.total_amount AS REAL)), 0)) DESC
                LIMIT 10
            """)
            mismatched_amounts = cursor.fetchall()
            
            if mismatched_amounts:
                print(f"Contracts with amount mismatches (top 10):")
                for contract_number, contract_vuid, contract_total, items_total, item_count in mismatched_amounts:
                    diff = abs((contract_total or 0) - (items_total or 0))
                    print(f"  - {contract_number}: Contract shows ${contract_total or 0:.2f}, Items sum to ${items_total or 0:.2f} (Diff: ${diff:.2f}) - {item_count} items")
            else:
                print("✅ All contract amounts match their item totals")
        
        print()
        print("=" * 60)
        print("🔍 DATABASE INTEGRITY CHECK COMPLETE")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    check_database_integrity()


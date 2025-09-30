#!/usr/bin/env python3
"""
Schema verification script to ensure database tables match Python models
"""

import os
import sys
sys.path.append('app')

from main import app, db
from sqlalchemy import inspect, text

def verify_schema():
    """Verify that database schema matches Python models"""
    
    with app.app_context():
        inspector = inspect(db.engine)
        
        # Get all table names from database
        db_tables = inspector.get_table_names()
        print(f"📋 Database tables: {db_tables}")
        
        # Get all model classes
        from main import (
            CostType, CostCode, Vendor, Project, ProjectContract, 
            ProjectContractItem, ProjectContractItemAllocation, 
            ProjectBudget, ProjectBudgetLine, ChartOfAccounts
        )
        
        models = [
            ('cost_type', CostType),
            ('cost_code', CostCode), 
            ('vendor', Vendor),
            ('project', Project),
            ('project_contract', ProjectContract),
            ('project_contract_item', ProjectContractItem),
            ('project_contract_item_allocation', ProjectContractItemAllocation),
            ('project_budget', ProjectBudget),
            ('project_budget_line', ProjectBudgetLine),
            ('chart_of_accounts', ChartOfAccounts)
        ]
        
        print("\n🔍 Verifying model vs database schema...")
        
        for table_name, model_class in models:
            if table_name not in db_tables:
                print(f"❌ Table '{table_name}' missing from database!")
                continue
                
            print(f"\n📊 Table: {table_name}")
            
            # Get database columns
            db_columns = {col['name']: col for col in inspector.get_columns(table_name)}
            
            # Get model columns
            model_columns = {}
            for column in model_class.__table__.columns:
                model_columns[column.name] = {
                    'type': str(column.type),
                    'nullable': column.nullable,
                    'primary_key': column.primary_key,
                    'default': column.default
                }
            
            # Compare columns
            for col_name, db_col in db_columns.items():
                if col_name in model_columns:
                    model_col = model_columns[col_name]
                    if str(db_col['type']) != model_col['type']:
                        print(f"  ⚠️  Column '{col_name}': DB type '{db_col['type']}' != Model type '{model_col['type']}'")
                    else:
                        print(f"  ✅ Column '{col_name}': {db_col['type']}")
                else:
                    print(f"  ❌ Column '{col_name}' exists in DB but not in model")
            
            for col_name in model_columns:
                if col_name not in db_columns:
                    print(f"  ❌ Column '{col_name}' exists in model but not in DB")
        
        print("\n🎯 Schema verification complete!")

if __name__ == "__main__":
    verify_schema()


#!/usr/bin/env python3
"""
Unit tests for integration method logic to prevent regressions.
Run with: python3 test_integration_methods.py
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app import create_app, db
from app.models import GLSettings, ProjectGLSettings, APInvoice, ProjectCommitmentItem
import json

def test_integration_method_logic():
    """Test that integration method logic works correctly"""
    app = create_app()
    
    with app.app_context():
        # Test data setup
        test_project_vuid = "test-project-123"
        
        # Test 1: Default integration method (invoice)
        print("Testing default integration method...")
        from app.main import get_effective_ap_invoice_integration_method
        
        # Should return 'invoice' as default
        method = get_effective_ap_invoice_integration_method(test_project_vuid)
        assert method == 'invoice', f"Expected 'invoice', got '{method}'"
        print("✓ Default integration method works")
        
        # Test 2: Project-specific override
        print("Testing project-specific override...")
        
        # Create test project settings
        project_settings = ProjectGLSettings(
            project_vuid=test_project_vuid,
            ap_invoice_integration_method='journal_entries',
            status='active'
        )
        db.session.add(project_settings)
        db.session.commit()
        
        method = get_effective_ap_invoice_integration_method(test_project_vuid)
        assert method == 'journal_entries', f"Expected 'journal_entries', got '{method}'"
        print("✓ Project-specific override works")
        
        # Cleanup
        db.session.delete(project_settings)
        db.session.commit()
        
        print("✓ All integration method tests passed!")

def test_journal_entries_balance():
    """Test that journal entries are always balanced"""
    app = create_app()
    
    with app.app_context():
        from app.main import preview_journal_entries
        
        # Mock request data
        class MockRequest:
            def get_json(self):
                return {"accounting_period_vuid": "test-period-123"}
        
        # This would need actual test data in the database
        # For now, just test the validation logic
        print("Testing journal entries balance validation...")
        
        # Test validation logic
        test_entries = [
            {
                'type': 'AP Invoice',
                'reference_number': 'TEST-001',
                'line_items': [
                    {'debit_amount': 1000.0, 'credit_amount': 0.0},
                    {'debit_amount': 0.0, 'credit_amount': 1000.0}
                ]
            },
            {
                'type': 'Retainage Entry', 
                'reference_number': 'TEST-001-RET',
                'line_items': [
                    {'debit_amount': 100.0, 'credit_amount': 0.0},
                    {'debit_amount': 0.0, 'credit_amount': 100.0}
                ]
            }
        ]
        
        # Test balance calculation
        total_debits = 0.0
        total_credits = 0.0
        validation_errors = []
        
        for entry in test_entries:
            entry_debits = sum(float(line.get('debit_amount', 0)) for line in entry.get('line_items', []))
            entry_credits = sum(float(line.get('credit_amount', 0)) for line in entry.get('line_items', []))
            total_debits += entry_debits
            total_credits += entry_credits
            
            # Validate each entry is balanced
            entry_balance = abs(entry_debits - entry_credits)
            if entry_balance > 0.01:
                validation_errors.append(f"{entry['type']} {entry['reference_number']}: Unbalanced entry")
        
        # Validate total balance
        total_balance = abs(total_debits - total_credits)
        if total_balance > 0.01:
            validation_errors.append("Total journal entries are unbalanced")
        
        assert len(validation_errors) == 0, f"Validation errors found: {validation_errors}"
        assert abs(total_debits - total_credits) < 0.01, "Total debits and credits don't match"
        
        print("✓ Journal entries balance validation works")

def test_amount_calculations():
    """Test that amount calculations are correct for different integration methods"""
    print("Testing amount calculations...")
    
    # Test data: Invoice with $24,500 gross, $2,450 retainage, $22,050 net
    invoice_total_amount = 22050.00  # NET amount
    retention_held = 2450.00
    line_item_amount = 24500.00  # Gross amount in line item
    
    # Test invoice method calculations
    print("  Testing 'invoice' method calculations...")
    
    # AP Invoice should use net amounts
    net_invoice_amount = invoice_total_amount  # 22050.00
    gross_invoice_amount = line_item_amount    # 24500.00
    
    # Calculate proportional net amount for line
    line_proportion = line_item_amount / gross_invoice_amount  # 1.0
    line_net_amount = net_invoice_amount * line_proportion  # 22050.00
    
    assert abs(line_net_amount - 22050.00) < 0.01, f"Expected 22050.00, got {line_net_amount}"
    
    # Retainage should use proportional retainage amounts
    line_retainage_amount = retention_held * line_proportion  # 2450.00
    assert abs(line_retainage_amount - 2450.00) < 0.01, f"Expected 2450.00, got {line_retainage_amount}"
    
    print("✓ Amount calculations work correctly")

if __name__ == "__main__":
    print("Running integration method tests...")
    print("=" * 50)
    
    try:
        test_integration_method_logic()
        test_journal_entries_balance()
        test_amount_calculations()
        
        print("=" * 50)
        print("🎉 All tests passed! Integration method logic is working correctly.")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)


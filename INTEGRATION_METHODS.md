# Integration Methods Documentation

## Overview

The system supports two integration methods for AP and AR invoices that determine how journal entries are generated:

1. **`invoice`** - Send invoices to ERP, create separate journal entries for retainage
2. **`journal_entries`** - Send complete journal entries including retainage

## AP Invoice Integration Methods

### Method: `invoice` (Default)

**When to use**: When your ERP system expects separate invoices and journal entries.

**Journal Entry Structure**:
- **AP Invoice Entry**: Shows NET amount only (after retainage deduction)
  - Debit: Expense accounts (proportional net amounts)
  - Credit: Accounts Payable (net amount)
- **Retainage Entry**: Separate entry for retainage liability
  - Debit: Same expense accounts (proportional retainage amounts)
  - Credit: Retainage Payable (full retainage amount)

**Example**:
```
Invoice: $24,500 gross, $2,450 retainage, $22,050 net

AP Invoice Entry:
  Debit:  Construction Costs    $22,050.00
  Credit: Accounts Payable     $22,050.00

Retainage Entry:
  Debit:  Construction Costs    $2,450.00
  Credit: Retainage Payable     $2,450.00
```

### Method: `journal_entries`

**When to use**: When your ERP system expects complete journal entries.

**Journal Entry Structure**:
- **Single Entry**: Shows GROSS amount with retainage
  - Debit: Expense accounts (gross amounts)
  - Credit: Accounts Payable (net amount)
  - Credit: Retainage Payable (retainage amount)

**Example**:
```
Invoice: $24,500 gross, $2,450 retainage, $22,050 net

Single Journal Entry:
  Debit:  Construction Costs    $24,500.00
  Credit: Accounts Payable     $22,050.00
  Credit: Retainage Payable    $2,450.00
```

## Configuration

### Global Settings
Set the default integration method in `GLSettings`:
```sql
UPDATE gl_settings SET ap_invoice_integration_method = 'invoice' WHERE status = 'active';
```

### Project-Specific Settings
Override for specific projects in `ProjectGLSettings`:
```sql
INSERT INTO project_gl_settings (project_vuid, ap_invoice_integration_method, status) 
VALUES ('project-uuid', 'journal_entries', 'active');
```

## Validation Rules

The system automatically validates that:
1. Each journal entry is balanced (debits = credits)
2. Total debits equal total credits across all entries
3. Integration method logic is applied correctly

## Error Prevention

- **Balance Validation**: Automatic checking of debits vs credits
- **Integration Method Validation**: Ensures correct logic is applied
- **Frontend Warnings**: Visual indicators for unbalanced entries
- **Backend Logging**: Detailed logs for debugging

## Testing

Always test journal entries preview after changes to ensure:
1. Entries are properly balanced
2. Integration method logic is correct
3. Retainage entries appear in correct order
4. Amounts are calculated correctly

## Common Issues

1. **Unbalanced Entries**: Usually caused by incorrect amount calculations
2. **Wrong Integration Method**: Check project and global settings
3. **Retainage Order**: Ensure retainage entries follow their invoices
4. **Amount Mismatches**: Verify net vs gross amount calculations


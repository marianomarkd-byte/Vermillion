from flask import Blueprint, request, jsonify
from app import db
from app.models import APInvoice, APInvoiceLine, Vendor, Project, AccountingPeriod, CostCode, CostType, CommitmentLine

ap_invoices_bp = Blueprint('ap_invoices', __name__)

@ap_invoices_bp.route('/ap-invoices', methods=['GET'])
def get_ap_invoices():
    """Get all AP invoices, optionally filtered by project_vuid"""
    project_vuid = request.args.get('project_vuid')
    
    query = APInvoice.query
    if project_vuid:
        query = query.filter_by(project_vuid=project_vuid)
    
    invoices = query.all()
    
    # Manually construct response with related data
    result = []
    for invoice in invoices:
        # Get vendor data
        vendor = db.session.get(Vendor, invoice.vendor_vuid) if invoice.vendor_vuid else None
        
        # Get project data
        project = db.session.get(Project, invoice.project_vuid) if invoice.project_vuid else None
        
        # Get accounting period data
        accounting_period = db.session.get(AccountingPeriod, invoice.accounting_period_vuid) if invoice.accounting_period_vuid else None
        
        # Debug output
        print(f"DEBUG: Invoice {invoice.vuid}")
        print(f"DEBUG: Vendor VUID: {invoice.vendor_vuid}, Vendor object: {vendor}")
        print(f"DEBUG: Project VUID: {invoice.project_vuid}, Project object: {project}")
        print(f"DEBUG: Accounting Period VUID: {invoice.accounting_period_vuid}, Accounting Period object: {accounting_period}")
        
        invoice_data = {
            'vuid': invoice.vuid,
            'invoice_number': invoice.invoice_number,
            'vendor_vuid': invoice.vendor_vuid,
            'project_vuid': invoice.project_vuid,
            'commitment_vuid': invoice.commitment_vuid,
            'invoice_date': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
            'due_date': invoice.due_date.isoformat() if invoice.due_date else None,
            'subtotal': float(invoice.subtotal) if invoice.subtotal else 0,
            'retention_held': float(invoice.retention_held) if invoice.retention_held else 0,
            'retention_released': float(invoice.retention_released) if invoice.retention_released else 0,
            'total_amount': float(invoice.total_amount) if invoice.total_amount else 0,
            'status': invoice.status,
            'description': invoice.description,
            'accounting_period_vuid': invoice.accounting_period_vuid,
            'exported_to_accounting': invoice.exported_to_accounting,
            'accounting_export_date': invoice.accounting_export_date.isoformat() if invoice.accounting_export_date else None,
            'created_at': invoice.created_at.isoformat(),
            'updated_at': invoice.updated_at.isoformat(),
            'vendor': {
                'vuid': vendor.vuid,
                'vendor_name': vendor.vendor_name,
                'vendor_number': vendor.vendor_number
            } if vendor else None,
            'project': {
                'vuid': project.vuid,
                'project_name': project.project_name,
                'project_number': project.project_number
            } if project else None,
            'accounting_period': {
                'vuid': accounting_period.vuid,
                'name': accounting_period.name,
                'month': accounting_period.month,
                'year': accounting_period.year
            } if accounting_period else None,
            'line_items': [
                {
                    'vuid': li.vuid,
                    'description': li.description,
                    'quantity': float(li.quantity),
                    'unit_cost': float(li.unit_cost),
                    'total_cost': float(li.total_cost),
                    'cost_code_vuid': li.cost_code_vuid,
                    'cost_type_vuid': li.cost_type_vuid,
                    'commitment_line_vuid': li.commitment_line_vuid,
                    'created_at': li.created_at.isoformat(),
                    'updated_at': li.updated_at.isoformat()
                } for li in invoice.line_items
            ]
        }
        result.append(invoice_data)
    
    return jsonify(result)

@ap_invoices_bp.route('/ap-invoices/<invoice_vuid>', methods=['GET'])
def get_ap_invoice(invoice_vuid):
    """Get a specific AP invoice by VUID"""
    try:
        invoice = APInvoice.query.get(invoice_vuid)
        
        if not invoice:
            return jsonify({'error': 'AP invoice not found'}), 404
        
        # Get related data
        vendor = db.session.get(Vendor, invoice.vendor_vuid) if invoice.vendor_vuid else None
        project = db.session.get(Project, invoice.project_vuid) if invoice.project_vuid else None
        accounting_period = db.session.get(AccountingPeriod, invoice.accounting_period_vuid) if invoice.accounting_period_vuid else None
        
        invoice_data = {
            'vuid': invoice.vuid,
            'invoice_number': invoice.invoice_number,
            'vendor_vuid': invoice.vendor_vuid,
            'project_vuid': invoice.project_vuid,
            'commitment_vuid': invoice.commitment_vuid,
            'invoice_date': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
            'due_date': invoice.due_date.isoformat() if invoice.due_date else None,
            'subtotal': float(invoice.subtotal) if invoice.subtotal else 0,
            'retention_held': float(invoice.retention_held) if invoice.retention_held else 0,
            'retention_released': float(invoice.retention_released) if invoice.retention_released else 0,
            'total_amount': float(invoice.total_amount) if invoice.total_amount else 0,
            'status': invoice.status,
            'description': invoice.description,
            'accounting_period_vuid': invoice.accounting_period_vuid,
            'exported_to_accounting': invoice.exported_to_accounting,
            'accounting_export_date': invoice.accounting_export_date.isoformat() if invoice.accounting_export_date else None,
            'created_at': invoice.created_at.isoformat(),
            'updated_at': invoice.updated_at.isoformat(),
            'vendor': {
                'vuid': vendor.vuid,
                'vendor_name': vendor.vendor_name,
                'vendor_number': vendor.vendor_number
            } if vendor else None,
            'project': {
                'vuid': project.vuid,
                'project_name': project.project_name,
                'project_number': project.project_number
            } if project else None,
            'accounting_period': {
                'vuid': accounting_period.vuid,
                'name': accounting_period.name,
                'month': accounting_period.month,
                'year': accounting_period.year
            } if accounting_period else None,
            'line_items': [
                {
                    'vuid': li.vuid,
                    'description': li.description,
                    'quantity': float(li.quantity),
                    'unit_cost': float(li.unit_cost),
                    'total_cost': float(li.total_cost),
                    'cost_code_vuid': li.cost_code_vuid,
                    'cost_type_vuid': li.cost_type_vuid,
                    'commitment_line_vuid': li.commitment_line_vuid,
                    'created_at': li.created_at.isoformat(),
                    'updated_at': li.updated_at.isoformat()
                } for li in invoice.line_items
            ]
        }
        
        return jsonify(invoice_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ap_invoices_bp.route('/ap-invoices', methods=['POST'])
def create_ap_invoice():
    """Create a new AP invoice"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['invoice_number', 'vendor_vuid', 'project_vuid', 'accounting_period_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create the invoice
        invoice = APInvoice(
            invoice_number=data['invoice_number'],
            vendor_vuid=data['vendor_vuid'],
            project_vuid=data['project_vuid'],
            commitment_vuid=data.get('commitment_vuid'),
            accounting_period_vuid=data['accounting_period_vuid'],
            invoice_date=data.get('invoice_date'),
            due_date=data.get('due_date'),
            subtotal=data.get('subtotal', 0),
            retention_held=data.get('retention_held', 0),
            retention_released=data.get('retention_released', 0),
            total_amount=data.get('total_amount', 0),
            status=data.get('status', 'draft'),
            description=data.get('description')
        )
        
        db.session.add(invoice)
        db.session.flush()  # Get the invoice ID
        
        # Create line items
        line_items_data = data.get('line_items', [])
        for line_item_data in line_items_data:
            line_item = APInvoiceLine(
                ap_invoice_vuid=invoice.vuid,
                cost_code_vuid=line_item_data['cost_code_vuid'],
                cost_type_vuid=line_item_data['cost_type_vuid'],
                commitment_line_vuid=line_item_data.get('commitment_line_vuid'),
                description=line_item_data.get('description'),
                quantity=line_item_data.get('quantity', 0),
                unit_cost=line_item_data.get('unit_cost', 0),
                total_cost=line_item_data.get('total_cost', 0)
            )
            db.session.add(line_item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'AP invoice created successfully',
            'invoice': {
                'vuid': invoice.vuid,
                'invoice_number': invoice.invoice_number
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ap_invoices_bp.route('/ap-invoices/<invoice_vuid>', methods=['PUT'])
def update_ap_invoice(invoice_vuid):
    """Update an AP invoice"""
    try:
        invoice = APInvoice.query.get(invoice_vuid)
        
        if not invoice:
            return jsonify({'error': 'AP invoice not found'}), 404
        
        data = request.get_json()
        
        # Update invoice fields
        if 'invoice_number' in data:
            invoice.invoice_number = data['invoice_number']
        if 'vendor_vuid' in data:
            invoice.vendor_vuid = data['vendor_vuid']
        if 'project_vuid' in data:
            invoice.project_vuid = data['project_vuid']
        if 'commitment_vuid' in data:
            invoice.commitment_vuid = data['commitment_vuid']
        if 'accounting_period_vuid' in data:
            invoice.accounting_period_vuid = data['accounting_period_vuid']
        if 'invoice_date' in data:
            invoice.invoice_date = data['invoice_date']
        if 'due_date' in data:
            invoice.due_date = data['due_date']
        if 'subtotal' in data:
            invoice.subtotal = data['subtotal']
        if 'retention_held' in data:
            invoice.retention_held = data['retention_held']
        if 'retention_released' in data:
            invoice.retention_released = data['retention_released']
        if 'total_amount' in data:
            invoice.total_amount = data['total_amount']
        if 'status' in data:
            invoice.status = data['status']
        if 'description' in data:
            invoice.description = data['description']
        
        # Update line items if provided
        if 'line_items' in data:
            # Delete existing line items
            APInvoiceLine.query.filter_by(ap_invoice_vuid=invoice_vuid).delete()
            
            # Create new line items
            for line_item_data in data['line_items']:
                line_item = APInvoiceLine(
                    ap_invoice_vuid=invoice.vuid,
                    cost_code_vuid=line_item_data['cost_code_vuid'],
                    cost_type_vuid=line_item_data['cost_type_vuid'],
                    commitment_line_vuid=line_item_data.get('commitment_line_vuid'),
                    description=line_item_data.get('description'),
                    quantity=line_item_data.get('quantity', 0),
                    unit_cost=line_item_data.get('unit_cost', 0),
                    total_cost=line_item_data.get('total_cost', 0)
                )
                db.session.add(line_item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'AP invoice updated successfully',
            'invoice': {
                'vuid': invoice.vuid,
                'invoice_number': invoice.invoice_number
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ap_invoices_bp.route('/ap-invoices/<invoice_vuid>', methods=['DELETE'])
def delete_ap_invoice(invoice_vuid):
    """Delete an AP invoice"""
    try:
        invoice = APInvoice.query.get(invoice_vuid)
        
        if not invoice:
            return jsonify({'error': 'AP invoice not found'}), 404
        
        db.session.delete(invoice)
        db.session.commit()
        
        return jsonify({'message': 'AP invoice deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

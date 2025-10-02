from flask import Blueprint, request, jsonify
from app import db
from app.models import ProjectBilling, ProjectBillingLine, Project, AccountingPeriod

project_billings_bp = Blueprint('project_billings', __name__)

@project_billings_bp.route('/project-billings', methods=['GET'])
def get_project_billings():
    """Get all project billings"""
    try:
        project_vuid = request.args.get('project_vuid')
        
        query = ProjectBilling.query
        if project_vuid:
            query = query.filter_by(project_vuid=project_vuid)
        
        billings = query.all()
        result = []
        
        for billing in billings:
            billing_data = {
                'vuid': billing.vuid,
                'project_vuid': billing.project_vuid,
                'accounting_period_vuid': billing.accounting_period_vuid,
                'billing_number': billing.billing_number,
                'billing_date': billing.billing_date.isoformat() if billing.billing_date else None,
                'due_date': billing.due_date.isoformat() if billing.due_date else None,
                'subtotal': float(billing.subtotal) if billing.subtotal else 0,
                'retention_held': float(billing.retention_held) if billing.retention_held else 0,
                'retention_released': float(billing.retention_released) if billing.retention_released else 0,
                'total_amount': float(billing.total_amount) if billing.total_amount else 0,
                'status': billing.status,
                'description': billing.description,
                'exported_to_accounting': billing.exported_to_accounting,
                'accounting_export_date': billing.accounting_export_date.isoformat() if billing.accounting_export_date else None,
                'created_at': billing.created_at.isoformat(),
                'updated_at': billing.updated_at.isoformat(),
                'line_items': [
                    {
                        'vuid': li.vuid,
                        'description': li.description,
                        'quantity': float(li.quantity),
                        'unit_cost': float(li.unit_cost),
                        'total_cost': float(li.total_cost),
                        'cost_code_vuid': li.cost_code_vuid,
                        'cost_type_vuid': li.cost_type_vuid,
                        'created_at': li.created_at.isoformat(),
                        'updated_at': li.updated_at.isoformat()
                    } for li in billing.line_items
                ]
            }
            result.append(billing_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@project_billings_bp.route('/project-billings/<billing_vuid>', methods=['GET'])
def get_project_billing(billing_vuid):
    """Get a specific project billing by VUID"""
    try:
        billing = ProjectBilling.query.get(billing_vuid)
        
        if not billing:
            return jsonify({'error': 'Project billing not found'}), 404
        
        billing_data = {
            'vuid': billing.vuid,
            'project_vuid': billing.project_vuid,
            'accounting_period_vuid': billing.accounting_period_vuid,
            'billing_number': billing.billing_number,
            'billing_date': billing.billing_date.isoformat() if billing.billing_date else None,
            'due_date': billing.due_date.isoformat() if billing.due_date else None,
            'subtotal': float(billing.subtotal) if billing.subtotal else 0,
            'retention_held': float(billing.retention_held) if billing.retention_held else 0,
            'retention_released': float(billing.retention_released) if billing.retention_released else 0,
            'total_amount': float(billing.total_amount) if billing.total_amount else 0,
            'status': billing.status,
            'description': billing.description,
            'exported_to_accounting': billing.exported_to_accounting,
            'accounting_export_date': billing.accounting_export_date.isoformat() if billing.accounting_export_date else None,
            'created_at': billing.created_at.isoformat(),
            'updated_at': billing.updated_at.isoformat(),
            'line_items': [
                {
                    'vuid': li.vuid,
                    'description': li.description,
                    'quantity': float(li.quantity),
                    'unit_cost': float(li.unit_cost),
                    'total_cost': float(li.total_cost),
                    'cost_code_vuid': li.cost_code_vuid,
                    'cost_type_vuid': li.cost_type_vuid,
                    'created_at': li.created_at.isoformat(),
                    'updated_at': li.updated_at.isoformat()
                } for li in billing.line_items
            ]
        }
        
        return jsonify(billing_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@project_billings_bp.route('/project-billings', methods=['POST'])
def create_project_billing():
    """Create a new project billing"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['billing_number', 'project_vuid', 'accounting_period_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create the billing
        billing = ProjectBilling(
            billing_number=data['billing_number'],
            project_vuid=data['project_vuid'],
            accounting_period_vuid=data['accounting_period_vuid'],
            billing_date=data.get('billing_date'),
            due_date=data.get('due_date'),
            subtotal=data.get('subtotal', 0),
            retention_held=data.get('retention_held', 0),
            retention_released=data.get('retention_released', 0),
            total_amount=data.get('total_amount', 0),
            status=data.get('status', 'draft'),
            description=data.get('description')
        )
        
        db.session.add(billing)
        db.session.flush()  # Get the billing ID
        
        # Create line items
        line_items_data = data.get('line_items', [])
        for line_item_data in line_items_data:
            line_item = ProjectBillingLine(
                project_billing_vuid=billing.vuid,
                cost_code_vuid=line_item_data['cost_code_vuid'],
                cost_type_vuid=line_item_data['cost_type_vuid'],
                description=line_item_data.get('description'),
                quantity=line_item_data.get('quantity', 0),
                unit_cost=line_item_data.get('unit_cost', 0),
                total_cost=line_item_data.get('total_cost', 0)
            )
            db.session.add(line_item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Project billing created successfully',
            'billing': {
                'vuid': billing.vuid,
                'billing_number': billing.billing_number
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@project_billings_bp.route('/project-billings/<billing_vuid>', methods=['PUT'])
def update_project_billing(billing_vuid):
    """Update a project billing"""
    try:
        billing = ProjectBilling.query.get(billing_vuid)
        
        if not billing:
            return jsonify({'error': 'Project billing not found'}), 404
        
        data = request.get_json()
        
        # Update billing fields
        if 'billing_number' in data:
            billing.billing_number = data['billing_number']
        if 'project_vuid' in data:
            billing.project_vuid = data['project_vuid']
        if 'accounting_period_vuid' in data:
            billing.accounting_period_vuid = data['accounting_period_vuid']
        if 'billing_date' in data:
            billing.billing_date = data['billing_date']
        if 'due_date' in data:
            billing.due_date = data['due_date']
        if 'subtotal' in data:
            billing.subtotal = data['subtotal']
        if 'retention_held' in data:
            billing.retention_held = data['retention_held']
        if 'retention_released' in data:
            billing.retention_released = data['retention_released']
        if 'total_amount' in data:
            billing.total_amount = data['total_amount']
        if 'status' in data:
            billing.status = data['status']
        if 'description' in data:
            billing.description = data['description']
        
        # Update line items if provided
        if 'line_items' in data:
            # Delete existing line items
            ProjectBillingLine.query.filter_by(project_billing_vuid=billing_vuid).delete()
            
            # Create new line items
            for line_item_data in data['line_items']:
                line_item = ProjectBillingLine(
                    project_billing_vuid=billing.vuid,
                    cost_code_vuid=line_item_data['cost_code_vuid'],
                    cost_type_vuid=line_item_data['cost_type_vuid'],
                    description=line_item_data.get('description'),
                    quantity=line_item_data.get('quantity', 0),
                    unit_cost=line_item_data.get('unit_cost', 0),
                    total_cost=line_item_data.get('total_cost', 0)
                )
                db.session.add(line_item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Project billing updated successfully',
            'billing': {
                'vuid': billing.vuid,
                'billing_number': billing.billing_number
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@project_billings_bp.route('/project-billings/<billing_vuid>', methods=['DELETE'])
def delete_project_billing(billing_vuid):
    """Delete a project billing"""
    try:
        billing = ProjectBilling.query.get(billing_vuid)
        
        if not billing:
            return jsonify({'error': 'Project billing not found'}), 404
        
        db.session.delete(billing)
        db.session.commit()
        
        return jsonify({'message': 'Project billing deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

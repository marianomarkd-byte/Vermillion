from flask import Blueprint, request, jsonify
from app import db
from app.models import LaborCost, LaborCostLine, Project, AccountingPeriod

labor_costs_bp = Blueprint('labor_costs', __name__)

@labor_costs_bp.route('/labor-costs', methods=['GET'])
def get_labor_costs():
    """Get all labor costs"""
    try:
        project_vuid = request.args.get('project_vuid')
        
        query = LaborCost.query
        if project_vuid:
            query = query.filter_by(project_vuid=project_vuid)
        
        labor_costs = query.all()
        result = []
        
        for labor_cost in labor_costs:
            labor_cost_data = {
                'vuid': labor_cost.vuid,
                'project_vuid': labor_cost.project_vuid,
                'accounting_period_vuid': labor_cost.accounting_period_vuid,
                'labor_cost_number': labor_cost.labor_cost_number,
                'labor_cost_date': labor_cost.labor_cost_date.isoformat() if labor_cost.labor_cost_date else None,
                'total_amount': float(labor_cost.total_amount) if labor_cost.total_amount else 0,
                'status': labor_cost.status,
                'description': labor_cost.description,
                'exported_to_accounting': labor_cost.exported_to_accounting,
                'accounting_export_date': labor_cost.accounting_export_date.isoformat() if labor_cost.accounting_export_date else None,
                'created_at': labor_cost.created_at.isoformat(),
                'updated_at': labor_cost.updated_at.isoformat(),
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
                    } for li in labor_cost.line_items
                ]
            }
            result.append(labor_cost_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@labor_costs_bp.route('/labor-costs/<labor_cost_vuid>', methods=['GET'])
def get_labor_cost(labor_cost_vuid):
    """Get a specific labor cost by VUID"""
    try:
        labor_cost = LaborCost.query.get(labor_cost_vuid)
        
        if not labor_cost:
            return jsonify({'error': 'Labor cost not found'}), 404
        
        labor_cost_data = {
            'vuid': labor_cost.vuid,
            'project_vuid': labor_cost.project_vuid,
            'accounting_period_vuid': labor_cost.accounting_period_vuid,
            'labor_cost_number': labor_cost.labor_cost_number,
            'labor_cost_date': labor_cost.labor_cost_date.isoformat() if labor_cost.labor_cost_date else None,
            'total_amount': float(labor_cost.total_amount) if labor_cost.total_amount else 0,
            'status': labor_cost.status,
            'description': labor_cost.description,
            'exported_to_accounting': labor_cost.exported_to_accounting,
            'accounting_export_date': labor_cost.accounting_export_date.isoformat() if labor_cost.accounting_export_date else None,
            'created_at': labor_cost.created_at.isoformat(),
            'updated_at': labor_cost.updated_at.isoformat(),
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
                } for li in labor_cost.line_items
            ]
        }
        
        return jsonify(labor_cost_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@labor_costs_bp.route('/labor-costs', methods=['POST'])
def create_labor_cost():
    """Create a new labor cost"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['labor_cost_number', 'project_vuid', 'accounting_period_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create the labor cost
        labor_cost = LaborCost(
            labor_cost_number=data['labor_cost_number'],
            project_vuid=data['project_vuid'],
            accounting_period_vuid=data['accounting_period_vuid'],
            labor_cost_date=data.get('labor_cost_date'),
            total_amount=data.get('total_amount', 0),
            status=data.get('status', 'draft'),
            description=data.get('description')
        )
        
        db.session.add(labor_cost)
        db.session.flush()  # Get the labor cost ID
        
        # Create line items
        line_items_data = data.get('line_items', [])
        for line_item_data in line_items_data:
            line_item = LaborCostLine(
                labor_cost_vuid=labor_cost.vuid,
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
            'message': 'Labor cost created successfully',
            'labor_cost': {
                'vuid': labor_cost.vuid,
                'labor_cost_number': labor_cost.labor_cost_number
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@labor_costs_bp.route('/labor-costs/<labor_cost_vuid>', methods=['PUT'])
def update_labor_cost(labor_cost_vuid):
    """Update a labor cost"""
    try:
        labor_cost = LaborCost.query.get(labor_cost_vuid)
        
        if not labor_cost:
            return jsonify({'error': 'Labor cost not found'}), 404
        
        data = request.get_json()
        
        # Update labor cost fields
        if 'labor_cost_number' in data:
            labor_cost.labor_cost_number = data['labor_cost_number']
        if 'project_vuid' in data:
            labor_cost.project_vuid = data['project_vuid']
        if 'accounting_period_vuid' in data:
            labor_cost.accounting_period_vuid = data['accounting_period_vuid']
        if 'labor_cost_date' in data:
            labor_cost.labor_cost_date = data['labor_cost_date']
        if 'total_amount' in data:
            labor_cost.total_amount = data['total_amount']
        if 'status' in data:
            labor_cost.status = data['status']
        if 'description' in data:
            labor_cost.description = data['description']
        
        # Update line items if provided
        if 'line_items' in data:
            # Delete existing line items
            LaborCostLine.query.filter_by(labor_cost_vuid=labor_cost_vuid).delete()
            
            # Create new line items
            for line_item_data in data['line_items']:
                line_item = LaborCostLine(
                    labor_cost_vuid=labor_cost.vuid,
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
            'message': 'Labor cost updated successfully',
            'labor_cost': {
                'vuid': labor_cost.vuid,
                'labor_cost_number': labor_cost.labor_cost_number
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@labor_costs_bp.route('/labor-costs/<labor_cost_vuid>', methods=['DELETE'])
def delete_labor_cost(labor_cost_vuid):
    """Delete a labor cost"""
    try:
        labor_cost = LaborCost.query.get(labor_cost_vuid)
        
        if not labor_cost:
            return jsonify({'error': 'Labor cost not found'}), 404
        
        db.session.delete(labor_cost)
        db.session.commit()
        
        return jsonify({'message': 'Labor cost deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

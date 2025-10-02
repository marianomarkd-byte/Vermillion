from flask import Blueprint, request, jsonify
from app import db
from app.models import ChangeOrder, ChangeOrderLine, Project, CostCode, CostType

change_orders_bp = Blueprint('change_orders', __name__)

@change_orders_bp.route('/change-orders', methods=['GET'])
def get_change_orders():
    """Get all change orders"""
    try:
        project_vuid = request.args.get('project_vuid')
        
        query = ChangeOrder.query
        if project_vuid:
            query = query.filter_by(project_vuid=project_vuid)
        
        change_orders = query.all()
        result = []
        
        for change_order in change_orders:
            change_order_data = {
                'vuid': change_order.vuid,
                'project_vuid': change_order.project_vuid,
                'change_order_number': change_order.change_order_number,
                'change_order_name': change_order.change_order_name,
                'change_order_amount': float(change_order.change_order_amount) if change_order.change_order_amount else 0,
                'change_order_date': change_order.change_order_date.isoformat() if change_order.change_order_date else None,
                'status': change_order.status,
                'created_at': change_order.created_at.isoformat(),
                'updated_at': change_order.updated_at.isoformat(),
                'change_order_lines': [
                    {
                        'vuid': li.vuid,
                        'cost_code_vuid': li.cost_code_vuid,
                        'cost_type_vuid': li.cost_type_vuid,
                        'description': li.description,
                        'quantity': float(li.quantity),
                        'unit_cost': float(li.unit_cost),
                        'total_cost': float(li.total_cost),
                        'created_at': li.created_at.isoformat(),
                        'updated_at': li.updated_at.isoformat()
                    } for li in change_order.change_order_lines
                ]
            }
            result.append(change_order_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@change_orders_bp.route('/change-orders/<change_order_vuid>', methods=['GET'])
def get_change_order(change_order_vuid):
    """Get a specific change order by VUID"""
    try:
        change_order = ChangeOrder.query.get(change_order_vuid)
        
        if not change_order:
            return jsonify({'error': 'Change order not found'}), 404
        
        change_order_data = {
            'vuid': change_order.vuid,
            'project_vuid': change_order.project_vuid,
            'change_order_number': change_order.change_order_number,
            'change_order_name': change_order.change_order_name,
            'change_order_amount': float(change_order.change_order_amount) if change_order.change_order_amount else 0,
            'change_order_date': change_order.change_order_date.isoformat() if change_order.change_order_date else None,
            'status': change_order.status,
            'created_at': change_order.created_at.isoformat(),
            'updated_at': change_order.updated_at.isoformat(),
            'change_order_lines': [
                {
                    'vuid': li.vuid,
                    'cost_code_vuid': li.cost_code_vuid,
                    'cost_type_vuid': li.cost_type_vuid,
                    'description': li.description,
                    'quantity': float(li.quantity),
                    'unit_cost': float(li.unit_cost),
                    'total_cost': float(li.total_cost),
                    'created_at': li.created_at.isoformat(),
                    'updated_at': li.updated_at.isoformat()
                } for li in change_order.change_order_lines
            ]
        }
        
        return jsonify(change_order_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@change_orders_bp.route('/change-orders', methods=['POST'])
def create_change_order():
    """Create a new change order"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['change_order_number', 'change_order_name', 'change_order_amount', 'project_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create the change order
        change_order = ChangeOrder(
            change_order_number=data['change_order_number'],
            change_order_name=data['change_order_name'],
            change_order_amount=data['change_order_amount'],
            project_vuid=data['project_vuid'],
            change_order_date=data.get('change_order_date'),
            status=data.get('status', 'pending')
        )
        
        db.session.add(change_order)
        db.session.flush()  # Get the change order ID
        
        # Create change order lines
        change_order_lines_data = data.get('change_order_lines', [])
        for change_order_line_data in change_order_lines_data:
            change_order_line = ChangeOrderLine(
                change_order_vuid=change_order.vuid,
                cost_code_vuid=change_order_line_data['cost_code_vuid'],
                cost_type_vuid=change_order_line_data['cost_type_vuid'],
                description=change_order_line_data.get('description'),
                quantity=change_order_line_data.get('quantity', 0),
                unit_cost=change_order_line_data.get('unit_cost', 0),
                total_cost=change_order_line_data.get('total_cost', 0)
            )
            db.session.add(change_order_line)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Change order created successfully',
            'change_order': {
                'vuid': change_order.vuid,
                'change_order_number': change_order.change_order_number,
                'change_order_name': change_order.change_order_name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@change_orders_bp.route('/change-orders/<change_order_vuid>', methods=['PUT'])
def update_change_order(change_order_vuid):
    """Update a change order"""
    try:
        change_order = ChangeOrder.query.get(change_order_vuid)
        
        if not change_order:
            return jsonify({'error': 'Change order not found'}), 404
        
        data = request.get_json()
        
        # Update change order fields
        if 'change_order_number' in data:
            change_order.change_order_number = data['change_order_number']
        if 'change_order_name' in data:
            change_order.change_order_name = data['change_order_name']
        if 'change_order_amount' in data:
            change_order.change_order_amount = data['change_order_amount']
        if 'project_vuid' in data:
            change_order.project_vuid = data['project_vuid']
        if 'change_order_date' in data:
            change_order.change_order_date = data['change_order_date']
        if 'status' in data:
            change_order.status = data['status']
        
        # Update change order lines if provided
        if 'change_order_lines' in data:
            # Delete existing change order lines
            ChangeOrderLine.query.filter_by(change_order_vuid=change_order_vuid).delete()
            
            # Create new change order lines
            for change_order_line_data in data['change_order_lines']:
                change_order_line = ChangeOrderLine(
                    change_order_vuid=change_order.vuid,
                    cost_code_vuid=change_order_line_data['cost_code_vuid'],
                    cost_type_vuid=change_order_line_data['cost_type_vuid'],
                    description=change_order_line_data.get('description'),
                    quantity=change_order_line_data.get('quantity', 0),
                    unit_cost=change_order_line_data.get('unit_cost', 0),
                    total_cost=change_order_line_data.get('total_cost', 0)
                )
                db.session.add(change_order_line)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Change order updated successfully',
            'change_order': {
                'vuid': change_order.vuid,
                'change_order_number': change_order.change_order_number,
                'change_order_name': change_order.change_order_name
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@change_orders_bp.route('/change-orders/<change_order_vuid>', methods=['DELETE'])
def delete_change_order(change_order_vuid):
    """Delete a change order"""
    try:
        change_order = ChangeOrder.query.get(change_order_vuid)
        
        if not change_order:
            return jsonify({'error': 'Change order not found'}), 404
        
        db.session.delete(change_order)
        db.session.commit()
        
        return jsonify({'message': 'Change order deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

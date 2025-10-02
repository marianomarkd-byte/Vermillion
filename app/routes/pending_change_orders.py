from flask import Blueprint, request, jsonify
from app import db
from app.models import PendingChangeOrder, PendingChangeOrderLine, Project, CostCode, CostType

pending_change_orders_bp = Blueprint('pending_change_orders', __name__)

@pending_change_orders_bp.route('/pending-change-orders', methods=['GET'])
def get_pending_change_orders():
    """Get all pending change orders"""
    try:
        project_vuid = request.args.get('project_vuid')
        
        query = PendingChangeOrder.query
        if project_vuid:
            query = query.filter_by(project_vuid=project_vuid)
        
        pending_change_orders = query.all()
        result = []
        
        for pending_change_order in pending_change_orders:
            pending_change_order_data = {
                'vuid': pending_change_order.vuid,
                'project_vuid': pending_change_order.project_vuid,
                'pending_change_order_number': pending_change_order.pending_change_order_number,
                'pending_change_order_name': pending_change_order.pending_change_order_name,
                'pending_change_order_amount': float(pending_change_order.pending_change_order_amount) if pending_change_order.pending_change_order_amount else 0,
                'pending_change_order_date': pending_change_order.pending_change_order_date.isoformat() if pending_change_order.pending_change_order_date else None,
                'status': pending_change_order.status,
                'created_at': pending_change_order.created_at.isoformat(),
                'updated_at': pending_change_order.updated_at.isoformat(),
                'pending_change_order_lines': [
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
                    } for li in pending_change_order.pending_change_order_lines
                ]
            }
            result.append(pending_change_order_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pending_change_orders_bp.route('/pending-change-orders/<pending_change_order_vuid>', methods=['GET'])
def get_pending_change_order(pending_change_order_vuid):
    """Get a specific pending change order by VUID"""
    try:
        pending_change_order = PendingChangeOrder.query.get(pending_change_order_vuid)
        
        if not pending_change_order:
            return jsonify({'error': 'Pending change order not found'}), 404
        
        pending_change_order_data = {
            'vuid': pending_change_order.vuid,
            'project_vuid': pending_change_order.project_vuid,
            'pending_change_order_number': pending_change_order.pending_change_order_number,
            'pending_change_order_name': pending_change_order.pending_change_order_name,
            'pending_change_order_amount': float(pending_change_order.pending_change_order_amount) if pending_change_order.pending_change_order_amount else 0,
            'pending_change_order_date': pending_change_order.pending_change_order_date.isoformat() if pending_change_order.pending_change_order_date else None,
            'status': pending_change_order.status,
            'created_at': pending_change_order.created_at.isoformat(),
            'updated_at': pending_change_order.updated_at.isoformat(),
            'pending_change_order_lines': [
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
                } for li in pending_change_order.pending_change_order_lines
            ]
        }
        
        return jsonify(pending_change_order_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pending_change_orders_bp.route('/pending-change-orders', methods=['POST'])
def create_pending_change_order():
    """Create a new pending change order"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['pending_change_order_number', 'pending_change_order_name', 'pending_change_order_amount', 'project_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create the pending change order
        pending_change_order = PendingChangeOrder(
            pending_change_order_number=data['pending_change_order_number'],
            pending_change_order_name=data['pending_change_order_name'],
            pending_change_order_amount=data['pending_change_order_amount'],
            project_vuid=data['project_vuid'],
            pending_change_order_date=data.get('pending_change_order_date'),
            status=data.get('status', 'pending')
        )
        
        db.session.add(pending_change_order)
        db.session.flush()  # Get the pending change order ID
        
        # Create pending change order lines
        pending_change_order_lines_data = data.get('pending_change_order_lines', [])
        for pending_change_order_line_data in pending_change_order_lines_data:
            pending_change_order_line = PendingChangeOrderLine(
                pending_change_order_vuid=pending_change_order.vuid,
                cost_code_vuid=pending_change_order_line_data['cost_code_vuid'],
                cost_type_vuid=pending_change_order_line_data['cost_type_vuid'],
                description=pending_change_order_line_data.get('description'),
                quantity=pending_change_order_line_data.get('quantity', 0),
                unit_cost=pending_change_order_line_data.get('unit_cost', 0),
                total_cost=pending_change_order_line_data.get('total_cost', 0)
            )
            db.session.add(pending_change_order_line)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Pending change order created successfully',
            'pending_change_order': {
                'vuid': pending_change_order.vuid,
                'pending_change_order_number': pending_change_order.pending_change_order_number,
                'pending_change_order_name': pending_change_order.pending_change_order_name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pending_change_orders_bp.route('/pending-change-orders/<pending_change_order_vuid>', methods=['PUT'])
def update_pending_change_order(pending_change_order_vuid):
    """Update a pending change order"""
    try:
        pending_change_order = PendingChangeOrder.query.get(pending_change_order_vuid)
        
        if not pending_change_order:
            return jsonify({'error': 'Pending change order not found'}), 404
        
        data = request.get_json()
        
        # Update pending change order fields
        if 'pending_change_order_number' in data:
            pending_change_order.pending_change_order_number = data['pending_change_order_number']
        if 'pending_change_order_name' in data:
            pending_change_order.pending_change_order_name = data['pending_change_order_name']
        if 'pending_change_order_amount' in data:
            pending_change_order.pending_change_order_amount = data['pending_change_order_amount']
        if 'project_vuid' in data:
            pending_change_order.project_vuid = data['project_vuid']
        if 'pending_change_order_date' in data:
            pending_change_order.pending_change_order_date = data['pending_change_order_date']
        if 'status' in data:
            pending_change_order.status = data['status']
        
        # Update pending change order lines if provided
        if 'pending_change_order_lines' in data:
            # Delete existing pending change order lines
            PendingChangeOrderLine.query.filter_by(pending_change_order_vuid=pending_change_order_vuid).delete()
            
            # Create new pending change order lines
            for pending_change_order_line_data in data['pending_change_order_lines']:
                pending_change_order_line = PendingChangeOrderLine(
                    pending_change_order_vuid=pending_change_order.vuid,
                    cost_code_vuid=pending_change_order_line_data['cost_code_vuid'],
                    cost_type_vuid=pending_change_order_line_data['cost_type_vuid'],
                    description=pending_change_order_line_data.get('description'),
                    quantity=pending_change_order_line_data.get('quantity', 0),
                    unit_cost=pending_change_order_line_data.get('unit_cost', 0),
                    total_cost=pending_change_order_line_data.get('total_cost', 0)
                )
                db.session.add(pending_change_order_line)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Pending change order updated successfully',
            'pending_change_order': {
                'vuid': pending_change_order.vuid,
                'pending_change_order_number': pending_change_order.pending_change_order_number,
                'pending_change_order_name': pending_change_order.pending_change_order_name
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pending_change_orders_bp.route('/pending-change-orders/<pending_change_order_vuid>', methods=['DELETE'])
def delete_pending_change_order(pending_change_order_vuid):
    """Delete a pending change order"""
    try:
        pending_change_order = PendingChangeOrder.query.get(pending_change_order_vuid)
        
        if not pending_change_order:
            return jsonify({'error': 'Pending change order not found'}), 404
        
        db.session.delete(pending_change_order)
        db.session.commit()
        
        return jsonify({'message': 'Pending change order deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

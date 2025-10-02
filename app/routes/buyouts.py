from flask import Blueprint, request, jsonify
from app import db
from app.models import Buyout, BuyoutLine, Project, CostCode, CostType

buyouts_bp = Blueprint('buyouts', __name__)

@buyouts_bp.route('/buyouts', methods=['GET'])
def get_buyouts():
    """Get all buyouts"""
    try:
        project_vuid = request.args.get('project_vuid')
        
        query = Buyout.query
        if project_vuid:
            query = query.filter_by(project_vuid=project_vuid)
        
        buyouts = query.all()
        result = []
        
        for buyout in buyouts:
            buyout_data = {
                'vuid': buyout.vuid,
                'project_vuid': buyout.project_vuid,
                'buyout_number': buyout.buyout_number,
                'buyout_name': buyout.buyout_name,
                'buyout_amount': float(buyout.buyout_amount) if buyout.buyout_amount else 0,
                'buyout_date': buyout.buyout_date.isoformat() if buyout.buyout_date else None,
                'status': buyout.status,
                'created_at': buyout.created_at.isoformat(),
                'updated_at': buyout.updated_at.isoformat(),
                'buyout_lines': [
                    {
                        'vuid': li.vuid,
                        'cost_code_vuid': li.cost_code_vuid,
                        'cost_type_vuid': li.cost_type_vuid,
                        'description': li.description,
                        'quantity': float(li.quantity),
                        'unit_cost': float(li.unit_cost),
                        'total_cost': float(li.total_cost),
                        'eac_amount': float(li.eac_amount) if li.eac_amount else 0,
                        'created_at': li.created_at.isoformat(),
                        'updated_at': li.updated_at.isoformat()
                    } for li in buyout.buyout_lines
                ]
            }
            result.append(buyout_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@buyouts_bp.route('/buyouts/<buyout_vuid>', methods=['GET'])
def get_buyout(buyout_vuid):
    """Get a specific buyout by VUID"""
    try:
        buyout = Buyout.query.get(buyout_vuid)
        
        if not buyout:
            return jsonify({'error': 'Buyout not found'}), 404
        
        buyout_data = {
            'vuid': buyout.vuid,
            'project_vuid': buyout.project_vuid,
            'buyout_number': buyout.buyout_number,
            'buyout_name': buyout.buyout_name,
            'buyout_amount': float(buyout.buyout_amount) if buyout.buyout_amount else 0,
            'buyout_date': buyout.buyout_date.isoformat() if buyout.buyout_date else None,
            'status': buyout.status,
            'created_at': buyout.created_at.isoformat(),
            'updated_at': buyout.updated_at.isoformat(),
            'buyout_lines': [
                {
                    'vuid': li.vuid,
                    'cost_code_vuid': li.cost_code_vuid,
                    'cost_type_vuid': li.cost_type_vuid,
                    'description': li.description,
                    'quantity': float(li.quantity),
                    'unit_cost': float(li.unit_cost),
                    'total_cost': float(li.total_cost),
                    'eac_amount': float(li.eac_amount) if li.eac_amount else 0,
                    'created_at': li.created_at.isoformat(),
                    'updated_at': li.updated_at.isoformat()
                } for li in buyout.buyout_lines
            ]
        }
        
        return jsonify(buyout_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@buyouts_bp.route('/buyouts', methods=['POST'])
def create_buyout():
    """Create a new buyout"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['buyout_number', 'buyout_name', 'buyout_amount', 'project_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create the buyout
        buyout = Buyout(
            buyout_number=data['buyout_number'],
            buyout_name=data['buyout_name'],
            buyout_amount=data['buyout_amount'],
            project_vuid=data['project_vuid'],
            buyout_date=data.get('buyout_date'),
            status=data.get('status', 'active')
        )
        
        db.session.add(buyout)
        db.session.flush()  # Get the buyout ID
        
        # Create buyout lines
        buyout_lines_data = data.get('buyout_lines', [])
        for buyout_line_data in buyout_lines_data:
            buyout_line = BuyoutLine(
                buyout_vuid=buyout.vuid,
                cost_code_vuid=buyout_line_data['cost_code_vuid'],
                cost_type_vuid=buyout_line_data['cost_type_vuid'],
                description=buyout_line_data.get('description'),
                quantity=buyout_line_data.get('quantity', 0),
                unit_cost=buyout_line_data.get('unit_cost', 0),
                total_cost=buyout_line_data.get('total_cost', 0),
                eac_amount=buyout_line_data.get('eac_amount', 0)
            )
            db.session.add(buyout_line)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Buyout created successfully',
            'buyout': {
                'vuid': buyout.vuid,
                'buyout_number': buyout.buyout_number,
                'buyout_name': buyout.buyout_name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@buyouts_bp.route('/buyouts/<buyout_vuid>', methods=['PUT'])
def update_buyout(buyout_vuid):
    """Update a buyout"""
    try:
        buyout = Buyout.query.get(buyout_vuid)
        
        if not buyout:
            return jsonify({'error': 'Buyout not found'}), 404
        
        data = request.get_json()
        
        # Update buyout fields
        if 'buyout_number' in data:
            buyout.buyout_number = data['buyout_number']
        if 'buyout_name' in data:
            buyout.buyout_name = data['buyout_name']
        if 'buyout_amount' in data:
            buyout.buyout_amount = data['buyout_amount']
        if 'project_vuid' in data:
            buyout.project_vuid = data['project_vuid']
        if 'buyout_date' in data:
            buyout.buyout_date = data['buyout_date']
        if 'status' in data:
            buyout.status = data['status']
        
        # Update buyout lines if provided
        if 'buyout_lines' in data:
            # Delete existing buyout lines
            BuyoutLine.query.filter_by(buyout_vuid=buyout_vuid).delete()
            
            # Create new buyout lines
            for buyout_line_data in data['buyout_lines']:
                buyout_line = BuyoutLine(
                    buyout_vuid=buyout.vuid,
                    cost_code_vuid=buyout_line_data['cost_code_vuid'],
                    cost_type_vuid=buyout_line_data['cost_type_vuid'],
                    description=buyout_line_data.get('description'),
                    quantity=buyout_line_data.get('quantity', 0),
                    unit_cost=buyout_line_data.get('unit_cost', 0),
                    total_cost=buyout_line_data.get('total_cost', 0),
                    eac_amount=buyout_line_data.get('eac_amount', 0)
                )
                db.session.add(buyout_line)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Buyout updated successfully',
            'buyout': {
                'vuid': buyout.vuid,
                'buyout_number': buyout.buyout_number,
                'buyout_name': buyout.buyout_name
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@buyouts_bp.route('/buyouts/<buyout_vuid>', methods=['DELETE'])
def delete_buyout(buyout_vuid):
    """Delete a buyout"""
    try:
        buyout = Buyout.query.get(buyout_vuid)
        
        if not buyout:
            return jsonify({'error': 'Buyout not found'}), 404
        
        db.session.delete(buyout)
        db.session.commit()
        
        return jsonify({'message': 'Buyout deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

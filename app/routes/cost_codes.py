from flask import Blueprint, request, jsonify
from app import db
from app.models import CostCode

cost_codes_bp = Blueprint('cost_codes', __name__)

@cost_codes_bp.route('/cost-codes', methods=['GET'])
def get_cost_codes():
    """Get all cost codes"""
    try:
        cost_codes = CostCode.query.all()
        result = []
        
        for cost_code in cost_codes:
            cost_code_data = {
                'vuid': cost_code.vuid,
                'code': cost_code.code,
                'description': cost_code.description,
                'created_at': cost_code.created_at.isoformat(),
                'updated_at': cost_code.updated_at.isoformat()
            }
            result.append(cost_code_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cost_codes_bp.route('/cost-codes/<cost_code_vuid>', methods=['GET'])
def get_cost_code(cost_code_vuid):
    """Get a specific cost code by VUID"""
    try:
        cost_code = CostCode.query.get(cost_code_vuid)
        
        if not cost_code:
            return jsonify({'error': 'Cost code not found'}), 404
        
        cost_code_data = {
            'vuid': cost_code.vuid,
            'code': cost_code.code,
            'description': cost_code.description,
            'created_at': cost_code.created_at.isoformat(),
            'updated_at': cost_code.updated_at.isoformat()
        }
        
        return jsonify(cost_code_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cost_codes_bp.route('/cost-codes', methods=['POST'])
def create_cost_code():
    """Create a new cost code"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['code', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if cost code already exists
        existing_cost_code = CostCode.query.filter_by(code=data['code']).first()
        if existing_cost_code:
            return jsonify({'error': 'Cost code already exists'}), 400
        
        cost_code = CostCode(
            code=data['code'],
            description=data['description']
        )
        
        db.session.add(cost_code)
        db.session.commit()
        
        return jsonify({
            'message': 'Cost code created successfully',
            'cost_code': {
                'vuid': cost_code.vuid,
                'code': cost_code.code,
                'description': cost_code.description
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cost_codes_bp.route('/cost-codes/<cost_code_vuid>', methods=['PUT'])
def update_cost_code(cost_code_vuid):
    """Update a cost code"""
    try:
        cost_code = CostCode.query.get(cost_code_vuid)
        
        if not cost_code:
            return jsonify({'error': 'Cost code not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'code' in data:
            # Check if new code already exists
            existing_cost_code = CostCode.query.filter_by(code=data['code']).first()
            if existing_cost_code and existing_cost_code.vuid != cost_code_vuid:
                return jsonify({'error': 'Cost code already exists'}), 400
            cost_code.code = data['code']
        if 'description' in data:
            cost_code.description = data['description']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cost code updated successfully',
            'cost_code': {
                'vuid': cost_code.vuid,
                'code': cost_code.code,
                'description': cost_code.description
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cost_codes_bp.route('/cost-codes/<cost_code_vuid>', methods=['DELETE'])
def delete_cost_code(cost_code_vuid):
    """Delete a cost code"""
    try:
        cost_code = CostCode.query.get(cost_code_vuid)
        
        if not cost_code:
            return jsonify({'error': 'Cost code not found'}), 404
        
        db.session.delete(cost_code)
        db.session.commit()
        
        return jsonify({'message': 'Cost code deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

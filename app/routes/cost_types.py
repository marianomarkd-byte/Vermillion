from flask import Blueprint, request, jsonify
from app import db
from app.models import CostType

cost_types_bp = Blueprint('cost_types', __name__)

@cost_types_bp.route('/cost-types', methods=['GET'])
def get_cost_types():
    """Get all cost types"""
    try:
        cost_types = CostType.query.all()
        result = []
        
        for cost_type in cost_types:
            cost_type_data = {
                'vuid': cost_type.vuid,
                'name': cost_type.name,
                'description': cost_type.description,
                'created_at': cost_type.created_at.isoformat(),
                'updated_at': cost_type.updated_at.isoformat()
            }
            result.append(cost_type_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cost_types_bp.route('/cost-types/<cost_type_vuid>', methods=['GET'])
def get_cost_type(cost_type_vuid):
    """Get a specific cost type by VUID"""
    try:
        cost_type = CostType.query.get(cost_type_vuid)
        
        if not cost_type:
            return jsonify({'error': 'Cost type not found'}), 404
        
        cost_type_data = {
            'vuid': cost_type.vuid,
            'name': cost_type.name,
            'description': cost_type.description,
            'created_at': cost_type.created_at.isoformat(),
            'updated_at': cost_type.updated_at.isoformat()
        }
        
        return jsonify(cost_type_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cost_types_bp.route('/cost-types', methods=['POST'])
def create_cost_type():
    """Create a new cost type"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if cost type already exists
        existing_cost_type = CostType.query.filter_by(name=data['name']).first()
        if existing_cost_type:
            return jsonify({'error': 'Cost type already exists'}), 400
        
        cost_type = CostType(
            name=data['name'],
            description=data.get('description')
        )
        
        db.session.add(cost_type)
        db.session.commit()
        
        return jsonify({
            'message': 'Cost type created successfully',
            'cost_type': {
                'vuid': cost_type.vuid,
                'name': cost_type.name,
                'description': cost_type.description
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cost_types_bp.route('/cost-types/<cost_type_vuid>', methods=['PUT'])
def update_cost_type(cost_type_vuid):
    """Update a cost type"""
    try:
        cost_type = CostType.query.get(cost_type_vuid)
        
        if not cost_type:
            return jsonify({'error': 'Cost type not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            # Check if new name already exists
            existing_cost_type = CostType.query.filter_by(name=data['name']).first()
            if existing_cost_type and existing_cost_type.vuid != cost_type_vuid:
                return jsonify({'error': 'Cost type already exists'}), 400
            cost_type.name = data['name']
        if 'description' in data:
            cost_type.description = data['description']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cost type updated successfully',
            'cost_type': {
                'vuid': cost_type.vuid,
                'name': cost_type.name,
                'description': cost_type.description
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cost_types_bp.route('/cost-types/<cost_type_vuid>', methods=['DELETE'])
def delete_cost_type(cost_type_vuid):
    """Delete a cost type"""
    try:
        cost_type = CostType.query.get(cost_type_vuid)
        
        if not cost_type:
            return jsonify({'error': 'Cost type not found'}), 404
        
        db.session.delete(cost_type)
        db.session.commit()
        
        return jsonify({'message': 'Cost type deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

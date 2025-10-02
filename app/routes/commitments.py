from flask import Blueprint, request, jsonify
from app import db
from app.models import Commitment, CommitmentLine, Project, Vendor, CostCode, CostType

commitments_bp = Blueprint('commitments', __name__)

@commitments_bp.route('/commitments', methods=['GET'])
def get_commitments():
    """Get all commitments"""
    try:
        project_vuid = request.args.get('project_vuid')
        
        query = Commitment.query
        if project_vuid:
            query = query.filter_by(project_vuid=project_vuid)
        
        commitments = query.all()
        result = []
        
        for commitment in commitments:
            commitment_data = {
                'vuid': commitment.vuid,
                'project_vuid': commitment.project_vuid,
                'vendor_vuid': commitment.vendor_vuid,
                'commitment_number': commitment.commitment_number,
                'commitment_name': commitment.commitment_name,
                'commitment_amount': float(commitment.commitment_amount) if commitment.commitment_amount else 0,
                'commitment_date': commitment.commitment_date.isoformat() if commitment.commitment_date else None,
                'status': commitment.status,
                'created_at': commitment.created_at.isoformat(),
                'updated_at': commitment.updated_at.isoformat(),
                'line_items': [
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
                    } for li in commitment.line_items
                ]
            }
            result.append(commitment_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@commitments_bp.route('/commitments/<commitment_vuid>', methods=['GET'])
def get_commitment(commitment_vuid):
    """Get a specific commitment by VUID"""
    try:
        commitment = Commitment.query.get(commitment_vuid)
        
        if not commitment:
            return jsonify({'error': 'Commitment not found'}), 404
        
        commitment_data = {
            'vuid': commitment.vuid,
            'project_vuid': commitment.project_vuid,
            'vendor_vuid': commitment.vendor_vuid,
            'commitment_number': commitment.commitment_number,
            'commitment_name': commitment.commitment_name,
            'commitment_amount': float(commitment.commitment_amount) if commitment.commitment_amount else 0,
            'commitment_date': commitment.commitment_date.isoformat() if commitment.commitment_date else None,
            'status': commitment.status,
            'created_at': commitment.created_at.isoformat(),
            'updated_at': commitment.updated_at.isoformat(),
            'line_items': [
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
                } for li in commitment.line_items
            ]
        }
        
        return jsonify(commitment_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@commitments_bp.route('/commitments', methods=['POST'])
def create_commitment():
    """Create a new commitment"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['commitment_number', 'commitment_name', 'project_vuid', 'vendor_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create the commitment
        commitment = Commitment(
            commitment_number=data['commitment_number'],
            commitment_name=data['commitment_name'],
            project_vuid=data['project_vuid'],
            vendor_vuid=data['vendor_vuid'],
            commitment_amount=data.get('commitment_amount', 0),
            commitment_date=data.get('commitment_date'),
            status=data.get('status', 'active')
        )
        
        db.session.add(commitment)
        db.session.flush()  # Get the commitment ID
        
        # Create line items
        line_items_data = data.get('line_items', [])
        for line_item_data in line_items_data:
            line_item = CommitmentLine(
                commitment_vuid=commitment.vuid,
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
            'message': 'Commitment created successfully',
            'commitment': {
                'vuid': commitment.vuid,
                'commitment_number': commitment.commitment_number,
                'commitment_name': commitment.commitment_name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@commitments_bp.route('/commitments/<commitment_vuid>', methods=['PUT'])
def update_commitment(commitment_vuid):
    """Update a commitment"""
    try:
        commitment = Commitment.query.get(commitment_vuid)
        
        if not commitment:
            return jsonify({'error': 'Commitment not found'}), 404
        
        data = request.get_json()
        
        # Update commitment fields
        if 'commitment_number' in data:
            commitment.commitment_number = data['commitment_number']
        if 'commitment_name' in data:
            commitment.commitment_name = data['commitment_name']
        if 'project_vuid' in data:
            commitment.project_vuid = data['project_vuid']
        if 'vendor_vuid' in data:
            commitment.vendor_vuid = data['vendor_vuid']
        if 'commitment_amount' in data:
            commitment.commitment_amount = data['commitment_amount']
        if 'commitment_date' in data:
            commitment.commitment_date = data['commitment_date']
        if 'status' in data:
            commitment.status = data['status']
        
        # Update line items if provided
        if 'line_items' in data:
            # Delete existing line items
            CommitmentLine.query.filter_by(commitment_vuid=commitment_vuid).delete()
            
            # Create new line items
            for line_item_data in data['line_items']:
                line_item = CommitmentLine(
                    commitment_vuid=commitment.vuid,
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
            'message': 'Commitment updated successfully',
            'commitment': {
                'vuid': commitment.vuid,
                'commitment_number': commitment.commitment_number,
                'commitment_name': commitment.commitment_name
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@commitments_bp.route('/commitments/<commitment_vuid>', methods=['DELETE'])
def delete_commitment(commitment_vuid):
    """Delete a commitment"""
    try:
        commitment = Commitment.query.get(commitment_vuid)
        
        if not commitment:
            return jsonify({'error': 'Commitment not found'}), 404
        
        db.session.delete(commitment)
        db.session.commit()
        
        return jsonify({'message': 'Commitment deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

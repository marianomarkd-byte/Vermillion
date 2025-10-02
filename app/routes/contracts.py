from flask import Blueprint, request, jsonify
from app import db
from app.models import Contract, Project, Budget

contracts_bp = Blueprint('contracts', __name__)

@contracts_bp.route('/contracts', methods=['GET'])
def get_contracts():
    """Get all contracts"""
    try:
        project_vuid = request.args.get('project_vuid')
        
        query = Contract.query
        if project_vuid:
            query = query.filter_by(project_vuid=project_vuid)
        
        contracts = query.all()
        result = []
        
        for contract in contracts:
            contract_data = {
                'vuid': contract.vuid,
                'project_vuid': contract.project_vuid,
                'budget_vuid': contract.budget_vuid,
                'contract_number': contract.contract_number,
                'contract_name': contract.contract_name,
                'contract_amount': float(contract.contract_amount) if contract.contract_amount else 0,
                'start_date': contract.start_date.isoformat() if contract.start_date else None,
                'end_date': contract.end_date.isoformat() if contract.end_date else None,
                'status': contract.status,
                'created_at': contract.created_at.isoformat(),
                'updated_at': contract.updated_at.isoformat()
            }
            result.append(contract_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contracts_bp.route('/contracts/<contract_vuid>', methods=['GET'])
def get_contract(contract_vuid):
    """Get a specific contract by VUID"""
    try:
        contract = Contract.query.get(contract_vuid)
        
        if not contract:
            return jsonify({'error': 'Contract not found'}), 404
        
        contract_data = {
            'vuid': contract.vuid,
            'project_vuid': contract.project_vuid,
            'budget_vuid': contract.budget_vuid,
            'contract_number': contract.contract_number,
            'contract_name': contract.contract_name,
            'contract_amount': float(contract.contract_amount) if contract.contract_amount else 0,
            'start_date': contract.start_date.isoformat() if contract.start_date else None,
            'end_date': contract.end_date.isoformat() if contract.end_date else None,
            'status': contract.status,
            'created_at': contract.created_at.isoformat(),
            'updated_at': contract.updated_at.isoformat()
        }
        
        return jsonify(contract_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contracts_bp.route('/contracts', methods=['POST'])
def create_contract():
    """Create a new contract"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['contract_number', 'contract_name', 'contract_amount', 'project_vuid', 'budget_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create the contract
        contract = Contract(
            contract_number=data['contract_number'],
            contract_name=data['contract_name'],
            contract_amount=data['contract_amount'],
            project_vuid=data['project_vuid'],
            budget_vuid=data['budget_vuid'],
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            status=data.get('status', 'active')
        )
        
        db.session.add(contract)
        db.session.commit()
        
        return jsonify({
            'message': 'Contract created successfully',
            'contract': {
                'vuid': contract.vuid,
                'contract_number': contract.contract_number,
                'contract_name': contract.contract_name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contracts_bp.route('/contracts/<contract_vuid>', methods=['PUT'])
def update_contract(contract_vuid):
    """Update a contract"""
    try:
        contract = Contract.query.get(contract_vuid)
        
        if not contract:
            return jsonify({'error': 'Contract not found'}), 404
        
        data = request.get_json()
        
        # Update contract fields
        if 'contract_number' in data:
            contract.contract_number = data['contract_number']
        if 'contract_name' in data:
            contract.contract_name = data['contract_name']
        if 'contract_amount' in data:
            contract.contract_amount = data['contract_amount']
        if 'project_vuid' in data:
            contract.project_vuid = data['project_vuid']
        if 'budget_vuid' in data:
            contract.budget_vuid = data['budget_vuid']
        if 'start_date' in data:
            contract.start_date = data['start_date']
        if 'end_date' in data:
            contract.end_date = data['end_date']
        if 'status' in data:
            contract.status = data['status']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Contract updated successfully',
            'contract': {
                'vuid': contract.vuid,
                'contract_number': contract.contract_number,
                'contract_name': contract.contract_name
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contracts_bp.route('/contracts/<contract_vuid>', methods=['DELETE'])
def delete_contract(contract_vuid):
    """Delete a contract"""
    try:
        contract = Contract.query.get(contract_vuid)
        
        if not contract:
            return jsonify({'error': 'Contract not found'}), 404
        
        db.session.delete(contract)
        db.session.commit()
        
        return jsonify({'message': 'Contract deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

from flask import Blueprint, request, jsonify
from app import db
from app.models import AccountingPeriod

accounting_periods_bp = Blueprint('accounting_periods', __name__)

@accounting_periods_bp.route('/accounting-periods', methods=['GET'])
def get_accounting_periods():
    """Get all accounting periods"""
    try:
        periods = AccountingPeriod.query.order_by(AccountingPeriod.year.desc(), AccountingPeriod.month.desc()).all()
        result = []
        
        for period in periods:
            period_data = {
                'vuid': period.vuid,
                'name': period.name,
                'month': period.month,
                'year': period.year,
                'status': period.status,
                'created_at': period.created_at.isoformat(),
                'updated_at': period.updated_at.isoformat()
            }
            result.append(period_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@accounting_periods_bp.route('/accounting-periods/open', methods=['GET'])
def get_open_accounting_periods():
    """Get all open accounting periods"""
    try:
        periods = AccountingPeriod.query.filter_by(status='open').order_by(AccountingPeriod.year.desc(), AccountingPeriod.month.desc()).all()
        result = []
        
        for period in periods:
            period_data = {
                'vuid': period.vuid,
                'name': period.name,
                'month': period.month,
                'year': period.year,
                'status': period.status,
                'created_at': period.created_at.isoformat(),
                'updated_at': period.updated_at.isoformat()
            }
            result.append(period_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@accounting_periods_bp.route('/accounting-periods/<period_vuid>', methods=['GET'])
def get_accounting_period(period_vuid):
    """Get a specific accounting period by VUID"""
    try:
        period = AccountingPeriod.query.get(period_vuid)
        
        if not period:
            return jsonify({'error': 'Accounting period not found'}), 404
        
        period_data = {
            'vuid': period.vuid,
            'name': period.name,
            'month': period.month,
            'year': period.year,
            'status': period.status,
            'created_at': period.created_at.isoformat(),
            'updated_at': period.updated_at.isoformat()
        }
        
        return jsonify(period_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@accounting_periods_bp.route('/accounting-periods', methods=['POST'])
def create_accounting_period():
    """Create a new accounting period"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'month', 'year']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if period already exists
        existing_period = AccountingPeriod.query.filter_by(month=data['month'], year=data['year']).first()
        if existing_period:
            return jsonify({'error': 'Accounting period already exists for this month and year'}), 400
        
        period = AccountingPeriod(
            name=data['name'],
            month=data['month'],
            year=data['year'],
            status=data.get('status', 'open')
        )
        
        db.session.add(period)
        db.session.commit()
        
        return jsonify({
            'message': 'Accounting period created successfully',
            'period': {
                'vuid': period.vuid,
                'name': period.name,
                'month': period.month,
                'year': period.year
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@accounting_periods_bp.route('/accounting-periods/<period_vuid>', methods=['PUT'])
def update_accounting_period(period_vuid):
    """Update an accounting period"""
    try:
        period = AccountingPeriod.query.get(period_vuid)
        
        if not period:
            return jsonify({'error': 'Accounting period not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            period.name = data['name']
        if 'month' in data:
            period.month = data['month']
        if 'year' in data:
            period.year = data['year']
        if 'status' in data:
            period.status = data['status']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Accounting period updated successfully',
            'period': {
                'vuid': period.vuid,
                'name': period.name,
                'month': period.month,
                'year': period.year
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@accounting_periods_bp.route('/accounting-periods/<period_vuid>', methods=['DELETE'])
def delete_accounting_period(period_vuid):
    """Delete an accounting period"""
    try:
        period = AccountingPeriod.query.get(period_vuid)
        
        if not period:
            return jsonify({'error': 'Accounting period not found'}), 404
        
        db.session.delete(period)
        db.session.commit()
        
        return jsonify({'message': 'Accounting period deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

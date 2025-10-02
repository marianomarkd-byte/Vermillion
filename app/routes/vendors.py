from flask import Blueprint, request, jsonify
from app import db
from app.models import Vendor

vendors_bp = Blueprint('vendors', __name__)

@vendors_bp.route('/vendors', methods=['GET'])
def get_vendors():
    """Get all vendors"""
    try:
        vendors = Vendor.query.all()
        result = []
        
        for vendor in vendors:
            vendor_data = {
                'vuid': vendor.vuid,
                'vendor_name': vendor.vendor_name,
                'vendor_number': vendor.vendor_number,
                'contact_name': vendor.contact_name,
                'email': vendor.email,
                'phone': vendor.phone,
                'address': vendor.address,
                'created_at': vendor.created_at.isoformat(),
                'updated_at': vendor.updated_at.isoformat()
            }
            result.append(vendor_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vendors_bp.route('/vendors/<vendor_vuid>', methods=['GET'])
def get_vendor(vendor_vuid):
    """Get a specific vendor by VUID"""
    try:
        vendor = Vendor.query.get(vendor_vuid)
        
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404
        
        vendor_data = {
            'vuid': vendor.vuid,
            'vendor_name': vendor.vendor_name,
            'vendor_number': vendor.vendor_number,
            'contact_name': vendor.contact_name,
            'email': vendor.email,
            'phone': vendor.phone,
            'address': vendor.address,
            'created_at': vendor.created_at.isoformat(),
            'updated_at': vendor.updated_at.isoformat()
        }
        
        return jsonify(vendor_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vendors_bp.route('/vendors', methods=['POST'])
def create_vendor():
    """Create a new vendor"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['vendor_name', 'vendor_number']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if vendor number already exists
        existing_vendor = Vendor.query.filter_by(vendor_number=data['vendor_number']).first()
        if existing_vendor:
            return jsonify({'error': 'Vendor number already exists'}), 400
        
        vendor = Vendor(
            vendor_name=data['vendor_name'],
            vendor_number=data['vendor_number'],
            contact_name=data.get('contact_name'),
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address')
        )
        
        db.session.add(vendor)
        db.session.commit()
        
        return jsonify({
            'message': 'Vendor created successfully',
            'vendor': {
                'vuid': vendor.vuid,
                'vendor_name': vendor.vendor_name,
                'vendor_number': vendor.vendor_number
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vendors_bp.route('/vendors/<vendor_vuid>', methods=['PUT'])
def update_vendor(vendor_vuid):
    """Update a vendor"""
    try:
        vendor = Vendor.query.get(vendor_vuid)
        
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'vendor_name' in data:
            vendor.vendor_name = data['vendor_name']
        if 'vendor_number' in data:
            # Check if new vendor number already exists
            existing_vendor = Vendor.query.filter_by(vendor_number=data['vendor_number']).first()
            if existing_vendor and existing_vendor.vuid != vendor_vuid:
                return jsonify({'error': 'Vendor number already exists'}), 400
            vendor.vendor_number = data['vendor_number']
        if 'contact_name' in data:
            vendor.contact_name = data['contact_name']
        if 'email' in data:
            vendor.email = data['email']
        if 'phone' in data:
            vendor.phone = data['phone']
        if 'address' in data:
            vendor.address = data['address']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Vendor updated successfully',
            'vendor': {
                'vuid': vendor.vuid,
                'vendor_name': vendor.vendor_name,
                'vendor_number': vendor.vendor_number
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vendors_bp.route('/vendors/<vendor_vuid>', methods=['DELETE'])
def delete_vendor(vendor_vuid):
    """Delete a vendor"""
    try:
        vendor = Vendor.query.get(vendor_vuid)
        
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404
        
        db.session.delete(vendor)
        db.session.commit()
        
        return jsonify({'message': 'Vendor deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

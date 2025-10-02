from flask import Blueprint, request, jsonify
from app import db
from app.models import PostedRecord, PostedRecordLineItem, AccountingPeriod, Project

posted_records_bp = Blueprint('posted_records', __name__)

@posted_records_bp.route('/posted-records/<accounting_period_vuid>', methods=['GET'])
def get_posted_records(accounting_period_vuid):
    """Get all posted records for a specific accounting period"""
    try:
        posted_records = PostedRecord.query.filter_by(accounting_period_vuid=accounting_period_vuid).all()
        
        result = []
        for record in posted_records:
            record_data = {
                'vuid': record.vuid,
                'accounting_period_vuid': record.accounting_period_vuid,
                'project_vuid': record.project_vuid,
                'transaction_type': record.transaction_type,
                'transaction_vuid': record.transaction_vuid,
                'reference_number': record.reference_number,
                'description': record.description,
                'total_amount': float(record.total_amount) if record.total_amount else 0,
                'posted_by': record.posted_by,
                'posted_at': record.posted_at.isoformat() if record.posted_at else None,
                'reversed_by': record.reversed_by,
                'reversed_at': record.reversed_at.isoformat() if record.reversed_at else None,
                'created_at': record.created_at.isoformat(),
                'updated_at': record.updated_at.isoformat(),
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
                    } for li in record.line_items
                ]
            }
            result.append(record_data)
        
        return jsonify({'posted_records': result}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@posted_records_bp.route('/posted-records/post', methods=['POST'])
def post_transaction():
    """Post a transaction to the current accounting period"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['transaction_type', 'transaction_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        transaction_type = data['transaction_type']
        transaction_vuid = data['transaction_vuid']
        posted_by = data.get('posted_by', 'System')
        
        # Get the transaction based on type
        if transaction_type == 'ap_invoice':
            from app.models import APInvoice
            transaction = APInvoice.query.get(transaction_vuid)
        elif transaction_type == 'project_billing':
            from app.models import ProjectBilling
            transaction = ProjectBilling.query.get(transaction_vuid)
        elif transaction_type == 'labor_cost':
            from app.models import LaborCost
            transaction = LaborCost.query.get(transaction_vuid)
        elif transaction_type == 'project_expense':
            from app.models import ProjectExpense
            transaction = ProjectExpense.query.get(transaction_vuid)
        else:
            return jsonify({'error': 'Invalid transaction type'}), 400
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Create posted record
        posted_record = PostedRecord(
            accounting_period_vuid=transaction.accounting_period_vuid,
            project_vuid=transaction.project_vuid,
            transaction_type=transaction_type,
            transaction_vuid=transaction_vuid,
            reference_number=getattr(transaction, 'invoice_number', None) or 
                           getattr(transaction, 'billing_number', None) or 
                           getattr(transaction, 'labor_cost_number', None) or 
                           getattr(transaction, 'expense_number', None),
            description=getattr(transaction, 'description', None),
            total_amount=transaction.total_amount,
            posted_by=posted_by
        )
        
        db.session.add(posted_record)
        db.session.flush()
        
        # Create line items
        for line_item in transaction.line_items:
            posted_line_item = PostedRecordLineItem(
                posted_record_vuid=posted_record.vuid,
                cost_code_vuid=line_item.cost_code_vuid,
                cost_type_vuid=line_item.cost_type_vuid,
                description=line_item.description,
                quantity=line_item.quantity,
                unit_cost=line_item.unit_cost,
                total_cost=line_item.total_cost
            )
            db.session.add(posted_line_item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction posted successfully',
            'posted_record': {
                'vuid': posted_record.vuid,
                'transaction_type': posted_record.transaction_type,
                'transaction_vuid': posted_record.transaction_vuid
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@posted_records_bp.route('/posted-records/<record_vuid>/reverse', methods=['POST'])
def reverse_posted_record(record_vuid):
    """Reverse a posted record"""
    try:
        data = request.get_json()
        reversed_by = data.get('reversed_by', 'System')
        
        posted_record = PostedRecord.query.get(record_vuid)
        
        if not posted_record:
            return jsonify({'error': 'Posted record not found'}), 404
        
        if posted_record.reversed_at:
            return jsonify({'error': 'Record already reversed'}), 400
        
        # Mark as reversed
        posted_record.reversed_by = reversed_by
        posted_record.reversed_at = db.func.now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Posted record reversed successfully',
            'posted_record': {
                'vuid': posted_record.vuid,
                'reversed_by': posted_record.reversed_by,
                'reversed_at': posted_record.reversed_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

from flask import Blueprint, request, jsonify
from app import db
from app.models import PostedRecord, PostedRecordLineItem, AccountingPeriod, Project, CostCode, CostType

journal_entries_bp = Blueprint('journal_entries', __name__)

@journal_entries_bp.route('/journal-entries', methods=['GET'])
def get_journal_entries():
    """Get journal entries for a specific accounting period"""
    try:
        accounting_period_vuid = request.args.get('accounting_period_vuid')
        
        if not accounting_period_vuid:
            return jsonify({'error': 'accounting_period_vuid is required'}), 400
        
        # Get all posted records for the accounting period
        posted_records = PostedRecord.query.filter(
            PostedRecord.accounting_period_vuid == accounting_period_vuid,
            PostedRecord.reversed_at.is_(None)
        ).all()
        
        journal_entries = []
        
        for record in posted_records:
            # Create journal entry for each posted record
            journal_entry = {
                'posted_record_vuid': record.vuid,
                'transaction_type': record.transaction_type,
                'transaction_vuid': record.transaction_vuid,
                'reference_number': record.reference_number,
                'description': record.description,
                'total_amount': float(record.total_amount) if record.total_amount else 0,
                'posted_by': record.posted_by,
                'posted_at': record.posted_at.isoformat() if record.posted_at else None,
                'line_items': []
            }
            
            # Get line items for the posted record
            for line_item in record.line_items:
                journal_line_item = {
                    'cost_code_vuid': line_item.cost_code_vuid,
                    'cost_type_vuid': line_item.cost_type_vuid,
                    'description': line_item.description,
                    'quantity': float(line_item.quantity),
                    'unit_cost': float(line_item.unit_cost),
                    'total_cost': float(line_item.total_cost)
                }
                journal_entry['line_items'].append(journal_line_item)
            
            journal_entries.append(journal_entry)
        
        return jsonify(journal_entries), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_entries_bp.route('/journal-entries/preview', methods=['GET'])
def get_journal_entries_preview():
    """Get journal entries preview for a specific accounting period"""
    try:
        accounting_period_vuid = request.args.get('accounting_period_vuid')
        
        if not accounting_period_vuid:
            return jsonify({'error': 'accounting_period_vuid is required'}), 400
        
        # Get all posted records for the accounting period
        posted_records = PostedRecord.query.filter(
            PostedRecord.accounting_period_vuid == accounting_period_vuid,
            PostedRecord.reversed_at.is_(None)
        ).all()
        
        journal_entries_preview = []
        
        for record in posted_records:
            # Create journal entry preview for each posted record
            journal_entry_preview = {
                'posted_record_vuid': record.vuid,
                'transaction_type': record.transaction_type,
                'transaction_vuid': record.transaction_vuid,
                'reference_number': record.reference_number,
                'description': record.description,
                'total_amount': float(record.total_amount) if record.total_amount else 0,
                'posted_by': record.posted_by,
                'posted_at': record.posted_at.isoformat() if record.posted_at else None,
                'line_items_count': len(record.line_items)
            }
            
            journal_entries_preview.append(journal_entry_preview)
        
        return jsonify(journal_entries_preview), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_entries_bp.route('/journal-entries/export', methods=['POST'])
def export_journal_entries():
    """Export journal entries for a specific accounting period"""
    try:
        data = request.get_json()
        accounting_period_vuid = data.get('accounting_period_vuid')
        
        if not accounting_period_vuid:
            return jsonify({'error': 'accounting_period_vuid is required'}), 400
        
        # Get all posted records for the accounting period
        posted_records = PostedRecord.query.filter(
            PostedRecord.accounting_period_vuid == accounting_period_vuid,
            PostedRecord.reversed_at.is_(None)
        ).all()
        
        # Create export data
        export_data = {
            'accounting_period_vuid': accounting_period_vuid,
            'export_date': db.func.now(),
            'journal_entries': []
        }
        
        for record in posted_records:
            journal_entry = {
                'posted_record_vuid': record.vuid,
                'transaction_type': record.transaction_type,
                'transaction_vuid': record.transaction_vuid,
                'reference_number': record.reference_number,
                'description': record.description,
                'total_amount': float(record.total_amount) if record.total_amount else 0,
                'posted_by': record.posted_by,
                'posted_at': record.posted_at.isoformat() if record.posted_at else None,
                'line_items': []
            }
            
            # Get line items for the posted record
            for line_item in record.line_items:
                journal_line_item = {
                    'cost_code_vuid': line_item.cost_code_vuid,
                    'cost_type_vuid': line_item.cost_type_vuid,
                    'description': line_item.description,
                    'quantity': float(line_item.quantity),
                    'unit_cost': float(line_item.unit_cost),
                    'total_cost': float(line_item.total_cost)
                }
                journal_entry['line_items'].append(journal_line_item)
            
            export_data['journal_entries'].append(journal_entry)
        
        return jsonify(export_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

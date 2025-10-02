from flask import Blueprint, request, jsonify
from app import db
from app.models import Project, APInvoice, ProjectBilling, LaborCost, ProjectExpense, PostedRecord, Budget, Buyout, PendingChangeOrder

wip_bp = Blueprint('wip', __name__)

@wip_bp.route('/wip', methods=['GET'])
def get_wip():
    """Get WIP report for a specific accounting period"""
    try:
        accounting_period_vuid = request.args.get('accounting_period_vuid')
        
        if not accounting_period_vuid:
            return jsonify({'error': 'accounting_period_vuid is required'}), 400
        
        # Get all projects
        projects = Project.query.all()
        wip_data = []
        
        for project in projects:
            # Calculate costs to date
            costs_to_date = calculate_project_costs_to_date(project.vuid, accounting_period_vuid)
            
            # Calculate project billings total
            project_billings_total = calculate_project_billings_total(project.vuid, accounting_period_vuid)
            
            # Calculate revenue recognized
            revenue_recognized = calculate_revenue_recognized(project.vuid, accounting_period_vuid)
            
            # Calculate percent complete
            percent_complete = calculate_percent_complete(project.vuid, accounting_period_vuid)
            
            # Get total contract amount
            total_contract_amount = float(project.total_contract_amount) if project.total_contract_amount else 0
            
            project_data = {
                'project_vuid': project.vuid,
                'project_name': project.project_name,
                'project_number': project.project_number,
                'costs_to_date': costs_to_date,
                'project_billings_total': project_billings_total,
                'revenue_recognized': revenue_recognized,
                'percent_complete': percent_complete,
                'total_contract_amount': total_contract_amount,
                'over_under_billing': project_billings_total - revenue_recognized
            }
            
            wip_data.append(project_data)
        
        return jsonify(wip_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_project_costs_to_date(project_vuid, accounting_period_vuid):
    """Calculate total costs to date for a project"""
    try:
        # Get all posted records for this project up to the accounting period
        posted_records = PostedRecord.query.filter(
            PostedRecord.project_vuid == project_vuid,
            PostedRecord.accounting_period_vuid == accounting_period_vuid,
            PostedRecord.reversed_at.is_(None)
        ).all()
        
        total_costs = 0
        for record in posted_records:
            if record.transaction_type in ['ap_invoice', 'labor_cost', 'project_expense']:
                total_costs += float(record.total_amount) if record.total_amount else 0
        
        return total_costs
        
    except Exception as e:
        print(f"Error calculating costs to date: {e}")
        return 0

def calculate_project_billings_total(project_vuid, accounting_period_vuid):
    """Calculate total project billings for a project"""
    try:
        # Get all posted records for this project up to the accounting period
        posted_records = PostedRecord.query.filter(
            PostedRecord.project_vuid == project_vuid,
            PostedRecord.accounting_period_vuid == accounting_period_vuid,
            PostedRecord.reversed_at.is_(None)
        ).all()
        
        total_billings = 0
        for record in posted_records:
            if record.transaction_type == 'project_billing':
                total_billings += float(record.total_amount) if record.total_amount else 0
        
        return total_billings
        
    except Exception as e:
        print(f"Error calculating project billings total: {e}")
        return 0

def calculate_revenue_recognized(project_vuid, accounting_period_vuid):
    """Calculate revenue recognized for a project"""
    try:
        # Get all posted records for this project up to the accounting period
        posted_records = PostedRecord.query.filter(
            PostedRecord.project_vuid == project_vuid,
            PostedRecord.accounting_period_vuid == accounting_period_vuid,
            PostedRecord.reversed_at.is_(None)
        ).all()
        
        total_revenue = 0
        for record in posted_records:
            if record.transaction_type == 'project_billing':
                total_revenue += float(record.total_amount) if record.total_amount else 0
        
        return total_revenue
        
    except Exception as e:
        print(f"Error calculating revenue recognized: {e}")
        return 0

def calculate_percent_complete(project_vuid, accounting_period_vuid):
    """Calculate percent complete for a project"""
    try:
        # Get all posted records for this project up to the accounting period
        posted_records = PostedRecord.query.filter(
            PostedRecord.project_vuid == project_vuid,
            PostedRecord.accounting_period_vuid == accounting_period_vuid,
            PostedRecord.reversed_at.is_(None)
        ).all()
        
        total_costs = 0
        for record in posted_records:
            if record.transaction_type in ['ap_invoice', 'labor_cost', 'project_expense']:
                total_costs += float(record.total_amount) if record.total_amount else 0
        
        # Get project total contract amount
        project = Project.query.get(project_vuid)
        total_contract_amount = float(project.total_contract_amount) if project.total_contract_amount else 0
        
        if total_contract_amount > 0:
            percent_complete = (total_costs / total_contract_amount) * 100
            return round(percent_complete, 2)
        
        return 0
        
    except Exception as e:
        print(f"Error calculating percent complete: {e}")
        return 0

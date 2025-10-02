from flask import Blueprint, request, jsonify
from app import db
from app.models import ProjectExpense, ProjectExpenseLine, Project, AccountingPeriod

project_expenses_bp = Blueprint('project_expenses', __name__)

@project_expenses_bp.route('/project-expenses', methods=['GET'])
def get_project_expenses():
    """Get all project expenses"""
    try:
        project_vuid = request.args.get('project_vuid')
        
        query = ProjectExpense.query
        if project_vuid:
            query = query.filter_by(project_vuid=project_vuid)
        
        expenses = query.all()
        result = []
        
        for expense in expenses:
            expense_data = {
                'vuid': expense.vuid,
                'project_vuid': expense.project_vuid,
                'accounting_period_vuid': expense.accounting_period_vuid,
                'expense_number': expense.expense_number,
                'expense_date': expense.expense_date.isoformat() if expense.expense_date else None,
                'total_amount': float(expense.total_amount) if expense.total_amount else 0,
                'status': expense.status,
                'description': expense.description,
                'exported_to_accounting': expense.exported_to_accounting,
                'accounting_export_date': expense.accounting_export_date.isoformat() if expense.accounting_export_date else None,
                'created_at': expense.created_at.isoformat(),
                'updated_at': expense.updated_at.isoformat(),
                'line_items': [
                    {
                        'vuid': li.vuid,
                        'description': li.description,
                        'quantity': float(li.quantity),
                        'unit_cost': float(li.unit_cost),
                        'total_cost': float(li.total_cost),
                        'cost_code_vuid': li.cost_code_vuid,
                        'cost_type_vuid': li.cost_type_vuid,
                        'created_at': li.created_at.isoformat(),
                        'updated_at': li.updated_at.isoformat()
                    } for li in expense.line_items
                ]
            }
            result.append(expense_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@project_expenses_bp.route('/project-expenses/<expense_vuid>', methods=['GET'])
def get_project_expense(expense_vuid):
    """Get a specific project expense by VUID"""
    try:
        expense = ProjectExpense.query.get(expense_vuid)
        
        if not expense:
            return jsonify({'error': 'Project expense not found'}), 404
        
        expense_data = {
            'vuid': expense.vuid,
            'project_vuid': expense.project_vuid,
            'accounting_period_vuid': expense.accounting_period_vuid,
            'expense_number': expense.expense_number,
            'expense_date': expense.expense_date.isoformat() if expense.expense_date else None,
            'total_amount': float(expense.total_amount) if expense.total_amount else 0,
            'status': expense.status,
            'description': expense.description,
            'exported_to_accounting': expense.exported_to_accounting,
            'accounting_export_date': expense.accounting_export_date.isoformat() if expense.accounting_export_date else None,
            'created_at': expense.created_at.isoformat(),
            'updated_at': expense.updated_at.isoformat(),
            'line_items': [
                {
                    'vuid': li.vuid,
                    'description': li.description,
                    'quantity': float(li.quantity),
                    'unit_cost': float(li.unit_cost),
                    'total_cost': float(li.total_cost),
                    'cost_code_vuid': li.cost_code_vuid,
                    'cost_type_vuid': li.cost_type_vuid,
                    'created_at': li.created_at.isoformat(),
                    'updated_at': li.updated_at.isoformat()
                } for li in expense.line_items
            ]
        }
        
        return jsonify(expense_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@project_expenses_bp.route('/project-expenses', methods=['POST'])
def create_project_expense():
    """Create a new project expense"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['expense_number', 'project_vuid', 'accounting_period_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create the expense
        expense = ProjectExpense(
            expense_number=data['expense_number'],
            project_vuid=data['project_vuid'],
            accounting_period_vuid=data['accounting_period_vuid'],
            expense_date=data.get('expense_date'),
            total_amount=data.get('total_amount', 0),
            status=data.get('status', 'draft'),
            description=data.get('description')
        )
        
        db.session.add(expense)
        db.session.flush()  # Get the expense ID
        
        # Create line items
        line_items_data = data.get('line_items', [])
        for line_item_data in line_items_data:
            line_item = ProjectExpenseLine(
                project_expense_vuid=expense.vuid,
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
            'message': 'Project expense created successfully',
            'expense': {
                'vuid': expense.vuid,
                'expense_number': expense.expense_number
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@project_expenses_bp.route('/project-expenses/<expense_vuid>', methods=['PUT'])
def update_project_expense(expense_vuid):
    """Update a project expense"""
    try:
        expense = ProjectExpense.query.get(expense_vuid)
        
        if not expense:
            return jsonify({'error': 'Project expense not found'}), 404
        
        data = request.get_json()
        
        # Update expense fields
        if 'expense_number' in data:
            expense.expense_number = data['expense_number']
        if 'project_vuid' in data:
            expense.project_vuid = data['project_vuid']
        if 'accounting_period_vuid' in data:
            expense.accounting_period_vuid = data['accounting_period_vuid']
        if 'expense_date' in data:
            expense.expense_date = data['expense_date']
        if 'total_amount' in data:
            expense.total_amount = data['total_amount']
        if 'status' in data:
            expense.status = data['status']
        if 'description' in data:
            expense.description = data['description']
        
        # Update line items if provided
        if 'line_items' in data:
            # Delete existing line items
            ProjectExpenseLine.query.filter_by(project_expense_vuid=expense_vuid).delete()
            
            # Create new line items
            for line_item_data in data['line_items']:
                line_item = ProjectExpenseLine(
                    project_expense_vuid=expense.vuid,
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
            'message': 'Project expense updated successfully',
            'expense': {
                'vuid': expense.vuid,
                'expense_number': expense.expense_number
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@project_expenses_bp.route('/project-expenses/<expense_vuid>', methods=['DELETE'])
def delete_project_expense(expense_vuid):
    """Delete a project expense"""
    try:
        expense = ProjectExpense.query.get(expense_vuid)
        
        if not expense:
            return jsonify({'error': 'Project expense not found'}), 404
        
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({'message': 'Project expense deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

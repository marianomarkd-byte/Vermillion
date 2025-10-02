from flask import Blueprint, request, jsonify
from app import db
from app.models import Budget, BudgetLine, Project, CostCode, CostType

budgets_bp = Blueprint('budgets', __name__)

@budgets_bp.route('/budgets', methods=['GET'])
def get_budgets():
    """Get all budgets"""
    try:
        project_vuid = request.args.get('project_vuid')
        
        query = Budget.query
        if project_vuid:
            query = query.filter_by(project_vuid=project_vuid)
        
        budgets = query.all()
        result = []
        
        for budget in budgets:
            budget_data = {
                'vuid': budget.vuid,
                'project_vuid': budget.project_vuid,
                'name': budget.name,
                'version': budget.version,
                'status': budget.status,
                'created_at': budget.created_at.isoformat(),
                'updated_at': budget.updated_at.isoformat(),
                'budget_lines': [
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
                    } for li in budget.budget_lines
                ]
            }
            result.append(budget_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@budgets_bp.route('/budgets/<budget_vuid>', methods=['GET'])
def get_budget(budget_vuid):
    """Get a specific budget by VUID"""
    try:
        budget = Budget.query.get(budget_vuid)
        
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        budget_data = {
            'vuid': budget.vuid,
            'project_vuid': budget.project_vuid,
            'name': budget.name,
            'version': budget.version,
            'status': budget.status,
            'created_at': budget.created_at.isoformat(),
            'updated_at': budget.updated_at.isoformat(),
            'budget_lines': [
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
                } for li in budget.budget_lines
            ]
        }
        
        return jsonify(budget_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@budgets_bp.route('/budgets', methods=['POST'])
def create_budget():
    """Create a new budget"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'project_vuid']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create the budget
        budget = Budget(
            name=data['name'],
            project_vuid=data['project_vuid'],
            version=data.get('version', '1.0'),
            status=data.get('status', 'draft')
        )
        
        db.session.add(budget)
        db.session.flush()  # Get the budget ID
        
        # Create budget lines
        budget_lines_data = data.get('budget_lines', [])
        for budget_line_data in budget_lines_data:
            budget_line = BudgetLine(
                budget_vuid=budget.vuid,
                cost_code_vuid=budget_line_data['cost_code_vuid'],
                cost_type_vuid=budget_line_data['cost_type_vuid'],
                description=budget_line_data.get('description'),
                quantity=budget_line_data.get('quantity', 0),
                unit_cost=budget_line_data.get('unit_cost', 0),
                total_cost=budget_line_data.get('total_cost', 0)
            )
            db.session.add(budget_line)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Budget created successfully',
            'budget': {
                'vuid': budget.vuid,
                'name': budget.name,
                'version': budget.version
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@budgets_bp.route('/budgets/<budget_vuid>', methods=['PUT'])
def update_budget(budget_vuid):
    """Update a budget"""
    try:
        budget = Budget.query.get(budget_vuid)
        
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        data = request.get_json()
        
        # Update budget fields
        if 'name' in data:
            budget.name = data['name']
        if 'project_vuid' in data:
            budget.project_vuid = data['project_vuid']
        if 'version' in data:
            budget.version = data['version']
        if 'status' in data:
            budget.status = data['status']
        
        # Update budget lines if provided
        if 'budget_lines' in data:
            # Delete existing budget lines
            BudgetLine.query.filter_by(budget_vuid=budget_vuid).delete()
            
            # Create new budget lines
            for budget_line_data in data['budget_lines']:
                budget_line = BudgetLine(
                    budget_vuid=budget.vuid,
                    cost_code_vuid=budget_line_data['cost_code_vuid'],
                    cost_type_vuid=budget_line_data['cost_type_vuid'],
                    description=budget_line_data.get('description'),
                    quantity=budget_line_data.get('quantity', 0),
                    unit_cost=budget_line_data.get('unit_cost', 0),
                    total_cost=budget_line_data.get('total_cost', 0)
                )
                db.session.add(budget_line)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Budget updated successfully',
            'budget': {
                'vuid': budget.vuid,
                'name': budget.name,
                'version': budget.version
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@budgets_bp.route('/budgets/<budget_vuid>', methods=['DELETE'])
def delete_budget(budget_vuid):
    """Delete a budget"""
    try:
        budget = Budget.query.get(budget_vuid)
        
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        db.session.delete(budget)
        db.session.commit()
        
        return jsonify({'message': 'Budget deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

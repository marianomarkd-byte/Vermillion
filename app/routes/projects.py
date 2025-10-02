from flask import Blueprint, request, jsonify
from app import db
from app.models import Project

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/projects', methods=['GET'])
def get_projects():
    """Get all projects"""
    try:
        projects = Project.query.all()
        result = []
        
        for project in projects:
            project_data = {
                'vuid': project.vuid,
                'project_name': project.project_name,
                'project_number': project.project_number,
                'description': project.description,
                'status': project.status,
                'start_date': project.start_date.isoformat() if project.start_date else None,
                'end_date': project.end_date.isoformat() if project.end_date else None,
                'total_contract_amount': float(project.total_contract_amount) if project.total_contract_amount else 0,
                'created_at': project.created_at.isoformat(),
                'updated_at': project.updated_at.isoformat()
            }
            result.append(project_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/projects/<project_vuid>', methods=['GET'])
def get_project(project_vuid):
    """Get a specific project by VUID"""
    try:
        project = Project.query.get(project_vuid)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        project_data = {
            'vuid': project.vuid,
            'project_name': project.project_name,
            'project_number': project.project_number,
            'description': project.description,
            'status': project.status,
            'start_date': project.start_date.isoformat() if project.start_date else None,
            'end_date': project.end_date.isoformat() if project.end_date else None,
            'total_contract_amount': float(project.total_contract_amount) if project.total_contract_amount else 0,
            'created_at': project.created_at.isoformat(),
            'updated_at': project.updated_at.isoformat()
        }
        
        return jsonify(project_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/projects', methods=['POST'])
def create_project():
    """Create a new project"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['project_name', 'project_number']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if project number already exists
        existing_project = Project.query.filter_by(project_number=data['project_number']).first()
        if existing_project:
            return jsonify({'error': 'Project number already exists'}), 400
        
        project = Project(
            project_name=data['project_name'],
            project_number=data['project_number'],
            description=data.get('description'),
            status=data.get('status', 'active'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            total_contract_amount=data.get('total_contract_amount', 0)
        )
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            'message': 'Project created successfully',
            'project': {
                'vuid': project.vuid,
                'project_name': project.project_name,
                'project_number': project.project_number
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/projects/<project_vuid>', methods=['PUT'])
def update_project(project_vuid):
    """Update a project"""
    try:
        project = Project.query.get(project_vuid)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'project_name' in data:
            project.project_name = data['project_name']
        if 'project_number' in data:
            # Check if new project number already exists
            existing_project = Project.query.filter_by(project_number=data['project_number']).first()
            if existing_project and existing_project.vuid != project_vuid:
                return jsonify({'error': 'Project number already exists'}), 400
            project.project_number = data['project_number']
        if 'description' in data:
            project.description = data['description']
        if 'status' in data:
            project.status = data['status']
        if 'start_date' in data:
            project.start_date = data['start_date']
        if 'end_date' in data:
            project.end_date = data['end_date']
        if 'total_contract_amount' in data:
            project.total_contract_amount = data['total_contract_amount']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Project updated successfully',
            'project': {
                'vuid': project.vuid,
                'project_name': project.project_name,
                'project_number': project.project_number
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/projects/<project_vuid>', methods=['DELETE'])
def delete_project(project_vuid):
    """Delete a project"""
    try:
        project = Project.query.get(project_vuid)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({'message': 'Project deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

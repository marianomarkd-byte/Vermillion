from flask import Blueprint, jsonify
from sqlalchemy import text
from datetime import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('/health')
def health_check():
    from app.main import db
    
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'components': {
            'database': 'unhealthy',
            'api': 'healthy'
        }
    }
    
    # Check database connection
    try:
        # Execute a simple query
        db.session.execute(text('SELECT 1'))
        db.session.commit()
        health_status['components']['database'] = 'healthy'
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['components']['database'] = str(e)
    
    return jsonify(health_status)



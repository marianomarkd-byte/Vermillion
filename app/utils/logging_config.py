import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from flask import request, jsonify

def setup_logging(app):
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # Set up file handler for general logs
    general_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10000000,  # 10MB
        backupCount=5
    )
    general_handler.setLevel(logging.INFO)
    general_handler.setFormatter(logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    ))

    # Set up file handler for error logs
    error_handler = RotatingFileHandler(
        'logs/error.log',
        maxBytes=10000000,  # 10MB
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s\n'
        'Path: %(request_path)s\n'
        'Method: %(request_method)s\n'
        'IP: %(ip)s\n'
        'User Agent: %(user_agent)s\n'
        'Stack Trace:\n%(stack_trace)s\n'
    ))

    # Add handlers to app logger
    app.logger.addHandler(general_handler)
    app.logger.addHandler(error_handler)
    app.logger.setLevel(logging.INFO)

    # Log application startup
    app.logger.info(f"Application started at {datetime.now()}")

    @app.before_request
    def log_request_info():
        app.logger.info(f"Request to {request.path} from {request.remote_addr}")

    @app.errorhandler(Exception)
    def handle_exception(e):
        import traceback
        exc_info = traceback.format_exc()
        
        # Get request details
        request_details = {
            'request_path': request.path,
            'request_method': request.method,
            'ip': request.remote_addr,
            'user_agent': request.user_agent.string,
            'stack_trace': exc_info
        }
        
        # Log the error with details
        app.logger.error(
            f"Exception occurred: {str(e)}",
            extra=request_details
        )
        
        # Return error response
        return jsonify({
            'error': 'Internal Server Error',
            'message': str(e) if app.debug else 'An unexpected error occurred'
        }), 500

    return app
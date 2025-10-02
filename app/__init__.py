from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:password@localhost/vermillion')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    
    # Register blueprints
    from app.routes.projects import projects_bp
    from app.routes.vendors import vendors_bp
    from app.routes.ap_invoices import ap_invoices_bp
    from app.routes.project_billings import project_billings_bp
    from app.routes.labor_costs import labor_costs_bp
    from app.routes.project_expenses import project_expenses_bp
    from app.routes.posted_records import posted_records_bp
    from app.routes.wip import wip_bp
    from app.routes.journal_entries import journal_entries_bp
    from app.routes.accounting_periods import accounting_periods_bp
    from app.routes.cost_codes import cost_codes_bp
    from app.routes.cost_types import cost_types_bp
    from app.routes.commitments import commitments_bp
    from app.routes.budgets import budgets_bp
    from app.routes.contracts import contracts_bp
    from app.routes.change_orders import change_orders_bp
    from app.routes.buyouts import buyouts_bp
    from app.routes.pending_change_orders import pending_change_orders_bp
    
    app.register_blueprint(projects_bp, url_prefix='/api')
    app.register_blueprint(vendors_bp, url_prefix='/api')
    app.register_blueprint(ap_invoices_bp, url_prefix='/api')
    app.register_blueprint(project_billings_bp, url_prefix='/api')
    app.register_blueprint(labor_costs_bp, url_prefix='/api')
    app.register_blueprint(project_expenses_bp, url_prefix='/api')
    app.register_blueprint(posted_records_bp, url_prefix='/api')
    app.register_blueprint(wip_bp, url_prefix='/api')
    app.register_blueprint(journal_entries_bp, url_prefix='/api')
    app.register_blueprint(accounting_periods_bp, url_prefix='/api')
    app.register_blueprint(cost_codes_bp, url_prefix='/api')
    app.register_blueprint(cost_types_bp, url_prefix='/api')
    app.register_blueprint(commitments_bp, url_prefix='/api')
    app.register_blueprint(budgets_bp, url_prefix='/api')
    app.register_blueprint(contracts_bp, url_prefix='/api')
    app.register_blueprint(change_orders_bp, url_prefix='/api')
    app.register_blueprint(buyouts_bp, url_prefix='/api')
    app.register_blueprint(pending_change_orders_bp, url_prefix='/api')
    
    return app
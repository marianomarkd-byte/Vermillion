from app import db
from datetime import datetime
import uuid

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Project(db.Model):
    __tablename__ = 'projects'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_name = db.Column(db.String(255), nullable=False)
    project_number = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='active')
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    total_contract_amount = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    budgets = db.relationship('Budget', backref='project', lazy=True, cascade='all, delete-orphan')
    contracts = db.relationship('Contract', backref='project', lazy=True, cascade='all, delete-orphan')
    ap_invoices = db.relationship('APInvoice', backref='project', lazy=True, cascade='all, delete-orphan')
    project_billings = db.relationship('ProjectBilling', backref='project', lazy=True, cascade='all, delete-orphan')
    labor_costs = db.relationship('LaborCost', backref='project', lazy=True, cascade='all, delete-orphan')
    project_expenses = db.relationship('ProjectExpense', backref='project', lazy=True, cascade='all, delete-orphan')
    commitments = db.relationship('Commitment', backref='project', lazy=True, cascade='all, delete-orphan')
    change_orders = db.relationship('ChangeOrder', backref='project', lazy=True, cascade='all, delete-orphan')
    buyouts = db.relationship('Buyout', backref='project', lazy=True, cascade='all, delete-orphan')
    pending_change_orders = db.relationship('PendingChangeOrder', backref='project', lazy=True, cascade='all, delete-orphan')

class Vendor(db.Model):
    __tablename__ = 'vendors'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_name = db.Column(db.String(255), nullable=False)
    vendor_number = db.Column(db.String(50), unique=True, nullable=False)
    contact_name = db.Column(db.String(255))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ap_invoices = db.relationship('APInvoice', backref='vendor', lazy=True, cascade='all, delete-orphan')
    commitments = db.relationship('Commitment', backref='vendor', lazy=True, cascade='all, delete-orphan')

class AccountingPeriod(db.Model):
    __tablename__ = 'accounting_periods'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ap_invoices = db.relationship('APInvoice', backref='accounting_period', lazy=True)
    project_billings = db.relationship('ProjectBilling', backref='accounting_period', lazy=True)
    labor_costs = db.relationship('LaborCost', backref='accounting_period', lazy=True)
    project_expenses = db.relationship('ProjectExpense', backref='accounting_period', lazy=True)
    posted_records = db.relationship('PostedRecord', backref='accounting_period', lazy=True)

class CostCode(db.Model):
    __tablename__ = 'cost_codes'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    budget_lines = db.relationship('BudgetLine', backref='cost_code', lazy=True)
    ap_invoice_lines = db.relationship('APInvoiceLine', backref='cost_code', lazy=True)
    project_billing_lines = db.relationship('ProjectBillingLine', backref='cost_code', lazy=True)
    labor_cost_lines = db.relationship('LaborCostLine', backref='cost_code', lazy=True)
    project_expense_lines = db.relationship('ProjectExpenseLine', backref='cost_code', lazy=True)
    commitment_lines = db.relationship('CommitmentLine', backref='cost_code', lazy=True)
    change_order_lines = db.relationship('ChangeOrderLine', backref='cost_code', lazy=True)
    buyout_lines = db.relationship('BuyoutLine', backref='cost_code', lazy=True)
    pending_change_order_lines = db.relationship('PendingChangeOrderLine', backref='cost_code', lazy=True)

class CostType(db.Model):
    __tablename__ = 'cost_types'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    budget_lines = db.relationship('BudgetLine', backref='cost_type', lazy=True)
    ap_invoice_lines = db.relationship('APInvoiceLine', backref='cost_type', lazy=True)
    project_billing_lines = db.relationship('ProjectBillingLine', backref='cost_type', lazy=True)
    labor_cost_lines = db.relationship('LaborCostLine', backref='cost_type', lazy=True)
    project_expense_lines = db.relationship('ProjectExpenseLine', backref='cost_type', lazy=True)
    commitment_lines = db.relationship('CommitmentLine', backref='cost_type', lazy=True)
    change_order_lines = db.relationship('ChangeOrderLine', backref='cost_type', lazy=True)
    buyout_lines = db.relationship('BuyoutLine', backref='cost_type', lazy=True)
    pending_change_order_lines = db.relationship('PendingChangeOrderLine', backref='cost_type', lazy=True)

class Budget(db.Model):
    __tablename__ = 'budgets'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    version = db.Column(db.String(50), default='1.0')
    status = db.Column(db.String(50), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    budget_lines = db.relationship('BudgetLine', backref='budget', lazy=True, cascade='all, delete-orphan')

class BudgetLine(db.Model):
    __tablename__ = 'budget_lines'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    budget_vuid = db.Column(db.String(36), db.ForeignKey('budgets.vuid'), nullable=False)
    cost_code_vuid = db.Column(db.String(36), db.ForeignKey('cost_codes.vuid'), nullable=False)
    cost_type_vuid = db.Column(db.String(36), db.ForeignKey('cost_types.vuid'), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(15, 2), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Contract(db.Model):
    __tablename__ = 'contracts'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    budget_vuid = db.Column(db.String(36), db.ForeignKey('budgets.vuid'), nullable=False)
    contract_number = db.Column(db.String(100), nullable=False)
    contract_name = db.Column(db.String(255), nullable=False)
    contract_amount = db.Column(db.Numeric(15, 2), nullable=False)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Commitment(db.Model):
    __tablename__ = 'commitments'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    vendor_vuid = db.Column(db.String(36), db.ForeignKey('vendors.vuid'), nullable=False)
    commitment_number = db.Column(db.String(100), nullable=False)
    commitment_name = db.Column(db.String(255), nullable=False)
    commitment_amount = db.Column(db.Numeric(15, 2), nullable=False)
    commitment_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    commitment_lines = db.relationship('CommitmentLine', backref='commitment', lazy=True, cascade='all, delete-orphan')
    ap_invoices = db.relationship('APInvoice', backref='commitment', lazy=True)

class CommitmentLine(db.Model):
    __tablename__ = 'commitment_lines'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    commitment_vuid = db.Column(db.String(36), db.ForeignKey('commitments.vuid'), nullable=False)
    cost_code_vuid = db.Column(db.String(36), db.ForeignKey('cost_codes.vuid'), nullable=False)
    cost_type_vuid = db.Column(db.String(36), db.ForeignKey('cost_types.vuid'), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(15, 2), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class APInvoice(db.Model):
    __tablename__ = 'ap_invoices'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    vendor_vuid = db.Column(db.String(36), db.ForeignKey('vendors.vuid'), nullable=False)
    commitment_vuid = db.Column(db.String(36), db.ForeignKey('commitments.vuid'))
    accounting_period_vuid = db.Column(db.String(36), db.ForeignKey('accounting_periods.vuid'), nullable=False)
    invoice_number = db.Column(db.String(100), nullable=False)
    invoice_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    subtotal = db.Column(db.Numeric(15, 2), default=0)
    retention_held = db.Column(db.Numeric(15, 2), default=0)
    retention_released = db.Column(db.Numeric(15, 2), default=0)
    total_amount = db.Column(db.Numeric(15, 2), default=0)
    status = db.Column(db.String(50), default='draft')
    description = db.Column(db.Text)
    exported_to_accounting = db.Column(db.Boolean, default=False)
    accounting_export_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    line_items = db.relationship('APInvoiceLine', backref='ap_invoice', lazy=True, cascade='all, delete-orphan')

class APInvoiceLine(db.Model):
    __tablename__ = 'ap_invoice_lines'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ap_invoice_vuid = db.Column(db.String(36), db.ForeignKey('ap_invoices.vuid'), nullable=False)
    cost_code_vuid = db.Column(db.String(36), db.ForeignKey('cost_codes.vuid'), nullable=False)
    cost_type_vuid = db.Column(db.String(36), db.ForeignKey('cost_types.vuid'), nullable=False)
    commitment_line_vuid = db.Column(db.String(36), db.ForeignKey('commitment_lines.vuid'))
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(15, 2), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProjectBilling(db.Model):
    __tablename__ = 'project_billings'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    accounting_period_vuid = db.Column(db.String(36), db.ForeignKey('accounting_periods.vuid'), nullable=False)
    billing_number = db.Column(db.String(100), nullable=False)
    billing_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    subtotal = db.Column(db.Numeric(15, 2), default=0)
    retention_held = db.Column(db.Numeric(15, 2), default=0)
    retention_released = db.Column(db.Numeric(15, 2), default=0)
    total_amount = db.Column(db.Numeric(15, 2), default=0)
    status = db.Column(db.String(50), default='draft')
    description = db.Column(db.Text)
    exported_to_accounting = db.Column(db.Boolean, default=False)
    accounting_export_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    line_items = db.relationship('ProjectBillingLine', backref='project_billing', lazy=True, cascade='all, delete-orphan')

class ProjectBillingLine(db.Model):
    __tablename__ = 'project_billing_lines'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_billing_vuid = db.Column(db.String(36), db.ForeignKey('project_billings.vuid'), nullable=False)
    cost_code_vuid = db.Column(db.String(36), db.ForeignKey('cost_codes.vuid'), nullable=False)
    cost_type_vuid = db.Column(db.String(36), db.ForeignKey('cost_types.vuid'), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(15, 2), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LaborCost(db.Model):
    __tablename__ = 'labor_costs'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    accounting_period_vuid = db.Column(db.String(36), db.ForeignKey('accounting_periods.vuid'), nullable=False)
    labor_cost_number = db.Column(db.String(100), nullable=False)
    labor_cost_date = db.Column(db.Date)
    total_amount = db.Column(db.Numeric(15, 2), default=0)
    status = db.Column(db.String(50), default='draft')
    description = db.Column(db.Text)
    exported_to_accounting = db.Column(db.Boolean, default=False)
    accounting_export_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    line_items = db.relationship('LaborCostLine', backref='labor_cost', lazy=True, cascade='all, delete-orphan')

class LaborCostLine(db.Model):
    __tablename__ = 'labor_cost_lines'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    labor_cost_vuid = db.Column(db.String(36), db.ForeignKey('labor_costs.vuid'), nullable=False)
    cost_code_vuid = db.Column(db.String(36), db.ForeignKey('cost_codes.vuid'), nullable=False)
    cost_type_vuid = db.Column(db.String(36), db.ForeignKey('cost_types.vuid'), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(15, 2), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProjectExpense(db.Model):
    __tablename__ = 'project_expenses'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    accounting_period_vuid = db.Column(db.String(36), db.ForeignKey('accounting_periods.vuid'), nullable=False)
    expense_number = db.Column(db.String(100), nullable=False)
    expense_date = db.Column(db.Date)
    total_amount = db.Column(db.Numeric(15, 2), default=0)
    status = db.Column(db.String(50), default='draft')
    description = db.Column(db.Text)
    exported_to_accounting = db.Column(db.Boolean, default=False)
    accounting_export_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    line_items = db.relationship('ProjectExpenseLine', backref='project_expense', lazy=True, cascade='all, delete-orphan')

class ProjectExpenseLine(db.Model):
    __tablename__ = 'project_expense_lines'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_expense_vuid = db.Column(db.String(36), db.ForeignKey('project_expenses.vuid'), nullable=False)
    cost_code_vuid = db.Column(db.String(36), db.ForeignKey('cost_codes.vuid'), nullable=False)
    cost_type_vuid = db.Column(db.String(36), db.ForeignKey('cost_types.vuid'), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(15, 2), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PostedRecord(db.Model):
    __tablename__ = 'posted_records'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    accounting_period_vuid = db.Column(db.String(36), db.ForeignKey('accounting_periods.vuid'), nullable=False)
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)
    transaction_vuid = db.Column(db.String(36), nullable=False)
    reference_number = db.Column(db.String(100))
    description = db.Column(db.Text)
    total_amount = db.Column(db.Numeric(15, 2), default=0)
    posted_by = db.Column(db.String(100))
    posted_at = db.Column(db.DateTime, default=datetime.utcnow)
    reversed_by = db.Column(db.String(100))
    reversed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    line_items = db.relationship('PostedRecordLineItem', backref='posted_record', lazy=True, cascade='all, delete-orphan')

class PostedRecordLineItem(db.Model):
    __tablename__ = 'posted_record_line_items'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    posted_record_vuid = db.Column(db.String(36), db.ForeignKey('posted_records.vuid'), nullable=False)
    cost_code_vuid = db.Column(db.String(36), db.ForeignKey('cost_codes.vuid'), nullable=False)
    cost_type_vuid = db.Column(db.String(36), db.ForeignKey('cost_types.vuid'), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(15, 2), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChangeOrder(db.Model):
    __tablename__ = 'change_orders'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    change_order_number = db.Column(db.String(100), nullable=False)
    change_order_name = db.Column(db.String(255), nullable=False)
    change_order_amount = db.Column(db.Numeric(15, 2), nullable=False)
    change_order_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    change_order_lines = db.relationship('ChangeOrderLine', backref='change_order', lazy=True, cascade='all, delete-orphan')

class ChangeOrderLine(db.Model):
    __tablename__ = 'change_order_lines'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    change_order_vuid = db.Column(db.String(36), db.ForeignKey('change_orders.vuid'), nullable=False)
    cost_code_vuid = db.Column(db.String(36), db.ForeignKey('cost_codes.vuid'), nullable=False)
    cost_type_vuid = db.Column(db.String(36), db.ForeignKey('cost_types.vuid'), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(15, 2), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Buyout(db.Model):
    __tablename__ = 'buyouts'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    buyout_number = db.Column(db.String(100), nullable=False)
    buyout_name = db.Column(db.String(255), nullable=False)
    buyout_amount = db.Column(db.Numeric(15, 2), nullable=False)
    buyout_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    buyout_lines = db.relationship('BuyoutLine', backref='buyout', lazy=True, cascade='all, delete-orphan')

class BuyoutLine(db.Model):
    __tablename__ = 'buyout_lines'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    buyout_vuid = db.Column(db.String(36), db.ForeignKey('buyouts.vuid'), nullable=False)
    cost_code_vuid = db.Column(db.String(36), db.ForeignKey('cost_codes.vuid'), nullable=False)
    cost_type_vuid = db.Column(db.String(36), db.ForeignKey('cost_types.vuid'), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(15, 2), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    eac_amount = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PendingChangeOrder(db.Model):
    __tablename__ = 'pending_change_orders'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_vuid = db.Column(db.String(36), db.ForeignKey('projects.vuid'), nullable=False)
    pending_change_order_number = db.Column(db.String(100), nullable=False)
    pending_change_order_name = db.Column(db.String(255), nullable=False)
    pending_change_order_amount = db.Column(db.Numeric(15, 2), nullable=False)
    pending_change_order_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    pending_change_order_lines = db.relationship('PendingChangeOrderLine', backref='pending_change_order', lazy=True, cascade='all, delete-orphan')

class PendingChangeOrderLine(db.Model):
    __tablename__ = 'pending_change_order_lines'
    
    vuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pending_change_order_vuid = db.Column(db.String(36), db.ForeignKey('pending_change_orders.vuid'), nullable=False)
    cost_code_vuid = db.Column(db.String(36), db.ForeignKey('cost_codes.vuid'), nullable=False)
    cost_type_vuid = db.Column(db.String(36), db.ForeignKey('cost_types.vuid'), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Numeric(15, 2), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

#!/usr/bin/env python3

from app import create_app, db
from app.models import *

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create default cost codes if they don't exist
        default_cost_codes = [
            {'code': '1000', 'description': 'General Conditions'},
            {'code': '2000', 'description': 'Site Work'},
            {'code': '3000', 'description': 'Concrete'},
            {'code': '4000', 'description': 'Masonry'},
            {'code': '5000', 'description': 'Metals'},
            {'code': '6000', 'description': 'Wood & Plastics'},
            {'code': '7000', 'description': 'Thermal & Moisture Protection'},
            {'code': '8000', 'description': 'Openings'},
            {'code': '9000', 'description': 'Finishes'},
            {'code': '10000', 'description': 'Specialties'},
            {'code': '11000', 'description': 'Equipment'},
            {'code': '12000', 'description': 'Furnishings'},
            {'code': '13000', 'description': 'Special Construction'},
            {'code': '14000', 'description': 'Conveying Equipment'},
            {'code': '15000', 'description': 'Fire Suppression'},
            {'code': '16000', 'description': 'Plumbing'},
            {'code': '17000', 'description': 'HVAC'},
            {'code': '18000', 'description': 'Electrical'},
            {'code': '19000', 'description': 'Communications'},
            {'code': '20000', 'description': 'Electronic Safety & Security'},
            {'code': '21000', 'description': 'Earthwork'},
            {'code': '22000', 'description': 'Exterior Improvements'},
            {'code': '23000', 'description': 'Utilities'},
            {'code': '24000', 'description': 'Transportation'},
            {'code': '25000', 'description': 'Waterway & Marine Construction'},
            {'code': '26000', 'description': 'Reserved'},
            {'code': '27000', 'description': 'Reserved'},
            {'code': '28000', 'description': 'Reserved'},
            {'code': '29000', 'description': 'Reserved'},
            {'code': '30000', 'description': 'Reserved'},
            {'code': '31000', 'description': 'Reserved'},
            {'code': '32000', 'description': 'Reserved'},
            {'code': '33000', 'description': 'Reserved'},
            {'code': '34000', 'description': 'Reserved'},
            {'code': '35000', 'description': 'Reserved'},
            {'code': '36000', 'description': 'Reserved'},
            {'code': '37000', 'description': 'Reserved'},
            {'code': '38000', 'description': 'Reserved'},
            {'code': '39000', 'description': 'Reserved'},
            {'code': '40000', 'description': 'Reserved'},
            {'code': '41000', 'description': 'Reserved'},
            {'code': '42000', 'description': 'Reserved'},
            {'code': '43000', 'description': 'Reserved'},
            {'code': '44000', 'description': 'Reserved'},
            {'code': '45000', 'description': 'Reserved'},
            {'code': '46000', 'description': 'Reserved'},
            {'code': '47000', 'description': 'Reserved'},
            {'code': '48000', 'description': 'Reserved'},
            {'code': '49000', 'description': 'Reserved'},
            {'code': '50000', 'description': 'Reserved'},
            {'code': '51000', 'description': 'Reserved'},
            {'code': '52000', 'description': 'Reserved'},
            {'code': '53000', 'description': 'Reserved'},
            {'code': '54000', 'description': 'Reserved'},
            {'code': '55000', 'description': 'Reserved'},
            {'code': '56000', 'description': 'Reserved'},
            {'code': '57000', 'description': 'Reserved'},
            {'code': '58000', 'description': 'Reserved'},
            {'code': '59000', 'description': 'Reserved'},
            {'code': '60000', 'description': 'Reserved'},
            {'code': '61000', 'description': 'Reserved'},
            {'code': '62000', 'description': 'Reserved'},
            {'code': '63000', 'description': 'Reserved'},
            {'code': '64000', 'description': 'Reserved'},
            {'code': '65000', 'description': 'Reserved'},
            {'code': '66000', 'description': 'Reserved'},
            {'code': '67000', 'description': 'Reserved'},
            {'code': '68000', 'description': 'Reserved'},
            {'code': '69000', 'description': 'Reserved'},
            {'code': '70000', 'description': 'Reserved'},
            {'code': '71000', 'description': 'Reserved'},
            {'code': '72000', 'description': 'Reserved'},
            {'code': '73000', 'description': 'Reserved'},
            {'code': '74000', 'description': 'Reserved'},
            {'code': '75000', 'description': 'Reserved'},
            {'code': '76000', 'description': 'Reserved'},
            {'code': '77000', 'description': 'Reserved'},
            {'code': '78000', 'description': 'Reserved'},
            {'code': '79000', 'description': 'Reserved'},
            {'code': '80000', 'description': 'Reserved'},
            {'code': '81000', 'description': 'Reserved'},
            {'code': '82000', 'description': 'Reserved'},
            {'code': '83000', 'description': 'Reserved'},
            {'code': '84000', 'description': 'Reserved'},
            {'code': '85000', 'description': 'Reserved'},
            {'code': '86000', 'description': 'Reserved'},
            {'code': '87000', 'description': 'Reserved'},
            {'code': '88000', 'description': 'Reserved'},
            {'code': '89000', 'description': 'Reserved'},
            {'code': '90000', 'description': 'Reserved'},
            {'code': '91000', 'description': 'Reserved'},
            {'code': '92000', 'description': 'Reserved'},
            {'code': '93000', 'description': 'Reserved'},
            {'code': '94000', 'description': 'Reserved'},
            {'code': '95000', 'description': 'Reserved'},
            {'code': '96000', 'description': 'Reserved'},
            {'code': '97000', 'description': 'Reserved'},
            {'code': '98000', 'description': 'Reserved'},
            {'code': '99000', 'description': 'Reserved'}
        ]
        
        for cost_code_data in default_cost_codes:
            existing_cost_code = CostCode.query.filter_by(code=cost_code_data['code']).first()
            if not existing_cost_code:
                cost_code = CostCode(
                    code=cost_code_data['code'],
                    description=cost_code_data['description']
                )
                db.session.add(cost_code)
        
        # Create default cost types if they don't exist
        default_cost_types = [
            {'name': 'Labor', 'description': 'Labor costs'},
            {'name': 'Material', 'description': 'Material costs'},
            {'name': 'Equipment', 'description': 'Equipment costs'},
            {'name': 'Subcontractor', 'description': 'Subcontractor costs'},
            {'name': 'Other', 'description': 'Other costs'}
        ]
        
        for cost_type_data in default_cost_types:
            existing_cost_type = CostType.query.filter_by(name=cost_type_data['name']).first()
            if not existing_cost_type:
                cost_type = CostType(
                    name=cost_type_data['name'],
                    description=cost_type_data['description']
                )
                db.session.add(cost_type)
        
        # Create default accounting periods if they don't exist
        import datetime
        current_year = datetime.datetime.now().year
        current_month = datetime.datetime.now().month
        
        for month in range(1, 13):
            month_name = datetime.datetime(current_year, month, 1).strftime('%B')
            existing_period = AccountingPeriod.query.filter_by(month=month, year=current_year).first()
            if not existing_period:
                period = AccountingPeriod(
                    name=f'{month_name} {current_year}',
                    month=month,
                    year=current_year,
                    status='open' if month == current_month else 'closed'
                )
                db.session.add(period)
        
        db.session.commit()
        print("Database initialized successfully!")
    
    app.run(host='0.0.0.0', port=5001, debug=True)

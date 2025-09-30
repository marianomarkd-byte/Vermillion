from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Drop schema with CASCADE
    db.session.execute(text('DROP SCHEMA public CASCADE;'))
    db.session.execute(text('CREATE SCHEMA public;'))
    db.session.commit()
    
    # Create all tables
    db.create_all()
    
    print("Database reset successfully!")
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True
    # Require PostgreSQL database - no SQLite fallback
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required. This application only supports PostgreSQL.")
    
    if not database_url.startswith(('postgres://', 'postgresql://')):
        raise ValueError("DATABASE_URL must be a PostgreSQL connection string. This application does not support SQLite.")
    
    # Convert postgres:// to postgresql:// for SQLAlchemy compatibility
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    # Use the database URL from environment variable
    SQLALCHEMY_DATABASE_URI = database_url

class ProductionConfig(Config):
    DEBUG = False
    # Require PostgreSQL database - no SQLite fallback
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required. This application only supports PostgreSQL.")
    
    if not database_url.startswith(('postgres://', 'postgresql://')):
        raise ValueError("DATABASE_URL must be a PostgreSQL connection string. This application does not support SQLite.")
    
    # Convert postgres:// to postgresql:// for SQLAlchemy compatibility
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_DATABASE_URI = database_url

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://username:password@localhost:5432/vermillion_test'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

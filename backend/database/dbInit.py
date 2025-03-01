from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

db = SQLAlchemy()

def init_app(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://22CS30032:22CS30032@10.5.18.72:5432'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

def init_db(app):
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")

def test_connection(app):
    with app.app_context():
        try:
            db.session.execute(text('SELECT 1'))
            print("Database connection is successful!")
            return True
        except Exception as e:
            print(f"Error: Could not connect to the database. {str(e)}")
            return False
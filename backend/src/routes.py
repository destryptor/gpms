import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from flask import request, jsonify
from sqlalchemy.exc import IntegrityError
from database.dbInit import db
from database.classes import *
from sqlalchemy import text


def register_routes(app):
    @app.route('/')
    def test_connection():
        try:
            db.session.execute(text('SELECT 1'))
            return "Database connection is successful!"
        except Exception as e:
            return f"Error: Could not connect to the database. {str(e)}"

    @app.route('/add_user', methods=['POST'])
    def add_user():
        data = request.json
        try:
            new_user = User(username=data['username'], role=data['role'], password=data['password'])
            db.session.add(new_user)
            db.session.commit()
            return jsonify({"message": "User added successfully!", "user_id": new_user.id}), 201
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Username already exists!"}), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route('/register', methods=['POST'])
    def register():
        data = request.json
        role = data.get('role')

        try:
            if role == 'citizen':
                new_citizen = Citizen(
                    name=data['name'],
                    date_of_birth=data['date_of_birth'],
                    sex=data['sex'],
                    occupation=data.get('occupation'),
                    qualification=data.get('qualification'),
                    address=data['address'],
                    phone_number=data.get('phone_number', []),
                    income=data.get('income')
                )
                db.session.add(new_citizen)
                db.session.flush()

                new_user = User(
                    username=data['username'], 
                    role='citizen'
                )
                new_user.set_password(data['password'])
                db.session.add(new_user)
                db.session.flush()
                
                new_citizen_user = CitizenUser(
                    user_id=new_user.id,
                    citizen_id=new_citizen.id
                )
                db.session.add(new_citizen_user)
                db.session.commit()

            elif role == 'government_monitor':
                new_gov_monitor = GovernmentMonitor(
                    name=data['name'],
                    type=data.get('type'),
                    contact=data['contact'],
                    website=data.get('website')
                )
                db.session.add(new_gov_monitor)
                db.session.flush()

                new_user = User(
                    username=data['username'], 
                    role='government_monitor'
                )
                new_user.set_password(data['password'])
                db.session.add(new_user)
                db.session.flush()
                
                new_gov_user = GovernmentMonitorUser(
                    user_id=new_user.id,
                    government_monitor_id=new_gov_monitor.id
                )
                db.session.add(new_gov_user)
                db.session.commit()

            return jsonify({"message": "User registered successfully!", "user_id": new_user.id}), 201

        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Username already exists!"}), 400
        except Exception as e:
            print(e)
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route('/login', methods=['POST'])
    def login():
        data = request.json
        user = User.query.filter_by(username=data['username']).first()

        if user and user.check_password(data['password']):
            return jsonify({"message": "Login successful!", "user_id": user.id, "role": user.role}), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

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
                panchayat = Panchayat.query.filter_by(name=data['panchayat']).first()
                if not panchayat:
                    return jsonify({"error": "Invalid Panchayat name!"}), 400
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
                new_citizen_lives_in = citizen_lives_in_panchayat.insert().values(
                    citizen_id = new_citizen.id,
                    panchayat_id = panchayat.id
                )
                db.session.execute(new_citizen_lives_in)
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


def agricult_routes(app):
    @app.route('/fetch_agriculture_data', methods=['GET'])
    def fetch_agriculture_data():
        try:
            data = AgriculturalData.query.all()
            # for each record in data, fetch the name of the citizen from the Citizen table by citizen id
            # and add it to the dictionary
            for record in data:
                citizen = Citizen.query.get(record.citizen_id)
                if citizen:
                    record.citizen_name = citizen.name
                else:
                    record.citizen_name = None

            # Convert each record to a dictionary
            data_list = [
                {
                    'id': record.id,
                    'area_in_hectares': float(record.area_in_hectares) if record.area_in_hectares is not None else None,
                    'crops_grown': record.crops_grown,
                    'citizen_id': record.citizen_id,
                    'citizen_name': record.citizen_name,
                    'address': record.address
                }
                for record in data
            ]
            # print(data_list)
            return jsonify(data_list), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500
        
#  id | address | income | expenditure | environmental_data 


def panchayat_routes(app):
    @app.route('/fetch_panchayat_data', methods=['GET'])
    def fetch_panchayat_data():
        try:
            data = Panchayat.query.all()

            data_list = [
                {
                    'id': record.id,
                    'name': record.name,
                    'address': record.address,
                    'income': record.income,
                    'expenditure': record.expenditure,
                    'environmental_data': record.environmental_data
                }
                for record in data
            ]
            return jsonify(data_list), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500
        
    @app.route('/add_panchayat_data', methods=['POST'])
    def add_panchayat_data():
        data = request.json
        try:
            print(data)
            new_panchayat = Panchayat(
                address=data['address'],
                income=data['income'],
                expenditure=data['expenditure'],
                environmental_data=data['environmental_data']
            )
            db.session.add(new_panchayat)
            db.session.commit()
            print("Panchayat data added successfully!")
            # Convert the new_panchayat object to a dict inline
            new_panchayat_data = {
                'id': new_panchayat.id,
                'address': new_panchayat.address,
                'income': float(new_panchayat.income) if new_panchayat.income is not None else None,
                'expenditure': float(new_panchayat.expenditure) if new_panchayat.expenditure is not None else None,
                'environmental_data': new_panchayat.environmental_data
            }
            return jsonify({"message": "Panchayat data added successfully!", "data": new_panchayat_data}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500


def citizen_routes(app):
    @app.route('/fetch_citizen_data', methods=['GET'])
    def fetch_citizen_data():
        try:
            data = Citizen.query.all()

            data_list = [
                {
                    'id': record.id,
                    'name': record.name,
                    'date_of_birth': record.date_of_birth,
                    'sex': record.sex,
                    'occupation': record.occupation,
                    'qualification': record.qualification,
                    'address': record.address,
                    'phone_number': record.phone_number,
                    'income': record.income 
                }
                for record in data
            ]
            return jsonify(data_list), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500
        
def panchayat_member_routes(app):
    @app.route('/add_citizen_panchayat', methods=['POST'])
    def add_citizen_panchayat():
        data = request.json
        try:
            citizen_id = data['citizen_id']
            panchayat_id = data['panchayat_id']
            role = data.get('role')  # Optional field
            
            # Create an insert statement for the association table
            stmt = citizen_panchayat.insert().values(
                citizen_id=citizen_id,
                panchayat_id=panchayat_id,
                role=role
            )
            db.session.execute(stmt)
            db.session.commit()
            
            return jsonify({"message": "Citizen Panchayat relation added successfully!"}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
            
    @app.route('/fetch_panchayat_members', methods=['GET'])
    def fetch_panchayat_members():
        try:
            # Query the association table
            result = db.session.query(citizen_panchayat).all()
            
            # Convert result to list of dictionaries
            members_list = [
                {
                    'citizen_id': member.citizen_id,
                    'panchayat_id': member.panchayat_id,
                    'role': member.role
                }
                for member in result
            ]
            
            return jsonify(members_list), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500
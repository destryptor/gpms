import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from flask import request, jsonify
from sqlalchemy.exc import IntegrityError
from database.dbInit import db
from database.classes import *
from sqlalchemy import text
from sqlalchemy.orm import aliased
import datetime


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
            result = (
                db.session.query(AgriculturalData, Citizen, Panchayat)
                .join(Citizen, AgriculturalData.citizen_id == Citizen.id)
                .join(citizen_lives_in_panchayat, Citizen.id == citizen_lives_in_panchayat.c.citizen_id)
                .join(Panchayat, Panchayat.id == citizen_lives_in_panchayat.c.panchayat_id)
                .all()
            )
            data_list = [
                {
                    'agriculture_id': agri.id,
                    'citizen_id': citizen.id,
                    'citizen_name': citizen.name,
                    'area_in_hectares': float(agri.area_in_hectares) if agri.area_in_hectares is not None else None,
                    'crops_grown': agri.crops_grown,
                    'address': agri.address,
                    'panchayat_id': panchayat.id,
                    'panchayat_name': panchayat.name
                }
                for agri, citizen, panchayat in result
            ]
            
            print(data_list)

            return jsonify(data_list), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500
        
    @app.route('/fetch_agriculture_by_panchayat_name/<string:panchayat_name>', methods=['GET'])
    def fetch_agriculture_by_panchayat_name(panchayat_name):
        try:
            panchayat = Panchayat.query.filter_by(name=panchayat_name).first()

            if not panchayat:
                return jsonify({"error": "Panchayat not found"}), 404

            result = (
                db.session.query(AgriculturalData, Citizen, Panchayat)
                .join(Citizen, AgriculturalData.citizen_id == Citizen.id)
                .join(citizen_lives_in_panchayat, Citizen.id == citizen_lives_in_panchayat.c.citizen_id)
                .join(Panchayat, Panchayat.id == citizen_lives_in_panchayat.c.panchayat_id)
                .filter(Panchayat.id == panchayat.id) 
                .all()
            )

            data_list = [
                {
                    'agriculture_id': agri.id,
                    'citizen_id': citizen.id,
                    'citizen_name': citizen.name,
                    'area_in_hectares': float(agri.area_in_hectares) if agri.area_in_hectares is not None else None,
                    'crops_grown': agri.crops_grown,
                    'address': agri.address,
                    'panchayat_id': panchayat.id,
                    'panchayat_name': panchayat.name
                }
                for agri, citizen, panchayat in result
            ]

            return jsonify(data_list), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500
        
#  id | address | income | expenditure | environmental_data 

    @app.route('/fetch_citizen_data_for_agriculture', methods=['GET'])
    def fetch_citizen_data_for_agri():
        try:
            citizens = Citizen.query.all()
            data_list = [{'id': citizen.id, 'name': citizen.name} for citizen in citizens]
            return jsonify(data_list), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/add_agriculture_data', methods=['POST'])
    def add_agriculture_data():
        try:
            data = request.get_json()
            new_record = AgriculturalData(
                area_in_hectares=data.get('area_in_hectares'),
                crops_grown=data.get('crops_grown'),
                citizen_id=data.get('citizen_id'),
                address=data.get('address')
            )
            db.session.add(new_record)
            db.session.commit()
            return jsonify({'message': 'Record added successfully'}), 201
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/update_agriculture_data', methods=['POST'])
    def update_agriculture_data():
        try:
            data = request.get_json()
            record = AgriculturalData.query.get(data.get('id'))
            if not record:
                return jsonify({'error': 'Record not found'}), 404

            record.area_in_hectares = data.get('area_in_hectares')
            record.crops_grown = data.get('crops_grown')
            record.citizen_id = data.get('citizen_id')
            record.address = data.get('address')
            db.session.commit()
            return jsonify({'message': 'Record updated successfully'}), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/delete_agriculture_data/<int:id>', methods=['DELETE'])
    def delete_agriculture_data(id):
        try:
            record = AgriculturalData.query.get(id)
            if not record:
                return jsonify({'error': 'Record not found'}), 404
            db.session.delete(record)
            db.session.commit()
            return jsonify({'message': 'Record deleted successfully'}), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500


def panchayat_routes(app):
    @app.route('/add_panchayat_data', methods=['POST'])
    def add_panchayat_data():
        data = request.get_json()  # Using get_json() to properly parse the incoming JSON data
        try:
            print("Received data:", data)
            # Create a new Panchayat record using the nested address and environmental_data directly
            new_panchayat = Panchayat(
                name=data.get('name'),  # Assuming you have a 'name' field
                address=data.get('address'),  # expecting a dict with village, street, district, state, pincode
                income=float(data.get('income')),  # convert to float if necessary
                expenditure=float(data.get('expenditure')),  # convert to float if necessary
                environmental_data=data.get('environmental_data')  # expecting a dict
            )
            db.session.add(new_panchayat)
            db.session.commit()
            print("Panchayat data added successfully!")
            
            # Prepare the response data ensuring the same structure as expected by React
            new_panchayat_data = {
                'id': new_panchayat.id,
                'name': new_panchayat.name,
                'address': new_panchayat.address,
                'income': new_panchayat.income,
                'expenditure': new_panchayat.expenditure,
                'environmental_data': new_panchayat.environmental_data
            }
            return jsonify({"message": "Panchayat data added successfully!", "data": new_panchayat_data}), 201
        except Exception as e:
            db.session.rollback()
            print("Error:", str(e))
            return jsonify({"error": str(e)}), 500

    @app.route('/fetch_panchayat_data', methods=['GET'])
    def fetch_panchayat_data():
        try:
            panchayats = Panchayat.query.all()
            panchayat_list = []
            for p in panchayats:
                panchayat_list.append({
                    'id': p.id,
                    'name': p.name,  # Assuming you have a 'name'
                    'address': p.address,  # address should be a dict with keys: village, street, district, state, pincode
                    'income': p.income,
                    'expenditure': p.expenditure,
                    'environmental_data': p.environmental_data  # expecting a dict of environmental data
                })
            return jsonify(panchayat_list), 200
        except Exception as e:
            print("Error:", str(e))
            return jsonify({"error": str(e)}), 500

    @app.route('/update_panchayat_data/<int:id>', methods=['PUT'])
    def update_panchayat_data(id):
        data = request.get_json()
        try:
            panchayat = Panchayat.query.get(id)
            if not panchayat:
                return jsonify({"error": "Panchayat not found!"}), 404

            # Update fields with new data or fallback to the existing value
            panchayat.name = data.get('name', panchayat.name)
            panchayat.address = data.get('address', panchayat.address)
            panchayat.income = float(data.get('income', panchayat.income))
            panchayat.expenditure = float(data.get('expenditure', panchayat.expenditure))
            panchayat.environmental_data = data.get('environmental_data', panchayat.environmental_data)
            
            db.session.commit()

            updated_data = {
                'id': panchayat.id,
                'name': panchayat.name,
                'address': panchayat.address,
                'income': panchayat.income,
                'expenditure': panchayat.expenditure,
                'environmental_data': panchayat.environmental_data
            }
            return jsonify({"message": "Panchayat data updated successfully!", "data": updated_data}), 200
        except Exception as e:
            db.session.rollback()
            print("Error:", str(e))
            return jsonify({"error": str(e)}), 500

    @app.route('/delete_panchayat_data/<int:id>', methods=['DELETE'])
    def delete_panchayat_data(id):
        try:
            panchayat = Panchayat.query.get(id)
            if not panchayat:
                return jsonify({"error": "Panchayat not found!"}), 404

            db.session.delete(panchayat)
            db.session.commit()
            return jsonify({"message": "Panchayat data deleted successfully!"}), 200
        except Exception as e:
            db.session.rollback()
            print("Error:", str(e))
            return jsonify({"error": str(e)}), 500


def citizen_routes(app):
    @app.route('/fetch_citizen_data', methods=['GET'])
    def fetch_citizen_data():
        try:
            # Join Citizen, citizen_lives_in_panchayat, and Panchayat to fetch required fields
            results = db.session.query(
                Citizen,
                Panchayat.name.label('panchayat_name'),
                Panchayat.id.label('panchayat_id')  # Add panchayat ID to the query
            ).join(
                citizen_lives_in_panchayat, Citizen.id == citizen_lives_in_panchayat.c.citizen_id
            ).join(
                Panchayat, Panchayat.id == citizen_lives_in_panchayat.c.panchayat_id
            ).all()

            data_list = []
            for citizen, panchayat_name, panchayat_id in results:  # Add panchayat_id to unpacking
                data_list.append({
                    'id': citizen.id,
                    'name': citizen.name,
                    'date_of_birth': citizen.date_of_birth,
                    'sex': citizen.sex,
                    'occupation': citizen.occupation,
                    'qualification': citizen.qualification,
                    'address': citizen.address,
                    'phone_number': citizen.phone_number,
                    'income': citizen.income,
                    'panchayat_name': panchayat_name,
                    'panchayat_id': panchayat_id  # Add panchayat_id to the response
                })
            return jsonify(data_list), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/add_citizen_data', methods=['POST'])
    def add_citizen_data():
        data = request.get_json()  # Parse the incoming JSON data
        try:
            # Create a new Citizen record using the provided data
            new_citizen = Citizen(
                name=data.get('name'),
                date_of_birth=data.get('date_of_birth'),
                sex=data.get('sex'),
                occupation=data.get('occupation'),
                qualification=data.get('qualification'),
                address=data.get('address'),
                phone_number=data.get('phone_number'),
                income=data.get('income')
            )
            db.session.add(new_citizen)
            db.session.commit()

            new_citizen_data = {
                'id': new_citizen.id,
                'name': new_citizen.name,
                'date_of_birth': new_citizen.date_of_birth,
                'sex': new_citizen.sex,
                'occupation': new_citizen.occupation,
                'qualification': new_citizen.qualification,
                'address': new_citizen.address,
                'phone_number': new_citizen.phone_number,
                'income': new_citizen.income
            }
            return jsonify({"message": "Citizen data added successfully!", "data": new_citizen_data}), 201
        except Exception as e:
            db.session.rollback()
            print("Error:", str(e))
            return jsonify({"error": str(e)}), 500

    @app.route('/update_citizen_data/<int:id>', methods=['PUT'])
    def update_citizen_data(id):
        data = request.get_json()  # Parse the incoming JSON data
        try:
            citizen = Citizen.query.get(id)
            if not citizen:
                return jsonify({"error": "Citizen not found!"}), 404

            # Update fields using new data if provided, otherwise keep the existing value
            citizen.name = data.get('name', citizen.name)
            citizen.date_of_birth = data.get('date_of_birth', citizen.date_of_birth)
            citizen.sex = data.get('sex', citizen.sex)
            citizen.occupation = data.get('occupation', citizen.occupation)
            citizen.qualification = data.get('qualification', citizen.qualification)
            citizen.address = data.get('address', citizen.address)
            citizen.phone_number = data.get('phone_number', citizen.phone_number)
            citizen.income = data.get('income', citizen.income)

            db.session.commit()

            updated_data = {
                'id': citizen.id,
                'name': citizen.name,
                'date_of_birth': citizen.date_of_birth,
                'sex': citizen.sex,
                'occupation': citizen.occupation,
                'qualification': citizen.qualification,
                'address': citizen.address,
                'phone_number': citizen.phone_number,
                'income': citizen.income
            }
            return jsonify({"message": "Citizen data updated successfully!", "data": updated_data}), 200
        except Exception as e:
            db.session.rollback()
            print("Error:", str(e))
            return jsonify({"error": str(e)}), 500

    @app.route('/delete_citizen_data/<int:id>', methods=['DELETE'])
    def delete_citizen_data(id):
        try:
            citizen = Citizen.query.get(id)
            if not citizen:
                return jsonify({"error": "Citizen not found!"}), 404

            db.session.delete(citizen)
            db.session.commit()
            return jsonify({"message": "Citizen data deleted successfully!"}), 200
        except Exception as e:
            db.session.rollback()
            print("Error:", str(e))
            return jsonify({"error": str(e)}), 500
        
def panchayat_member_routes(app):
    @app.route('/add_citizen_panchayat', methods=['POST'])
    def add_citizen_panchayat():
        data = request.json
        try:
            citizen_id = data['citizen_id']
            panchayat_id = data['panchayat_id']
            role = data.get('role')  # Optional field
            
            # Check if citizen exists
            citizen = db.session.query(Citizen).filter_by(id=citizen_id).first()
            if not citizen:
                return jsonify({"error": "Citizen does not exist"}), 404
                
            # Check if panchayat exists
            panchayat = db.session.query(Panchayat).filter_by(id=panchayat_id).first()
            if not panchayat:
                return jsonify({"error": "Panchayat does not exist"}), 404
            
            # Check if citizen is already a member of any panchayat
            existing_member = db.session.query(citizen_panchayat).filter_by(citizen_id=citizen_id).first()
            if existing_member:
                return jsonify({"error": "Citizen is already a member of a panchayat"}), 400
            
            # Create an insert statement for the association table
            stmt = citizen_panchayat.insert().values(
                citizen_id=citizen_id,
                panchayat_id=panchayat_id,
                role=role
            )
            db.session.execute(stmt)
            db.session.commit()
            
            return jsonify({"message": "Citizen added to panchayat successfully!"}), 201
        except IntegrityError as e:
            db.session.rollback()
            return jsonify({"error": "Database integrity error. Citizen or panchayat may not exist, or citizen is already a member."}), 400
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
   
    @app.route('/update_citizen_panchayat', methods=['PUT'])
    def update_citizen_panchayat():
        data = request.json
        try:
            original_citizen_id = data['original_citizen_id']
            panchayat_id = data['panchayat_id']
            role = data.get('role')
            
            # Check if the relationship exists
            member = db.session.query(citizen_panchayat).filter_by(citizen_id=original_citizen_id).first()
            if not member:
                return jsonify({"error": f"No panchayat membership found for citizen ID {original_citizen_id}"}), 404
            
            # Check if panchayat exists
            panchayat = db.session.query(Panchayat).filter_by(id=panchayat_id).first()
            if not panchayat:
                return jsonify({"error": "Panchayat does not exist"}), 404
                
            # Update the relationship
            db.session.execute(
                citizen_panchayat.update()
                .where(citizen_panchayat.c.citizen_id == original_citizen_id)
                .values(panchayat_id=panchayat_id, role=role)
            )
            db.session.commit()
            
            return jsonify({"message": "Panchayat member updated successfully!"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    @app.route('/delete_citizen_panchayat/<int:citizen_id>', methods=['DELETE'])
    def delete_citizen_panchayat(citizen_id):
        try:
            # Check if the relationship exists
            member = db.session.query(citizen_panchayat).filter_by(citizen_id=citizen_id).first()
            if not member:
                return jsonify({"error": f"No panchayat membership found for citizen ID {citizen_id}"}), 404
            
            # Delete the relationship
            db.session.execute(
                citizen_panchayat.delete().where(citizen_panchayat.c.citizen_id == citizen_id)
            )
            db.session.commit()
            
            return jsonify({"message": "Panchayat member removed successfully!"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    @app.route('/fetch_panchayat_members_by_panchayat/<int:panchayat_id>', methods=['GET'])
    def fetch_panchayat_members_by_panchayat(panchayat_id):
        try:
            # Check if panchayat exists
            panchayat = db.session.query(Panchayat).filter_by(id=panchayat_id).first()
            if not panchayat:
                return jsonify({"error": "Panchayat does not exist"}), 404
                
            # Query the association table for specific panchayat
            result = db.session.query(citizen_panchayat).filter_by(panchayat_id=panchayat_id).all()
            
            # Convert result to list of dictionaries
            members_list = [
                {
                    'citizen_id': member.citizen_id,
                    'panchayat_id': member.panchayat_id,
                    'role': member.role
                }
                for member in result
            ]
            
            # Optionally, enrich with citizen data
            enriched_list = []
            for member in members_list:
                citizen = db.session.query(Citizen).filter_by(id=member['citizen_id']).first()
                if citizen:
                    enriched_list.append({
                        **member,
                        'citizen_name': citizen.name,
                        'citizen_phone': citizen.phone_number
                    })
                else:
                    enriched_list.append(member)
            
            return jsonify(enriched_list), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500
            
    @app.route('/fetch_member_by_citizen/<int:citizen_id>', methods=['GET'])
    def fetch_member_by_citizen(citizen_id):
        try:
            # Check if citizen exists
            citizen = db.session.query(Citizen).filter_by(id=citizen_id).first()
            if not citizen:
                return jsonify({"error": "Citizen does not exist"}), 404
                
            # Query the association table for specific citizen
            member = db.session.query(citizen_panchayat).filter_by(citizen_id=citizen_id).first()
            
            if not member:
                return jsonify({"error": "Citizen is not a member of any panchayat"}), 404
                
            # Get panchayat details
            panchayat = db.session.query(Panchayat).filter_by(id=member.panchayat_id).first()
            
            result = {
                'citizen_id': member.citizen_id,
                'panchayat_id': member.panchayat_id,
                'role': member.role,
                'citizen_name': citizen.name,
                'panchayat_name': panchayat.name if panchayat else "Unknown"
            }
            
            return jsonify(result), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500
    
    @app.route('/fetch_panchayat_by_member/<int:citizen_id>', methods=['GET'])
    def fetch_panchayat_by_member(citizen_id):
        try:
            
            # Query the association table for specific citizen
            member = db.session.query(citizen_panchayat).filter_by(citizen_id=citizen_id).first()
            
            if not member:
                return jsonify({"error": "Citizen is not a member of any panchayat"}), 404
                
            # Get panchayat details
            panchayat = db.session.query(Panchayat).filter_by(id=member.panchayat_id).first()
            
            result = {
                'citizen_id': member.citizen_id,
                'panchayat_id': member.panchayat_id,
                'role': member.role,
                'panchayat_name': panchayat.name if panchayat else "Unknown"
            }
            
            return jsonify(result), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500
        
def user_routes(app):
    @app.route('/add_user', methods=['POST'])
    def user_add_user():
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

    @app.route('/fetch_users', methods=['GET'])
    def fetch_users():
        users = User.query.all()
        user_list = [{'id': user.id, 'username': user.username, 'role': user.role} for user in users]
        return jsonify(user_list), 200
    
    @app.route('/update_user/<int:id>', methods=['PUT'])
    def update_user(id):
        data = request.json
        user = User.query.get(id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        try:
            user.username = data.get('username', user.username)
            user.role = data.get('role', user.role)
            db.session.commit()
            
            updated_user = {
                'id': user.id,
                'username': user.username,
                'role': user.role
            }
            return jsonify({"message": "User updated", "data": updated_user}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
        
    @app.route('/delete_user/<int:id>', methods=['DELETE'])
    def delete_user(id):
        user = User.query.get(id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        try:
            db.session.delete(user)
            db.session.commit()
            return jsonify({"message": "User deleted successfully!", "data" : id}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500


def scheme_routes(app):

    @app.route('/fetch_schemes', methods=['GET'])
    def fetch_schemes():
        try:
            # Join Scheme with GovernmentMonitor to include government monitor details
            result = (
                db.session.query(Scheme, GovernmentMonitor)
                .join(GovernmentMonitor, Scheme.gov_id == GovernmentMonitor.id)
                .all()
            )
            schemes_list = [
                {
                    'scheme_id': sch.id,
                    'scheme_name': sch.name,
                    'scheme_description': sch.description,
                    'scheme_gov_id': sch.gov_id,
                    'government_monitor_id': gov.id,
                    'government_monitor_name': gov.name
                }
                for sch, gov in result
            ]
            return jsonify(schemes_list), 200
        except Exception as e:
            print("Error fetching schemes:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/add_scheme', methods=['POST'])
    def add_scheme():
        try:
            data = request.get_json()
            new_scheme = Scheme(
                name=data.get("scheme_name"),
                description=data.get("scheme_description"),
                gov_id=data.get("scheme_gov_id")
            )
            db.session.add(new_scheme)
            db.session.commit()

            gov = GovernmentMonitor.query.get(new_scheme.gov_id)
            scheme_data = {
                'scheme_id': new_scheme.id,
                'scheme_name': new_scheme.name,
                'scheme_description': new_scheme.description,
                'scheme_gov_id': new_scheme.gov_id,
                'government_monitor_id': gov.id if gov else None,
                'government_monitor_name': gov.name if gov else ""
            }
            return jsonify({'data': scheme_data}), 200
        except Exception as e:
            print("Error adding scheme:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/update_scheme/<int:id>', methods=['PUT'])
    def update_scheme(id):
        try:
            data = request.get_json()
            scheme = Scheme.query.get(id)
            if not scheme:
                return jsonify({'error': 'Scheme not found'}), 404

            scheme.name = data.get("scheme_name", scheme.name)
            scheme.description = data.get("scheme_description", scheme.description)
            scheme.gov_id = data.get("scheme_gov_id", scheme.gov_id)
            db.session.commit()

            gov = GovernmentMonitor.query.get(scheme.gov_id)
            scheme_data = {
                'scheme_id': scheme.id,
                'scheme_name': scheme.name,
                'scheme_description': scheme.description,
                'scheme_gov_id': scheme.gov_id,
                'government_monitor_id': gov.id if gov else None,
                'government_monitor_name': gov.name if gov else ""
            }
            return jsonify({'data': scheme_data}), 200
        except Exception as e:
            print("Error updating scheme:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/delete_scheme/<int:id>', methods=['DELETE'])
    def delete_scheme(id):
        try:
            scheme = Scheme.query.get(id)
            if not scheme:
                return jsonify({'error': 'Scheme not found'}), 404

            db.session.delete(scheme)
            db.session.commit()
            return jsonify({'message': 'Scheme deleted successfully'}), 200
        except Exception as e:
            print("Error deleting scheme:", e)
            return jsonify({'error': str(e)}), 500


def asset_routes(app):

    @app.route('/fetch_assets', methods=['GET'])
    def fetch_assets():
        try:
            result = (
                db.session.query(Asset, Panchayat)
                .join(Panchayat, Asset.panchayat_id == Panchayat.id)
                .all()
            )
            assets_list = [
                {
                    'asset_id': asset.id,
                    'asset_name': asset.name,
                    'asset_address': asset.address,  # Assumed to be a JSON object with keys like street, city, state
                    'asset_value': asset.value,
                    'asset_date': asset.acquisition_date.isoformat(),  # Convert date to string
                    'panchayat_id': panchayat.id,
                    'panchayat_name': panchayat.name
                }
                for asset, panchayat in result
            ]
            return jsonify(assets_list), 200
        except Exception as e:
            print("Error fetching assets:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/add_asset', methods=['POST'])
    def add_asset():
        try:
            data = request.get_json()
            # Parse the date if needed (assumes ISO format)
            # acq_date = datetime.fromisoformat(data.get("asset_date"))
            new_asset = Asset(
                name=data.get("asset_name"),
                address=data.get("asset_address"),
                value=data.get("asset_value"),
                acquisition_date=data.get("asset_date"),
                panchayat_id=data.get("panchayat_id")
            )
            db.session.add(new_asset)
            db.session.commit()
            panchayat = Panchayat.query.get(new_asset.panchayat_id)
            asset_data = {
                'asset_id': new_asset.id,
                'asset_name': new_asset.name,
                'asset_address': new_asset.address,
                'asset_value': new_asset.value,
                'asset_date': new_asset.acquisition_date.isoformat(),
                'panchayat_id': panchayat.id if panchayat else None,
                'panchayat_name': panchayat.name if panchayat else ""
            }
            return jsonify({'data': asset_data}), 200
        except Exception as e:
            print("Error adding asset:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/update_asset/<int:id>', methods=['PUT'])
    def update_asset(id):
        try:
            data = request.get_json()
            asset = Asset.query.get(id)
            if not asset:
                return jsonify({'error': 'Asset not found'}), 404

            asset.name = data.get("asset_name", asset.name)
            asset.address = data.get("asset_address", asset.address)
            asset.value = data.get("asset_value", asset.value)
            # Update acquisition_date if provided
            if data.get("asset_date"):
                asset.acquisition_date = data.get("asset_date")
            asset.panchayat_id = data.get("panchayat_id", asset.panchayat_id)
            db.session.commit()
            panchayat = Panchayat.query.get(asset.panchayat_id)
            asset_data = {
                'asset_id': asset.id,
                'asset_name': asset.name,
                'asset_address': asset.address,
                'asset_value': asset.value,
                'asset_date': asset.acquisition_date,
                'panchayat_id': panchayat.id if panchayat else None,
                'panchayat_name': panchayat.name if panchayat else ""
            }
            return jsonify({'data': asset_data}), 200
        except Exception as e:
            print("Error updating asset:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/delete_asset/<int:id>', methods=['DELETE'])
    def delete_asset(id):
        try:
            asset = Asset.query.get(id)
            if not asset:
                return jsonify({'error': 'Asset not found'}), 404

            db.session.delete(asset)
            db.session.commit()
            return jsonify({'message': 'Asset deleted successfully'}), 200
        except Exception as e:
            print("Error deleting asset:", e)
            return jsonify({'error': str(e)}), 500
        
        
def family_member_routes(app):
    @app.route('/fetch_family_member', methods=['GET'])
    def fetch_family_member_data():
        try:
            # Create explicit aliases for Citizen table
            citizen1 = aliased(Citizen)  # Represents the main citizen
            citizen2 = aliased(Citizen)  # Represents the family member

            # Query all family relationships
            result = db.session.query(
                family_member.c.citizen_id_first,
                citizen1.name.label('citizen_name'),
                family_member.c.citizen_id_second,
                citizen2.name.label('family_member_name'),
                family_member.c.relationship
            ).join(
                citizen1, family_member.c.citizen_id_first == citizen1.id
            ).join(
                citizen2, family_member.c.citizen_id_second == citizen2.id
            ).all()

            # Convert result to JSON
            data_list = [
                {
                    'citizen_id': row.citizen_id_first,
                    'citizen_name': row.citizen_name,
                    'family_member_id': row.citizen_id_second,
                    'family_member_name': row.family_member_name,
                    'relationship': row.relationship
                }
                for row in result
            ]

            return jsonify(data_list), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/fetch_citizens', methods=['GET'])
    def fetch_citizens():
        try:
            citizens = db.session.query(Citizen.id, Citizen.name).all()
            
            data_list = [
                {
                    'id': citizen.id,
                    'name': citizen.name
                }
                for citizen in citizens
            ]
            
            return jsonify(data_list), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/add_family_member', methods=['POST'])
    def add_family_member():
        try:
            data = request.json
            
            # Validate required fields
            if not all(key in data for key in ['citizen_id', 'family_member_id', 'relationship']):
                return jsonify({'error': 'Missing required fields'}), 400
            
            citizen_id = int(data['citizen_id'])
            family_member_id = int(data['family_member_id'])
            relationship = data['relationship']
            
            # Check if both citizens exist
            citizen = db.session.query(Citizen).get(citizen_id)
            family_member_citizen = db.session.query(Citizen).get(family_member_id)
            
            if not citizen or not family_member_citizen:
                return jsonify({'error': 'One or both citizens do not exist'}), 404
            
            # Check if relationship already exists
            existing = db.session.query(family_member).filter(
                family_member.c.citizen_id_first == citizen_id,
                family_member.c.citizen_id_second == family_member_id
            ).first()
            
            if existing:
                return jsonify({'error': 'This relationship already exists'}), 400
            
            # Insert the new relationship
            stmt = family_member.insert().values(
                citizen_id_first=citizen_id,
                citizen_id_second=family_member_id,
                relationship=relationship
            )
            db.session.execute(stmt)
            
            # Create reverse relationship (if not already exists)
            # Define mapping of reverse relationships
            reverse_relationships = {
                'Spouse': 'Spouse',
                'Parent': 'Child',
                'Child': 'Parent',
                'Sibling': 'Sibling',
                'Grandparent': 'Grandchild',
                'Grandchild': 'Grandparent',
                'In-law': 'In-law',
                'Other': 'Other'
            }
            
            reverse_relationship = reverse_relationships.get(relationship, 'Related')
            
            # Check if reverse relationship exists
            existing_reverse = db.session.query(family_member).filter(
                family_member.c.citizen_id_first == family_member_id,
                family_member.c.citizen_id_second == citizen_id
            ).first()
            
            if not existing_reverse:
                reverse_stmt = family_member.insert().values(
                    citizen_id_first=family_member_id,
                    citizen_id_second=citizen_id,
                    relationship=reverse_relationship
                )
                db.session.execute(reverse_stmt)
            
            db.session.commit()
            
            # Return the created relationship
            response_data = {
                'citizen_id': citizen_id,
                'citizen_name': citizen.name,
                'family_member_id': family_member_id,
                'family_member_name': family_member_citizen.name,
                'relationship': relationship
            }
            
            return jsonify({'data': response_data, 'message': 'Family relationship added successfully'}), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/update_family_member', methods=['PUT'])
    def update_family_member():
        try:
            data = request.json
            
            # Validate required fields
            if not all(key in data for key in ['citizen_id', 'family_member_id', 'relationship']):
                return jsonify({'error': 'Missing required fields'}), 400
            
            citizen_id = int(data['citizen_id'])
            family_member_id = int(data['family_member_id'])
            relationship = data['relationship']
            
            # Check if both citizens exist
            citizen = db.session.query(Citizen).get(citizen_id)
            family_member_citizen = db.session.query(Citizen).get(family_member_id)
            
            if not citizen or not family_member_citizen:
                return jsonify({'error': 'One or both citizens do not exist'}), 404
            
            # Check if relationship exists
            existing = db.session.query(family_member).filter(
                family_member.c.citizen_id_first == citizen_id,
                family_member.c.citizen_id_second == family_member_id
            ).first()
            
            if not existing:
                return jsonify({'error': 'This relationship does not exist'}), 404
            
            # Update the relationship
            stmt = family_member.update().where(
                family_member.c.citizen_id_first == citizen_id,
                family_member.c.citizen_id_second == family_member_id
            ).values(relationship=relationship)
            
            db.session.execute(stmt)
            
            # Define mapping of reverse relationships
            reverse_relationships = {
                'Spouse': 'Spouse',
                'Parent': 'Child',
                'Child': 'Parent',
                'Sibling': 'Sibling',
                'Grandparent': 'Grandchild',
                'Grandchild': 'Grandparent',
                'In-law': 'In-law',
                'Other': 'Other'
            }
            
            reverse_relationship = reverse_relationships.get(relationship, 'Related')
            
            # Update the reverse relationship if it exists
            reverse_stmt = family_member.update().where(
                family_member.c.citizen_id_first == family_member_id,
                family_member.c.citizen_id_second == citizen_id
            ).values(relationship=reverse_relationship)
            
            db.session.execute(reverse_stmt)
            db.session.commit()
            
            # Return the updated relationship
            response_data = {
                'citizen_id': citizen_id,
                'citizen_name': citizen.name,
                'family_member_id': family_member_id,
                'family_member_name': family_member_citizen.name,
                'relationship': relationship
            }
            
            return jsonify({'data': response_data, 'message': 'Family relationship updated successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/delete_family_member', methods=['DELETE'])
    def delete_family_member():
        try:
            data = request.json
            
            # Validate required fields
            if not all(key in data for key in ['citizen_id', 'family_member_id']):
                return jsonify({'error': 'Missing required fields'}), 400
            
            citizen_id = int(data['citizen_id'])
            family_member_id = int(data['family_member_id'])
            
            # Delete the relationship
            stmt = family_member.delete().where(
                family_member.c.citizen_id_first == citizen_id,
                family_member.c.citizen_id_second == family_member_id
            )
            result = db.session.execute(stmt)
            
            # Also delete the reverse relationship
            reverse_stmt = family_member.delete().where(
                family_member.c.citizen_id_first == family_member_id,
                family_member.c.citizen_id_second == citizen_id
            )
            db.session.execute(reverse_stmt)
            
            db.session.commit()
            
            if result.rowcount == 0:
                return jsonify({'error': 'Family relationship not found'}), 404
                
            return jsonify({'message': 'Family relationship deleted successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/fetch_family_members_by_citizen/<int:citizen_id>', methods=['GET'])
    def fetch_family_members_by_citizen(citizen_id):
        try:
            # Fetch family members
            family_members = db.session.query(Citizen, family_member.c.relationship).join(
                family_member, Citizen.id == family_member.c.citizen_id_second
            ).filter(family_member.c.citizen_id_first == citizen_id).all()
            
            # Convert results to JSON
            data_list = [
                {
                    'citizen_id': citizen.id,
                    'citizen_name': citizen.name,
                    'relationship': relationship
                }
                for citizen, relationship in family_members
            ]
            
            return jsonify(data_list), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500
      
def tax_route(app):
    @app.route('/fetch_tax_data', methods=['GET'])
    def fetch_tax_data():
        try:
            tax_data = db.session.query(
                Tax, 
                GovernmentMonitor.name.label('monitoring_gov_name'), 
                Citizen.name.label('paying_citizen_name')
            ).join(
                GovernmentMonitor, Tax.monitoring_gov_id == GovernmentMonitor.id
            ).join(
                Citizen, Tax.paying_citizen_id == Citizen.id
            ).all()
            data_list = [
                {
                    'id': tax.id,
                    'name': tax.name,
                    'amount_in_percentage': tax.amount_in_percentage,
                    'tier': tax.tier,
                    'monitoring_gov_id': tax.monitoring_gov_id,
                    'monitoring_gov_name': monitoring_gov_name,
                    'paying_citizen_id': tax.paying_citizen_id,
                    'paying_citizen_name': paying_citizen_name
                }
                for tax, monitoring_gov_name, paying_citizen_name in tax_data
            ]
            return jsonify(data_list), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/add_tax_data', methods=['POST'])
    def add_tax_data():
        data = request.json
        try:
            new_tax = Tax(
                name=data.get('name'),
                amount_in_percentage=data.get('amount_in_percentage'),
                tier=data.get('tier'),
                monitoring_gov_id=data.get('monitoring_gov_id'),
                paying_citizen_id=data.get('paying_citizen_id')
            )
            db.session.add(new_tax)
            db.session.commit()
            return jsonify({
                'message': 'Tax record added successfully',
                'data': {
                    'id': new_tax.id,
                    'name': new_tax.name,
                    'amount_in_percentage': new_tax.amount_in_percentage,
                    'tier': new_tax.tier,
                    'monitoring_gov_id': new_tax.monitoring_gov_id,
                    'paying_citizen_id': new_tax.paying_citizen_id
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/update_tax_data/<int:id>', methods=['PUT'])
    def update_tax_data(id):
        data = request.json
        try:
            tax_record = Tax.query.get(id)
            if not tax_record:
                return jsonify({'error': 'Tax record not found'}), 404
            tax_record.name = data.get('name', tax_record.name)
            tax_record.amount_in_percentage = data.get('amount_in_percentage', tax_record.amount_in_percentage)
            tax_record.tier = data.get('tier', tax_record.tier)
            tax_record.monitoring_gov_id = data.get('monitoring_gov_id', tax_record.monitoring_gov_id)
            tax_record.paying_citizen_id = data.get('paying_citizen_id', tax_record.paying_citizen_id)
            db.session.commit()
            return jsonify({
                'message': 'Tax record updated successfully',
                'data': {
                    'id': tax_record.id,
                    'name': tax_record.name,
                    'amount_in_percentage': tax_record.amount_in_percentage,
                    'tier': tax_record.tier,
                    'monitoring_gov_id': tax_record.monitoring_gov_id,
                    'paying_citizen_id': tax_record.paying_citizen_id
                }
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/delete_tax_data/<int:id>', methods=['DELETE'])
    def delete_tax_data(id):
        try:
            tax_record = Tax.query.get(id)
            if not tax_record:
                return jsonify({'error': 'Tax record not found'}), 404
            db.session.delete(tax_record)
            db.session.commit()
            return jsonify({'message': 'Tax record deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500



def government_monitors_routes(app):
    @app.route('/fetch_government_monitors', methods=['GET'])
    def fetch_government_monitors():
        try:
            monitors = GovernmentMonitor.query.all()
            monitors_list = [
                {
                    'id': monitor.id,
                    'name': monitor.name,
                    'type': monitor.type,
                    'contact': monitor.contact,
                    'website': monitor.website
                }
                for monitor in monitors
            ]
            return jsonify(monitors_list), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500


    @app.route('/add_government_monitor', methods=['POST'])
    def add_government_monitor():
        data = request.get_json()
        try:
            # Expecting "contact" as a list (the frontend converts comma-separated strings to lists)
            new_monitor = GovernmentMonitor(
                name=data.get('name'),
                type=data.get('type'),
                contact=data.get('contact'),
                website=data.get('website')
            )
            db.session.add(new_monitor)
            db.session.commit()
            return jsonify({
                'message': 'Government monitor added successfully',
                'data': {
                    'id': new_monitor.id,
                    'name': new_monitor.name,
                    'type': new_monitor.type,
                    'contact': new_monitor.contact,
                    'website': new_monitor.website
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


    @app.route('/update_government_monitor/<int:id>', methods=['PUT'])
    def update_government_monitor(id):
        data = request.get_json()
        try:
            monitor = GovernmentMonitor.query.get(id)
            if not monitor:
                return jsonify({'error': 'Government monitor not found'}), 404

            monitor.name = data.get('name', monitor.name)
            monitor.type = data.get('type', monitor.type)
            monitor.contact = data.get('contact', monitor.contact)
            monitor.website = data.get('website', monitor.website)
            db.session.commit()
            return jsonify({
                'message': 'Government monitor updated successfully',
                'data': {
                    'id': monitor.id,
                    'name': monitor.name,
                    'type': monitor.type,
                    'contact': monitor.contact,
                    'website': monitor.website
                }
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


    @app.route('/delete_government_monitor/<int:id>', methods=['DELETE'])
    def delete_government_monitor(id):
        try:
            monitor = GovernmentMonitor.query.get(id)
            if not monitor:
                return jsonify({'error': 'Government monitor not found'}), 404
            db.session.delete(monitor)
            db.session.commit()
            return jsonify({'message': 'Government monitor deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
        



def services_route(app):

    @app.route('/fetch_services', methods=['GET'])
    def fetch_services():
        try:
            # Join Service with Citizen and citizen_lives_in_panchayat to get citizen and panchayat details
            result = (
                db.session.query(Service, Citizen, Panchayat)
                .join(Citizen, Service.availing_citizen_id == Citizen.id)
                .join(citizen_lives_in_panchayat, Citizen.id == citizen_lives_in_panchayat.c.citizen_id)
                .join(Panchayat, Panchayat.id == citizen_lives_in_panchayat.c.panchayat_id)
                .all()
            )
            
            services_list = [
                {
                    'service_id': srv.id,
                    'service_name': srv.name,
                    'service_type': srv.type,
                    'service_issued_date': srv.issued_date.isoformat(),
                    'service_expiry_date': srv.expiry_date.isoformat() if srv.expiry_date else None,
                    'citizen_id': cit.id,
                    'citizen_name': cit.name,
                    'panchayat_id': panchayat.id,
                    'panchayat_name': panchayat.name
                }
                for srv, cit, panchayat in result
            ]
            return jsonify(services_list), 200
        except Exception as e:
            print("Error fetching services:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/add_service', methods=['POST'])
    def add_service():
        try:
            data = request.get_json()
            issued_date = data.get("service_issued_date")
            expiry_date = data.get("service_expiry_date") if data.get("service_expiry_date") else None

            new_service = Service(
                name=data.get("service_name"),
                type=data.get("service_type"),
                issued_date=issued_date,
                expiry_date=expiry_date,
                availing_citizen_id=data.get("availing_citizen_id")
            )
            db.session.add(new_service)
            db.session.commit()

            # Retrieve citizen details
            citizen = Citizen.query.get(new_service.availing_citizen_id)
            service_data = {
                'service_id': new_service.id,
                'service_name': new_service.name,
                'service_type': new_service.type,
                'service_issued_date': new_service.issued_date.isoformat(),
                'service_expiry_date': new_service.expiry_date.isoformat() if new_service.expiry_date else None,
                'citizen_id': citizen.id if citizen else None,
                'citizen_name': citizen.name if citizen else ""
            }
            return jsonify({'data': service_data}), 200
        except Exception as e:
            print("Error adding service:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/update_service/<int:id>', methods=['PUT'])
    def update_service(id):
        try:
            data = request.get_json()
            service = Service.query.get(id)
            if not service:
                return jsonify({'error': 'Service not found'}), 404

            service.name = data.get("service_name", service.name)
            service.type = data.get("service_type", service.type)
            if data.get("service_issued_date"):
                service.issued_date = data.get("service_issued_date")
            if data.get("service_expiry_date"):
                service.expiry_date = data.get("service_expiry_date")
            service.availing_citizen_id = data.get("availing_citizen_id", service.availing_citizen_id)
            db.session.commit()

            citizen = Citizen.query.get(service.availing_citizen_id)
            service_data = {
                'service_id': service.id,
                'service_name': service.name,
                'service_type': service.type,
                'service_issued_date': service.issued_date.isoformat(),
                'service_expiry_date': service.expiry_date.isoformat() if service.expiry_date else None,
                'citizen_id': citizen.id if citizen else None,
                'citizen_name': citizen.name if citizen else ""
            }
            return jsonify({'data': service_data}), 200
        except Exception as e:
            print("Error updating service:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/delete_service/<int:id>', methods=['DELETE'])
    def delete_service(id):
        try:
            service = Service.query.get(id)
            if not service:
                return jsonify({'error': 'Service not found'}), 404

            db.session.delete(service)
            db.session.commit()
            return jsonify({'message': 'Service deleted successfully'}), 200
        except Exception as e:
            print("Error deleting service:", e)
            return jsonify({'error': str(e)}), 500
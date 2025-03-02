import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from flask import request, jsonify
from sqlalchemy.exc import IntegrityError
from database.dbInit import db
from database.classes import *
from sqlalchemy import text
from sqlalchemy.orm import aliased


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
            # Attach citizen name for each record
            for record in data:
                citizen = Citizen.query.get(record.citizen_id)
                record.citizen_name = citizen.name if citizen else None

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
                Panchayat.name.label('panchayat_name')
            ).join(
                citizen_lives_in_panchayat, Citizen.id == citizen_lives_in_panchayat.c.citizen_id
            ).join(
                Panchayat, Panchayat.id == citizen_lives_in_panchayat.c.panchayat_id
            ).all()

            data_list = []
            for citizen, panchayat_name in results:
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
                    'panchayat_name': panchayat_name
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
            result = (
                db.session.query(Scheme, GovernmentMonitor)
                .join(GovernmentMonitor, Scheme.gov_id == GovernmentMonitor.id)
                .all()
            )

            schemes_list = [
                {
                    'scheme_id': sch.id,
                    'scheme_name': sch.name,
                    'scheme_gov_id': sch.gov_id,
                    'scheme_description': sch.description,
                    'government_monitor_id': gov.id,
                    'government_monitor_name': gov.name
                }
                for sch, gov in result
            ]

            return jsonify(schemes_list), 200

        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500

    
    @app.route('/fetch_schemes_benefit',methods=['GET'])
    def fetch_schemes_benefit():
        try:
            result = (
                    db.session.query(Scheme, Citizen)
                    .join(citizen_scheme, citizen_scheme.c.citizen_id == Citizen.id)  # First join between Citizen and citizen_scheme
                    .join(Scheme, Scheme.id == citizen_scheme.c.scheme_id)  # Second join between Scheme and citizen_scheme
                    .all()
                     )


            result_list = [
                {
                    'scheme_id': sch.id,
                    'scheme_name': sch.name,
                    'scheme_gov_id': sch.gov_id,
                    'scheme_description': sch.description,
                    'citizen_id': cit.id,
                    'citizen_name': cit.name
                }
                for sch, cit in result
            ]

            return jsonify(result_list), 200

        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500

def asset_routes(app):
    @app.route('/fetch_assets', methods=['GET'])
    def fetch_assets():
        try:
            result = db.session.query(Asset, Panchayat) \
                .join(Panchayat, Asset.panchayat_id == Panchayat.id) \
                .all()

            result_list = [
                {
                    'asset_id': asset.id,
                    'asset_name': asset.name,
                    'asset_address': asset.address,
                    'asset_value': asset.value,
                    'asset_date': asset.acquisition_date,
                    'panchayat_id': panch.id,
                    'panchayat_name': panch.name
                }
                for asset, panch in result
            ]

            return jsonify(result_list), 200
        except Exception as e:
            print("Error:", e)
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
        

def services_route(app):
    @app.route('/fetch_services', methods=['GET'])
    def fetch_services():
        try:
            result = db.session.query(Service, Citizen) \
                .join(Citizen, Service.availing_citizen_id == Citizen.id) \
                .all()

            result_list = [
                {
                    'service_id': service.id,
                    'service_name': service.name,
                    'service_type': service.type,
                    'service_issued_date': service.issued_date.isoformat() if service.issued_date else None,
                    'service_expiry_date': service.expiry_date.isoformat() if service.expiry_date else None,
                    'service_description': service.description,
                    'citizen_id': service.availing_citizen_id,
                    'citizen_name': cit.name
                }
                for service, cit in result
            ]

            return jsonify(result_list), 200
        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500

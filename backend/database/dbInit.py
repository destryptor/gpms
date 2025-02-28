from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from classes import *
from flask import request, jsonify


app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@localhost:5432/gpms'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  
db.init_app(app) 

def init_db():
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")

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

@app.route('/add_citizen', methods=['POST'])
def add_citizen():
    data = request.json
    try:
        new_citizen = Citizen(
            name=data['name'],
            date_of_birth=data['date_of_birth'],
            sex=data['sex'],
            occupation=data.get('occupation'),
            qualification=data.get('qualification'),
            address=data['address'],
            phone_number=data.get('phone_number'),
            income=data.get('income')
        )
        db.session.add(new_citizen)
        db.session.commit()
        new_citizen_user = CitizenUser(username=data['username'], password=data['password'], citizen_id=new_citizen.id)
        db.session.add(new_citizen_user)
        db.session.commit()

        return jsonify({"message": "Citizen added successfully!", "citizen_id": new_citizen.id, "user_id": new_citizen_user.id}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Username already exists!"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.drop_all()
        init_db()
        app.run(debug=True)

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from flask import Flask
from database.dbInit import init_app, init_db, test_connection
from src.routes import register_routes
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    
    init_app(app)
    
    register_routes(app)
    
    CORS(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    with app.app_context():
        init_db(app)
    
    if test_connection(app):
        app.run(debug=True)
    else:
        print("Application not started due to database connection failure.")
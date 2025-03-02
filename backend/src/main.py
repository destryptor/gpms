import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from flask import Flask
from database.dbInit import init_app, init_db, test_connection
from src.routes import register_routes, agricult_routes, panchayat_routes, citizen_routes, panchayat_member_routes,family_member_routes,scheme_routes,asset_routes, user_routes, tax_route, government_monitors_routes, services_route
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    
    init_app(app)
    
    register_routes(app)
    agricult_routes(app)
    panchayat_routes(app)
    citizen_routes(app)
    panchayat_member_routes(app)
    user_routes(app)
    family_member_routes(app)
    scheme_routes(app)
    asset_routes(app)
    tax_route(app)
    government_monitors_routes(app)
    services_route(app)
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
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Table, JSON, ARRAY
from sqlalchemy.orm import relationship, declarative_base
from werkzeug.security import generate_password_hash, check_password_hash
from database.dbInit import db

Base = declarative_base()

citizen_panchayat = Table(
    'citizen_member_of_panchayat', db.Model.metadata,
    Column('citizen_id', Integer, ForeignKey('citizen.id'), primary_key=True, unique=True),
    Column('panchayat_id', Integer, ForeignKey('panchayat.id'), primary_key=True),
    Column('role', String)
)

citizen_scheme = Table(
    'citizen_benefits_from_schemes', db.Model.metadata,
    Column('citizen_id', Integer, ForeignKey('citizen.id'), primary_key=True),
    Column('scheme_id', Integer, ForeignKey('scheme.id'), primary_key=True),
    Column('issued_at', Date, nullable=False)
)

family_member = Table(
    'family_member', db.Model.metadata,
    Column('citizen_id_first', Integer, ForeignKey('citizen.id'), primary_key=True),
    Column('citizen_id_second', Integer, ForeignKey('citizen.id'), primary_key=True),
    Column('relationship', String, nullable=False)
)

class User(db.Model):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, nullable=False, unique=True)
    role = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
class CitizenUser(db.Model):
    __tablename__ = 'citizen_user'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    citizen_id = Column(Integer, ForeignKey('citizen.id'), unique=True)
    user = relationship('User')
    citizen = relationship('Citizen', back_populates='user')

class GovernmentMonitorUser(db.Model):
    __tablename__ = 'government_monitor_user'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    government_monitor_id = Column(Integer, ForeignKey('government_monitor.id'), unique=True)
    user = relationship('User')
    government_monitor = relationship('GovernmentMonitor', back_populates='user')

class GovernmentMonitor(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String)
    contact = Column(ARRAY(String), nullable=False)
    website = Column(String)
    schemes = relationship('Scheme', back_populates='issued_by')
    monitoring_services = relationship('Service', foreign_keys='Service.monitoring_gov_id')
    issuing_services = relationship('Service', foreign_keys='Service.issuing_gov_id')
    monitoring_taxes = relationship('Tax', back_populates='monitor')
    user = relationship('GovernmentMonitorUser', back_populates='government_monitor', uselist=False)

class Scheme(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    gov_id = Column(Integer, ForeignKey('government_monitor.id'))
    issued_by = relationship('GovernmentMonitor', back_populates='schemes')
    beneficiaries = relationship('Citizen', secondary=citizen_scheme, back_populates='schemes')

class AgriculturalData(db.Model):
    id = Column(Integer, primary_key=True)
    area_in_hectares = Column(Integer, nullable=False)
    crops_grown = Column(ARRAY(String))
    citizen_id = Column(Integer, ForeignKey('citizen.id'))
    address = Column(JSON, nullable=False)

class Citizen(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    sex = Column(String, nullable=False)
    occupation = Column(String)
    qualification = Column(String)
    address = Column(JSON, nullable=False)
    phone_number = Column(ARRAY(String))
    income = Column(Integer)
    panchayats = relationship('Panchayat', secondary=citizen_panchayat, back_populates='members')
    schemes = relationship('Scheme', secondary=citizen_scheme, back_populates='beneficiaries')
    family_members = relationship('Citizen', secondary=family_member, primaryjoin=id==family_member.c.citizen_id_first, secondaryjoin=id==family_member.c.citizen_id_second, back_populates='family_members')
    agricultural_data = relationship('AgriculturalData', backref='owner')
    taxes = relationship('Tax', back_populates='payer')
    user = relationship('CitizenUser', back_populates='citizen', uselist=False)

class Panchayat(db.Model):
    id = Column(Integer, primary_key=True)
    address = Column(JSON, nullable=False)
    income = Column(Integer, nullable=False)
    expenditure = Column(Integer, nullable=False)
    environmental_data = Column(JSON)
    members = relationship('Citizen', secondary=citizen_panchayat, back_populates='panchayats')
    assets = relationship('Asset', backref='panchayat')
    services = relationship('Service', foreign_keys='Service.issuing_panchayat_id')

class Asset(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    address = Column(JSON, nullable=False)
    value = Column(Integer, nullable=False)
    acquisition_date = Column(Date, nullable=False)
    panchayat_id = Column(Integer, ForeignKey('panchayat.id'))

class Tax(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    amount_in_percentage = Column(Integer, nullable=False)
    tier = Column(String)
    monitoring_gov_id = Column(Integer, ForeignKey('government_monitor.id'))
    paying_citizen_id = Column(Integer, ForeignKey('citizen.id'))
    monitor = relationship('GovernmentMonitor', back_populates='monitoring_taxes')
    payer = relationship('Citizen', back_populates='taxes')

class Service(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String)
    issued_date = Column(Date, nullable=False)
    expiry_date = Column(Date)
    description = Column(String)
    monitoring_gov_id = Column(Integer, ForeignKey('government_monitor.id'))
    issuing_gov_id = Column(Integer, ForeignKey('government_monitor.id'))
    availing_citizen_id = Column(Integer, ForeignKey('citizen.id'))
    issuing_panchayat_id = Column(Integer, ForeignKey('panchayat.id'))

    monitor = relationship('GovernmentMonitor', foreign_keys=[monitoring_gov_id], overlaps="monitoring_services")
    issuer = relationship('GovernmentMonitor', foreign_keys=[issuing_gov_id], overlaps="issuing_services")
    availing_citizen = relationship('Citizen', backref='services')
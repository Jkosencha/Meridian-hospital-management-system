from datetime import datetime

from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone_number = db.Column(db.String(30))
    email = db.Column(db.String(120))
    gender = db.Column(db.String(20))
    age = db.Column(db.Integer)
    registration_date = db.Column(db.Date)

    appointments = db.relationship("Appointment", back_populates="patient")


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(20), nullable=False)
    specialty = db.Column(db.String(80))
    status = db.Column(db.String(20), nullable=False, default="Pending")

    patient = db.relationship("Patient", back_populates="appointments")
    triage = db.relationship("Triage", back_populates="appointment", uselist=False)
    prescriptions = db.relationship("Prescription", back_populates="appointment")


class Triage(db.Model):
    __tablename__ = "triage"

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), unique=True, nullable=False)
    blood_pressure = db.Column(db.String(20))
    temperature = db.Column(db.String(20))
    symptoms = db.Column(db.Text)
    notes = db.Column(db.Text)

    appointment = db.relationship("Appointment", back_populates="triage")


class Prescription(db.Model):
    __tablename__ = "prescriptions"

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=False)
    diagnosis = db.Column(db.String(255))
    notes = db.Column(db.Text)
    prescription = db.Column(db.Text)

    appointment = db.relationship("Appointment", back_populates="prescriptions")

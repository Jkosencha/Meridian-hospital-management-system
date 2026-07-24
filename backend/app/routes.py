from datetime import date

from flask import Blueprint, jsonify, request

from app import db
from app.models import Appointment, Patient

api = Blueprint("api", __name__, url_prefix="/api")


def parse_date(value):
    if not value:
        return None
    return date.fromisoformat(value)


def patient_to_dict(patient):
    return {
        "id": str(patient.id),
        "name": patient.name,
        "date": patient.registration_date.isoformat() if patient.registration_date else "",
        "gender": patient.gender,
        "contact": patient.phone_number,
        "age": patient.age,
    }


def has_conflicting_appointment(appt_date, time, specialty, exclude_id=None):
    query = Appointment.query.filter(
        Appointment.date == appt_date,
        Appointment.time == time,
        Appointment.specialty == specialty,
        Appointment.status != "Cancelled",
    )
    if exclude_id is not None:
        query = query.filter(Appointment.id != exclude_id)
    return query.first() is not None


def appointment_to_dict(appointment):
    patient = appointment.patient
    return {
        "id": str(appointment.id),
        "name": patient.name,
        "date": appointment.date.isoformat(),
        "time": appointment.time,
        "number": patient.phone_number,
        "gender": patient.gender,
        "age": patient.age,
        "specialty": appointment.specialty,
        "status": appointment.status,
    }


@api.get("/patients")
def list_patients():
    patients = Patient.query.order_by(Patient.id).all()
    return jsonify([patient_to_dict(p) for p in patients])


@api.post("/patients")
def create_patient():
    data = request.get_json() or {}
    patient = Patient(
        name=data.get("name"),
        phone_number=data.get("contact"),
        gender=data.get("gender"),
        age=data.get("age"),
        registration_date=parse_date(data.get("date")),
    )
    db.session.add(patient)
    db.session.commit()
    return jsonify(patient_to_dict(patient)), 201


@api.put("/patients/<int:patient_id>")
def update_patient(patient_id):
    patient = db.session.get(Patient, patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    data = request.get_json() or {}
    patient.name = data.get("name", patient.name)
    patient.phone_number = data.get("contact", patient.phone_number)
    patient.gender = data.get("gender", patient.gender)
    patient.age = data.get("age", patient.age)
    if "date" in data:
        patient.registration_date = parse_date(data.get("date"))
    db.session.commit()
    return jsonify(patient_to_dict(patient))


@api.get("/appointments")
def list_appointments():
    appointments = Appointment.query.order_by(Appointment.id).all()
    return jsonify([appointment_to_dict(a) for a in appointments])


@api.post("/appointments")
def create_appointment():
    data = request.get_json() or {}

    appt_date = parse_date(data.get("date"))
    if has_conflicting_appointment(appt_date, data.get("time"), data.get("specialty")):
        return jsonify(
            {"error": "This time slot is already booked for this specialty. Please choose a different time."}
        ), 409

    patient = Patient.query.filter(
        db.func.lower(Patient.name) == (data.get("name") or "").strip().lower(),
        Patient.phone_number == data.get("number"),
    ).first()
    if not patient:
        patient = Patient(
            name=data.get("name"),
            phone_number=data.get("number"),
            gender=data.get("gender"),
            age=data.get("age"),
            registration_date=date.today(),
        )
        db.session.add(patient)
        db.session.flush()
    else:
        patient.gender = data.get("gender", patient.gender)
        patient.age = data.get("age", patient.age)

    appointment = Appointment(
        patient_id=patient.id,
        date=appt_date,
        time=data.get("time"),
        specialty=data.get("specialty"),
        status="Pending",
    )
    db.session.add(appointment)
    db.session.commit()
    return jsonify(appointment_to_dict(appointment)), 201


@api.put("/appointments/<int:appointment_id>")
def update_appointment(appointment_id):
    appointment = db.session.get(Appointment, appointment_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    data = request.get_json() or {}

    new_date = parse_date(data.get("date")) if "date" in data else appointment.date
    new_time = data.get("time", appointment.time)
    new_specialty = data.get("specialty", appointment.specialty)
    if has_conflicting_appointment(new_date, new_time, new_specialty, exclude_id=appointment.id):
        return jsonify(
            {"error": "This time slot is already booked for this specialty. Please choose a different time."}
        ), 409

    patient = appointment.patient
    patient.name = data.get("name", patient.name)
    patient.phone_number = data.get("number", patient.phone_number)
    patient.gender = data.get("gender", patient.gender)
    patient.age = data.get("age", patient.age)

    appointment.date = new_date
    appointment.time = new_time
    appointment.specialty = new_specialty
    appointment.status = data.get("status", appointment.status)

    db.session.commit()
    return jsonify(appointment_to_dict(appointment))

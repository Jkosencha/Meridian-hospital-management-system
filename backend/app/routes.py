from datetime import date

from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from app import db
from app.auth import issue_token, require_auth, require_role
from app.models import Appointment, Billing, FeeRate, Patient, Prescription, Triage, User

api = Blueprint("api", __name__, url_prefix="/api")

VALID_ROLES = ["doctor", "receptionist", "nurse", "pharmacy", "admin"]

DEFAULT_FEE_RATES = [
    {"key": "General Practitioner", "label": "General Practitioner", "amount": 1500},
    {"key": "Cardiologist", "label": "Cardiologist", "amount": 3500},
    {"key": "Gynecologist", "label": "Gynecologist", "amount": 3000},
    {"key": "Dentist", "label": "Dentist", "amount": 2500},
    {"key": "Endocrinologist", "label": "Endocrinologist", "amount": 3200},
    {"key": "Pediatrician", "label": "Pediatrician", "amount": 2000},
    {"key": "__default__", "label": "Other specialty (default)", "amount": 1800},
    {"key": "__medication__", "label": "Medication (per prescription)", "amount": 800},
]


def ensure_fee_rates_seeded():
    if FeeRate.query.first():
        return
    for entry in DEFAULT_FEE_RATES:
        db.session.add(FeeRate(**entry))
    db.session.commit()


def get_fee_rate(key, fallback_key="__default__"):
    ensure_fee_rates_seeded()
    rate = FeeRate.query.filter_by(key=key).first()
    if rate:
        return rate.amount
    if fallback_key:
        fallback = FeeRate.query.filter_by(key=fallback_key).first()
        if fallback:
            return fallback.amount
    return 0


def user_to_dict(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


def parse_date(value):
    if not value:
        return None
    return date.fromisoformat(value)


def normalize_gender(value, fallback=None):
    if value is None:
        return fallback
    return "Female" if str(value).strip().lower() == "female" else "Male"


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


def triage_to_dict(triage):
    return {
        "bloodPressure": triage.blood_pressure,
        "temperature": triage.temperature,
        "symptoms": triage.symptoms,
        "notes": triage.notes,
    }


def prescription_to_dict(prescription):
    bill = prescription.billing
    return {
        "id": str(prescription.id),
        "diagnosis": prescription.diagnosis,
        "notes": prescription.notes,
        "prescription": prescription.prescription,
        "status": prescription.status,
        "billId": str(bill.id) if bill else None,
        "billAmount": bill.amount if bill else None,
        "billStatus": bill.status if bill else None,
    }


def prescription_full_to_dict(prescription):
    appointment = prescription.appointment
    patient = appointment.patient
    return {
        **prescription_to_dict(prescription),
        "appointmentId": str(appointment.id),
        "name": patient.name,
        "date": appointment.date.isoformat(),
        "specialty": appointment.specialty,
    }


def billing_to_dict(bill):
    if bill.source == "appointment":
        visit_appointment_id = bill.appointment_id
    elif bill.source == "medication" and bill.prescription:
        visit_appointment_id = bill.prescription.appointment_id
    else:
        visit_appointment_id = None
    return {
        "id": str(bill.id),
        "patientId": str(bill.patient_id),
        "patientName": bill.patient.name,
        "source": bill.source,
        "description": bill.description,
        "specialty": bill.specialty,
        "amount": bill.amount,
        "status": bill.status,
        "date": bill.created_at.isoformat(),
        "visitId": str(visit_appointment_id) if visit_appointment_id else None,
    }


def fee_rate_to_dict(rate):
    return {
        "id": str(rate.id),
        "key": rate.key,
        "label": rate.label,
        "amount": rate.amount,
    }


def bill_completed_appointment(appointment):
    if appointment.billing:
        return
    fee = get_fee_rate(appointment.specialty)
    db.session.add(
        Billing(
            patient_id=appointment.patient_id,
            appointment_id=appointment.id,
            source="appointment",
            description="Consultation",
            specialty=appointment.specialty,
            amount=fee,
            status="Pending",
            created_at=date.today(),
        )
    )


def bill_dispensed_prescription(prescription, amount_override=None):
    if prescription.billing:
        return
    appointment = prescription.appointment
    fee = amount_override if amount_override is not None else get_fee_rate("__medication__", fallback_key=None)
    db.session.add(
        Billing(
            patient_id=appointment.patient_id,
            prescription_id=prescription.id,
            source="medication",
            description="Medication",
            specialty=appointment.specialty,
            amount=fee,
            status="Pending",
            created_at=date.today(),
        )
    )


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
        "triage": triage_to_dict(appointment.triage) if appointment.triage else None,
        "prescriptions": [prescription_to_dict(p) for p in appointment.prescriptions],
    }


@api.post("/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user or not check_password_hash(user.password_hash, data.get("password") or ""):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({"token": issue_token(user), "user": user_to_dict(user)})


@api.get("/patients")
@require_auth
def list_patients():
    patients = Patient.query.order_by(Patient.id).all()
    return jsonify([patient_to_dict(p) for p in patients])


@api.post("/patients")
@require_auth
def create_patient():
    data = request.get_json() or {}
    patient = Patient(
        name=data.get("name"),
        phone_number=data.get("contact"),
        gender=normalize_gender(data.get("gender"), "Male"),
        age=data.get("age"),
        registration_date=parse_date(data.get("date")),
    )
    db.session.add(patient)
    db.session.commit()
    return jsonify(patient_to_dict(patient)), 201


@api.put("/patients/<int:patient_id>")
@require_auth
def update_patient(patient_id):
    patient = db.session.get(Patient, patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    data = request.get_json() or {}
    patient.name = data.get("name", patient.name)
    patient.phone_number = data.get("contact", patient.phone_number)
    patient.gender = normalize_gender(data.get("gender"), patient.gender)
    patient.age = data.get("age", patient.age)
    if "date" in data:
        patient.registration_date = parse_date(data.get("date"))
    db.session.commit()
    return jsonify(patient_to_dict(patient))


@api.delete("/patients/<int:patient_id>")
@require_auth
def delete_patient(patient_id):
    patient = db.session.get(Patient, patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    if Appointment.query.filter_by(patient_id=patient.id).first():
        return jsonify(
            {"error": "Cannot delete a patient with existing appointments. Delete their appointments first."}
        ), 409

    db.session.delete(patient)
    db.session.commit()
    return "", 204


@api.get("/appointments")
@require_auth
def list_appointments():
    appointments = Appointment.query.order_by(Appointment.id).all()
    return jsonify([appointment_to_dict(a) for a in appointments])


@api.post("/appointments")
def create_appointment():
    # Public: used by the anonymous landing-page booking form as well as
    # the authenticated receptionist dashboard.
    data = request.get_json() or {}

    appt_date = parse_date(data.get("date"))
    if has_conflicting_appointment(appt_date, data.get("time"), data.get("specialty")):
        return jsonify(
            {"error": "This time slot is already booked for this specialty. Please choose a different time."}
        ), 409

    patient_id = data.get("patientId")
    if patient_id:
        patient = db.session.get(Patient, patient_id)
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        patient.name = data.get("name", patient.name)
        patient.phone_number = data.get("number", patient.phone_number)
        patient.gender = normalize_gender(data.get("gender"), patient.gender)
        patient.age = data.get("age", patient.age)
    else:
        patient = Patient.query.filter(
            db.func.lower(Patient.name) == (data.get("name") or "").strip().lower(),
            Patient.phone_number == data.get("number"),
        ).first()
        if not patient:
            patient = Patient(
                name=data.get("name"),
                phone_number=data.get("number"),
                gender=normalize_gender(data.get("gender"), "Male"),
                age=data.get("age"),
                registration_date=date.today(),
            )
            db.session.add(patient)
            db.session.flush()
        else:
            patient.gender = normalize_gender(data.get("gender"), patient.gender)
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
@require_auth
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
    patient.gender = normalize_gender(data.get("gender"), patient.gender)
    patient.age = data.get("age", patient.age)

    appointment.date = new_date
    appointment.time = new_time
    appointment.specialty = new_specialty
    appointment.status = data.get("status", appointment.status)

    if appointment.status == "Completed":
        bill_completed_appointment(appointment)

    db.session.commit()
    return jsonify(appointment_to_dict(appointment))


@api.delete("/appointments/<int:appointment_id>")
@require_auth
def delete_appointment(appointment_id):
    appointment = db.session.get(Appointment, appointment_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    for prescription in appointment.prescriptions:
        if prescription.billing:
            db.session.delete(prescription.billing)
    Prescription.query.filter_by(appointment_id=appointment.id).delete()
    if appointment.triage:
        db.session.delete(appointment.triage)
    if appointment.billing:
        db.session.delete(appointment.billing)
    db.session.delete(appointment)
    db.session.commit()
    return "", 204


@api.post("/triage")
@require_auth
def save_triage():
    data = request.get_json() or {}
    appointment = db.session.get(Appointment, data.get("appointmentId"))
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    triage = appointment.triage
    if not triage:
        triage = Triage(appointment_id=appointment.id)
        db.session.add(triage)

    triage.blood_pressure = data.get("bloodPressure")
    triage.temperature = data.get("temperature")
    triage.symptoms = data.get("symptoms")
    triage.notes = data.get("notes")

    db.session.commit()
    return jsonify(appointment_to_dict(appointment)), 201


@api.get("/prescriptions")
@require_auth
def list_prescriptions():
    prescriptions = Prescription.query.order_by(Prescription.id).all()
    return jsonify([prescription_full_to_dict(p) for p in prescriptions])


@api.post("/prescriptions")
@require_auth
def create_prescription():
    data = request.get_json() or {}
    appointment = db.session.get(Appointment, data.get("appointmentId"))
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    prescription = Prescription(
        appointment_id=appointment.id,
        diagnosis=data.get("diagnosis"),
        notes=data.get("notes"),
        prescription=data.get("prescription"),
        status="Pending",
    )
    db.session.add(prescription)
    db.session.commit()
    return jsonify(prescription_full_to_dict(prescription)), 201


@api.put("/prescriptions/<int:prescription_id>")
@require_auth
def update_prescription(prescription_id):
    prescription = db.session.get(Prescription, prescription_id)
    if not prescription:
        return jsonify({"error": "Prescription not found"}), 404

    data = request.get_json() or {}
    prescription.diagnosis = data.get("diagnosis", prescription.diagnosis)
    prescription.notes = data.get("notes", prescription.notes)
    prescription.prescription = data.get("prescription", prescription.prescription)
    prescription.status = data.get("status", prescription.status)

    if prescription.status == "Dispensed":
        amount_override = None
        if "billAmount" in data:
            try:
                amount_override = float(data.get("billAmount"))
            except (TypeError, ValueError):
                return jsonify({"error": "Bill amount must be a number"}), 400
            if amount_override < 0:
                return jsonify({"error": "Bill amount cannot be negative"}), 400
        bill_dispensed_prescription(prescription, amount_override=amount_override)

    db.session.commit()
    return jsonify(prescription_full_to_dict(prescription))


@api.delete("/prescriptions/<int:prescription_id>")
@require_auth
def delete_prescription(prescription_id):
    prescription = db.session.get(Prescription, prescription_id)
    if not prescription:
        return jsonify({"error": "Prescription not found"}), 404

    if prescription.billing:
        db.session.delete(prescription.billing)
    db.session.delete(prescription)
    db.session.commit()
    return "", 204


@api.delete("/triage/<int:appointment_id>")
@require_auth
def delete_triage(appointment_id):
    appointment = db.session.get(Appointment, appointment_id)
    if not appointment or not appointment.triage:
        return jsonify({"error": "Triage record not found"}), 404

    db.session.delete(appointment.triage)
    db.session.commit()
    return "", 204


@api.get("/billing")
@require_auth
@require_role("admin", "receptionist")
def list_billing():
    bills = Billing.query.order_by(Billing.created_at, Billing.id).all()
    return jsonify([billing_to_dict(b) for b in bills])


@api.put("/billing/<int:billing_id>")
@require_auth
@require_role("admin", "pharmacy", "receptionist")
def update_billing(billing_id):
    bill = db.session.get(Billing, billing_id)
    if not bill:
        return jsonify({"error": "Billing record not found"}), 404

    if g.current_user.role == "pharmacy" and bill.source != "medication":
        return jsonify({"error": "You can only edit medication bills"}), 403
    if g.current_user.role == "receptionist" and bill.source != "appointment":
        return jsonify({"error": "You can only edit consultation bills"}), 403

    data = request.get_json() or {}
    status = data.get("status", bill.status)
    if status not in ("Pending", "Paid"):
        return jsonify({"error": "Invalid status"}), 400

    if "amount" in data:
        try:
            amount = float(data.get("amount"))
        except (TypeError, ValueError):
            return jsonify({"error": "Amount must be a number"}), 400
        if amount < 0:
            return jsonify({"error": "Amount cannot be negative"}), 400
        bill.amount = amount

    bill.status = status
    db.session.commit()
    return jsonify(billing_to_dict(bill))


SYSTEM_FEE_RATE_KEYS = {"__default__"}


@api.get("/fee-rates")
@require_auth
@require_role("admin", "pharmacy")
def list_fee_rates():
    ensure_fee_rates_seeded()
    rates = FeeRate.query.order_by(FeeRate.id).all()
    return jsonify([fee_rate_to_dict(r) for r in rates])


@api.post("/fee-rates")
@require_auth
@require_role("admin")
def create_fee_rate():
    ensure_fee_rates_seeded()
    data = request.get_json() or {}

    label = (data.get("label") or "").strip()
    if not label:
        return jsonify({"error": "Label is required"}), 400
    if FeeRate.query.filter_by(key=label).first():
        return jsonify({"error": "A billing rate with that name already exists"}), 409

    try:
        amount = float(data.get("amount"))
    except (TypeError, ValueError):
        return jsonify({"error": "Amount must be a number"}), 400
    if amount < 0:
        return jsonify({"error": "Amount cannot be negative"}), 400

    rate = FeeRate(key=label, label=label, amount=amount)
    db.session.add(rate)
    db.session.commit()
    return jsonify(fee_rate_to_dict(rate)), 201


@api.delete("/fee-rates/<int:rate_id>")
@require_auth
@require_role("admin")
def delete_fee_rate(rate_id):
    rate = db.session.get(FeeRate, rate_id)
    if not rate:
        return jsonify({"error": "Fee rate not found"}), 404
    if rate.key in SYSTEM_FEE_RATE_KEYS:
        return jsonify(
            {"error": "This billing rate is required for automatic billing and cannot be deleted"}
        ), 409

    db.session.delete(rate)
    db.session.commit()
    return "", 204


@api.put("/fee-rates/<int:rate_id>")
@require_auth
@require_role("admin")
def update_fee_rate(rate_id):
    rate = db.session.get(FeeRate, rate_id)
    if not rate:
        return jsonify({"error": "Fee rate not found"}), 404

    data = request.get_json() or {}
    try:
        amount = float(data.get("amount"))
    except (TypeError, ValueError):
        return jsonify({"error": "Amount must be a number"}), 400
    if amount < 0:
        return jsonify({"error": "Amount cannot be negative"}), 400

    rate.amount = amount
    db.session.commit()
    return jsonify(fee_rate_to_dict(rate))


@api.get("/users")
@require_auth
@require_role("admin")
def list_users():
    users = User.query.order_by(User.id).all()
    return jsonify([user_to_dict(u) for u in users])


@api.post("/users")
@require_auth
@require_role("admin")
def create_user():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role")

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if role not in VALID_ROLES:
        return jsonify({"error": "Invalid role"}), 400
    if User.query.filter(db.func.lower(User.email) == email).first():
        return jsonify({"error": "A user with that email already exists"}), 409

    user = User(name=name, email=email, password_hash=generate_password_hash(password), role=role)
    db.session.add(user)
    db.session.commit()
    return jsonify(user_to_dict(user)), 201


@api.put("/users/<int:user_id>")
@require_auth
@require_role("admin")
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    name = (data.get("name") or user.name).strip()
    email = (data.get("email") or user.email).strip().lower()
    role = data.get("role", user.role)

    if role not in VALID_ROLES:
        return jsonify({"error": "Invalid role"}), 400
    if user_id == g.current_user.id and role != user.role:
        return jsonify({"error": "You cannot change your own role while signed in."}), 409

    existing = User.query.filter(db.func.lower(User.email) == email, User.id != user.id).first()
    if existing:
        return jsonify({"error": "A user with that email already exists"}), 409

    password = data.get("password")
    if password:
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        user.password_hash = generate_password_hash(password)

    user.name = name
    user.email = email
    user.role = role
    db.session.commit()
    return jsonify(user_to_dict(user))


@api.delete("/users/<int:user_id>")
@require_auth
@require_role("admin")
def delete_user(user_id):
    if user_id == g.current_user.id:
        return jsonify({"error": "You cannot delete your own account while signed in."}), 409

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return "", 204

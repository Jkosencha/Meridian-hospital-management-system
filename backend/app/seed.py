from werkzeug.security import generate_password_hash

from app import db
from app.models import User

DEMO_USERS = [
    {"name": "Dr. Amara Owino", "email": "doctor@meridian.com", "password": "doctor123", "role": "doctor"},
    {"name": "Brian Kiptoo", "email": "reception@meridian.com", "password": "reception123", "role": "receptionist"},
    {"name": "Faith Wanjiru", "email": "nurse@meridian.com", "password": "nurse123", "role": "nurse"},
    {"name": "Samuel Otieno", "email": "pharmacy@meridian.com", "password": "pharmacy123", "role": "pharmacy"},
    {"name": "Grace Mutua", "email": "admin@meridian.com", "password": "admin123", "role": "admin"},
]


def seed_demo_users():
    created = 0
    for entry in DEMO_USERS:
        if User.query.filter_by(email=entry["email"]).first():
            continue
        user = User(
            name=entry["name"],
            email=entry["email"],
            password_hash=generate_password_hash(entry["password"]),
            role=entry["role"],
        )
        db.session.add(user)
        created += 1
    db.session.commit()
    return created


def register_seed_command(app):
    @app.cli.command("seed-users")
    def seed_users_command():
        """Seed the demo user accounts (matching src/data/demoUsers.js)."""
        created = seed_demo_users()
        print(f"Seeded {created} user(s); {len(DEMO_USERS) - created} already existed.")

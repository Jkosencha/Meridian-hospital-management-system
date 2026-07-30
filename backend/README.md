# Meridian Backend

Flask + SQLAlchemy REST API backing the Meridian frontend, with SQLite as the datastore and Alembic (via Flask-Migrate) for schema migrations.

## Setup

```bash
pip install --user pipenv   # if you don't already have it
cd backend
PIPENV_VENV_IN_PROJECT=1 pipenv install
pipenv run flask db upgrade
pipenv run flask seed-users   # creates the demo accounts; login won't work without this
pipenv run flask --app run.py run --port 5000
```

`PIPENV_VENV_IN_PROJECT=1` puts the virtualenv at `backend/.venv` instead of pipenv's default global location - keeps it next to the project like the old `venv/` did. Once installed once, you can drop that env var for future `pipenv install`/`pipenv run` calls in this folder; pipenv remembers.


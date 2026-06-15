"""
Database setup — SQLite for users, assessments, and audit trail.
Creates tables on first run. Data persists in esgverify.db file.
"""

import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), "esgverify.db")


def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dicts
    conn.execute("PRAGMA journal_mode=WAL")  # Better concurrent access
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            company_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            status TEXT DEFAULT 'in_progress',
            current_step INTEGER DEFAULT 1,
            company_data TEXT DEFAULT '{}',
            answers TEXT DEFAULT '{}',
            buyer_search TEXT DEFAULT '[]',
            buyer_summary TEXT DEFAULT '{}',
            questions TEXT DEFAULT '[]',
            verification_checks TEXT DEFAULT '[]',
            kpis TEXT DEFAULT '[]',
            fuzzy_data TEXT DEFAULT '{}',
            gap_analysis TEXT DEFAULT '{}',
            suggestions TEXT DEFAULT '{}',
            overall_score REAL DEFAULT 0,
            greenwash_risk REAL DEFAULT 0,
            data_confidence REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assessment_id INTEGER REFERENCES assessments(id),
            user_id INTEGER REFERENCES users(id),
            action TEXT NOT NULL,
            details TEXT DEFAULT '',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()


# ─── USER FUNCTIONS ───

def create_user(email, name, password_hash):
    """Create a new user. Returns user id."""
    conn = get_db()
    try:
        cursor = conn.execute(
            "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
            (email, name, password_hash)
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None  # Email already exists
    finally:
        conn.close()


def get_user_by_email(email):
    """Find user by email."""
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if user:
        return dict(user)
    return None


def get_user_by_id(user_id):
    """Find user by id."""
    conn = get_db()
    user = conn.execute(
        "SELECT id, email, name, company_name, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if user:
        return dict(user)
    return None


# ─── ASSESSMENT FUNCTIONS ───

def create_assessment(user_id):
    """Create a new assessment. Returns assessment id."""
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO assessments (user_id) VALUES (?)",
        (user_id,)
    )
    assessment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    log_action(assessment_id, user_id, "started", "New assessment created")
    return assessment_id


def update_assessment(assessment_id, **kwargs):
    """Update assessment fields. Pass any column as keyword argument."""
    conn = get_db()
    # Convert dicts/lists to JSON strings
    for key, value in kwargs.items():
        if isinstance(value, (dict, list)):
            kwargs[key] = json.dumps(value)

    set_clause = ", ".join([f"{k} = ?" for k in kwargs.keys()])
    values = list(kwargs.values()) + [assessment_id]

    conn.execute(
        f"UPDATE assessments SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        values
    )
    conn.commit()
    conn.close()


def get_assessment(assessment_id):
    """Get a single assessment with JSON fields parsed."""
    conn = get_db()
    row = conn.execute("SELECT * FROM assessments WHERE id = ?",
                       (assessment_id,)).fetchone()
    conn.close()
    if not row:
        return None

    result = dict(row)
    # Parse JSON fields
    json_fields = ["company_data", "answers", "buyer_search", "buyer_summary",
                   "questions", "verification_checks", "kpis", "fuzzy_data",
                   "gap_analysis", "suggestions"]
    for field in json_fields:
        if result.get(field):
            try:
                result[field] = json.loads(result[field])
            except (json.JSONDecodeError, TypeError):
                pass
    return result


def get_user_assessments(user_id):
    """Get all assessments for a user, newest first."""
    conn = get_db()
    rows = conn.execute(
        """SELECT id, status, current_step, overall_score, greenwash_risk, 
           data_confidence, company_data, created_at, updated_at 
           FROM assessments WHERE user_id = ? ORDER BY created_at DESC""",
        (user_id,)
    ).fetchall()
    conn.close()

    results = []
    for row in rows:
        r = dict(row)
        if r.get("company_data"):
            try:
                r["company_data"] = json.loads(r["company_data"])
            except (json.JSONDecodeError, TypeError):
                pass
        results.append(r)
    return results


def get_latest_assessment(user_id):
    """Get the most recent in-progress assessment."""
    conn = get_db()
    row = conn.execute(
        "SELECT id, current_step FROM assessments WHERE user_id = ? AND status = 'in_progress' ORDER BY created_at DESC LIMIT 1",
        (user_id,)
    ).fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


# ─── AUDIT LOG FUNCTIONS ───

def log_action(assessment_id, user_id, action, details=""):
    """Log an action in the audit trail."""
    conn = get_db()
    conn.execute(
        "INSERT INTO audit_log (assessment_id, user_id, action, details) VALUES (?, ?, ?, ?)",
        (assessment_id, user_id, action, details)
    )
    conn.commit()
    conn.close()


def get_audit_log(assessment_id):
    """Get audit trail for an assessment."""
    conn = get_db()
    rows = conn.execute(
        "SELECT action, details, timestamp FROM audit_log WHERE assessment_id = ? ORDER BY timestamp ASC",
        (assessment_id,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Initialize database on import
init_db()

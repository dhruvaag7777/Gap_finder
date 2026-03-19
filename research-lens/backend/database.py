"""
SQLite database initialization for ResearchLens.
Creates all tables on startup.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "research_lens.db")


def get_connection():
    """Get a database connection."""
    return sqlite3.connect(DB_PATH)


def init_db():
    """Create all tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            analysis_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            topic TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'processing',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS landscape (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id TEXT NOT NULL,
            summary TEXT,
            saturated_areas TEXT,
            sources TEXT,
            FOREIGN KEY (analysis_id) REFERENCES analyses(analysis_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS gaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            reasoning TEXT,
            novelty_score REAL,
            feasibility_score REAL,
            impact_score REAL,
            overall_score REAL,
            FOREIGN KEY (analysis_id) REFERENCES analyses(analysis_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS proposals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id TEXT NOT NULL,
            gap_id INTEGER NOT NULL,
            title TEXT,
            abstract TEXT,
            objectives TEXT,
            methodology TEXT,
            expected_outcomes TEXT,
            limitations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (analysis_id) REFERENCES analyses(analysis_id),
            FOREIGN KEY (gap_id) REFERENCES gaps(id)
        )
    """)

    conn.commit()
    conn.close()


def dict_factory(cursor, row):
    """Convert sqlite rows to dicts."""
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

"""
Migration script to add latitude and longitude columns to the facilities table.
Run this once after updating models.py.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "welcome_nights.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if columns already exist
    cursor.execute("PRAGMA table_info(facilities)")
    columns = [col[1] for col in cursor.fetchall()]

    if "latitude" not in columns:
        print("Adding latitude column...")
        cursor.execute("ALTER TABLE facilities ADD COLUMN latitude REAL")
    else:
        print("latitude column already exists")

    if "longitude" not in columns:
        print("Adding longitude column...")
        cursor.execute("ALTER TABLE facilities ADD COLUMN longitude REAL")
    else:
        print("longitude column already exists")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()

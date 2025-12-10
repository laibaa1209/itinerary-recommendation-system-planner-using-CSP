from sqlalchemy import create_engine, text
from app.config import settings

def update_schema():
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        
        print("Checking for missing columns...")
        
        # Add duration to places
        try:
            conn.execute(text("ALTER TABLE places ADD COLUMN duration NUMERIC(4, 2) DEFAULT 2.0"))
            print("Added 'duration' column to 'places' table.")
        except Exception as e:
            print(f"Column 'duration' might already exist or error: {e}")

        # Add end_time to activities
        try:
            conn.execute(text("ALTER TABLE activities ADD COLUMN end_time TIME"))
            print("Added 'end_time' column to 'activities' table.")
        except Exception as e:
            print(f"Column 'end_time' might already exist or error: {e}")

if __name__ == "__main__":
    print("Updating database schema...")
    update_schema()
    print("Schema update complete.")

from sqlalchemy import text
from app.database import engine

def add_estimated_cost_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE activities ADD COLUMN estimated_cost NUMERIC(10, 2) DEFAULT 0.0"))
            conn.commit()
            print("Successfully added 'estimated_cost' column to 'activities' table.")
        except Exception as e:
            print(f"Error adding column (it might already exist): {e}")

if __name__ == "__main__":
    add_estimated_cost_column()

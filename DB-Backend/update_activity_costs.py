"""
Script to update existing activities with random estimated costs.
"""
import sys
import os
import random

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models

def update_activity_costs():
    db = SessionLocal()
    try:
        # Get all activities
        activities = db.query(models.Activity).all()
        
        updated_count = 0
        for activity in activities:
            if activity.estimated_cost is None or activity.estimated_cost == 0:
                # Assign random cost between 500 and 5000
                activity.estimated_cost = float(random.randint(500, 5000))
                updated_count += 1
                print(f"Updated activity {activity.activity_id}: {activity.notes} -> PKR {activity.estimated_cost}")
        
        db.commit()
        print(f"\nSuccessfully updated {updated_count} out of {len(activities)} activities!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_activity_costs()

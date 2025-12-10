from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import SessionLocal
from app import models

def check_latest_itinerary_activities():
    db = SessionLocal()
    try:
        # Get latest itinerary
        latest_itinerary = db.query(models.Itinerary).order_by(desc(models.Itinerary.created_at)).first()
        
        if not latest_itinerary:
            print("No itineraries found.")
            return

        print(f"Latest Itinerary ID: {latest_itinerary.itinerary_id}")
        print(f"Title: {latest_itinerary.title}")
        
        # Get activities
        activities = db.query(models.Activity).filter(models.Activity.itinerary_id == latest_itinerary.itinerary_id).all()
        
        print(f"Activities found: {len(activities)}")
        for act in activities:
            print(f" - Day {act.day_no}: {act.notes} ({act.start_time} - {act.end_time})")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_latest_itinerary_activities()

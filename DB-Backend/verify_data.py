from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

def verify_data():
    db = SessionLocal()
    try:
        cities = db.query(models.City).all()
        print(f"Total Cities: {len(cities)}")
        for city in cities:
            place_count = db.query(models.Place).filter(models.Place.city_id == city.city_id).count()
            print(f" - {city.name} ({city.province}): {place_count} places")
            
        places = db.query(models.Place).all()
        print(f"\nTotal Places: {len(places)}")
        if len(places) > 0:
            print("Sample Places:")
            for p in places[:5]:
                print(f" - {p.place_name} ({p.category})")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_data()

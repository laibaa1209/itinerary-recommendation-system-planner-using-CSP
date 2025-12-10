from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

def populate_data():
    db = SessionLocal()
    
    # Data Structure: Province -> List of (CityName, Description, List of Places)
    # Place: (Name, Category, Description, DurationHours)
    
    pakistan_data = {
        "Punjab": [
            ("Lahore", "The cultural heart of Pakistan", [
                ("Badshahi Mosque", "History", "Iconic Mughal era mosque", 1.5),
                ("Lahore Fort", "History", "Historical citadel", 2.0),
                ("Wagah Border Ceremony", "Culture", "Daily military parade", 3.0),
                ("Food Street Fort Road", "Food", "Traditional food with a view", 2.0),
                ("Shalimar Gardens", "Nature", "Mughal garden complex", 1.5)
            ]),
            ("Islamabad", "The beautiful capital city", [
                ("Faisal Mosque", "History", "Largest mosque in Pakistan", 1.0),
                ("Daman-e-Koh", "Nature", "Viewpoint over the city", 1.0),
                ("Monal Restaurant", "Food", "Dining in the hills", 2.5),
                ("Trail 3", "Hiking", "Popular hiking trail", 3.0),
                ("Lok Virsa Museum", "History", "Heritage museum", 2.0)
            ]),
            ("Murree", "Popular hill station", [
                ("Mall Road", "Shopping", "Famous shopping street", 2.0),
                ("Pindi Point", "Nature", "Scenic chairlift", 1.5),
                ("Patriata (New Murree)", "Adventure", "Cable car and chair lift", 3.0)
            ]),
            ("Multan", "City of Saints", [
                ("Tomb of Shah Rukn-e-Alam", "History", "Sufi shrine", 1.0),
                ("Ghanta Ghar", "History", "Clock tower", 0.5),
                ("Hussain Agahi Bazaar", "Shopping", "Local market", 2.0)
            ])
        ],
        "Sindh": [
            ("Karachi", "City of Lights", [
                ("Clifton Beach", "Nature", "Popular beach", 2.0),
                ("Mazar-e-Quaid", "History", "Jinnah's Mausoleum", 1.0),
                ("Mohatta Palace", "History", "Art museum", 1.5),
                ("Port Grand", "Food", "Food and entertainment complex", 3.0)
            ]),
            ("Hyderabad", "City of Perfumes", [
                ("Rani Bagh", "Nature", "Zoological garden", 2.0),
                ("Pacca Qilla", "History", "Historical fort", 1.5)
            ]),
            ("Thatta", "Historical city", [
                ("Makli Necropolis", "History", "UNESCO World Heritage site", 2.5),
                ("Shah Jahan Mosque", "History", "17th century mosque", 1.0)
            ])
        ],
        "KPK": [
            ("Peshawar", "City of Flowers", [
                ("Qissa Khwani Bazaar", "Shopping", "Storytellers market", 2.0),
                ("Bala Hissar Fort", "History", "Historic fortress", 1.5),
                ("Mahabat Khan Mosque", "History", "Mughal era mosque", 1.0)
            ]),
            ("Swat", "Switzerland of the East", [
                ("Malam Jabba", "Adventure", "Ski resort", 4.0),
                ("Mingora Bazaar", "Shopping", "Main market", 2.0),
                ("White Palace Marghazar", "History", "Royal palace", 1.5)
            ]),
            ("Naran", "Popular tourist valley", [
                ("Saif-ul-Malook Lake", "Nature", "Famous alpine lake", 3.0),
                ("Lulusar Lake", "Nature", "Scenic lake", 1.0),
                ("Babusar Top", "Nature", "Mountain pass", 1.0)
            ])
        ],
        "Balochistan": [
            ("Quetta", "Fruit Garden of Pakistan", [
                ("Hanna Lake", "Nature", "Scenic lake", 2.0),
                ("Hazarganji Chiltan National Park", "Nature", "National park", 3.0)
            ]),
            ("Ziarat", "Juniper forests", [
                ("Quaid-e-Azam Residency", "History", "Summer residence of Jinnah", 1.0),
                ("Prospect Point", "Nature", "Viewpoint", 1.0)
            ]),
            ("Gwadar", "Port City", [
                ("Gwadar Port", "Sightseeing", "Deep sea port", 1.0),
                ("Hammerhead", "Nature", "Rock formation", 1.5),
                ("Princess of Hope", "Nature", "Rock formation", 1.0)
            ])
        ],
        "Gilgit-Baltistan": [
            ("Hunza", "Mountain valley", [
                ("Altit Fort", "History", "Ancient fort", 1.5),
                ("Baltit Fort", "History", "Ancient fort", 1.5),
                ("Attabad Lake", "Adventure", "Boating and jet ski", 2.0),
                ("Eagle's Nest", "Nature", "Sunset viewpoint", 1.5),
                ("Passu Cones", "Nature", "Iconic peaks", 1.0)
            ]),
            ("Skardu", "Gateway to K2", [
                ("Shangrila Resort", "Nature", "Lower Kachura Lake", 2.0),
                ("Deosai Plains", "Nature", "High altitude plateau", 5.0),
                ("Shigar Fort", "History", "Heritage hotel", 1.5)
            ]),
            ("Gilgit", "Capital of GB", [
                ("Naltar Valley", "Nature", "Skiing and lakes", 4.0),
                ("Kargah Buddha", "History", "Ancient rock carving", 0.5)
            ]),
            ("Fairy Meadows", "Base of Nanga Parbat", [
                ("Fairy Meadows Trek", "Hiking", "Trek to base camp", 6.0),
                ("Reflection Lake", "Nature", "View of Nanga Parbat", 1.0)
            ])
        ],
        "AJK": [
            ("Muzaffarabad", "Capital of AJK", [
                ("Pir Chinasi", "Nature", "Mountain top view", 2.0),
                ("Red Fort", "History", "Chak fort", 1.0)
            ]),
            ("Neelum Valley", "Blue Gem", [
                ("Ratti Gali Lake", "Hiking", "Alpine glacial lake", 5.0),
                ("Keran", "Nature", "Riverside resort", 2.0),
                ("Sharda Peeth", "History", "Ancient temple ruins", 1.0)
            ])
        ]
    }

    try:
        for province, cities in pakistan_data.items():
            print(f"Processing {province}...")
            for city_name, city_desc, places in cities:
                # Check if city exists
                city = db.query(models.City).filter(models.City.name == city_name).first()
                if not city:
                    city = models.City(
                        name=city_name,
                        description=city_desc,
                        province=province
                    )
                    db.add(city)
                    db.commit()
                    db.refresh(city)
                    print(f"  Added City: {city_name}")
                else:
                    print(f"  City exists: {city_name}")

                # Add places
                for p_name, p_cat, p_desc, p_dur in places:
                    place = db.query(models.Place).filter(models.Place.place_name == p_name, models.Place.city_id == city.city_id).first()
                    if not place:
                        place = models.Place(
                            city_id=city.city_id,
                            place_name=p_name,
                            category=p_cat,
                            description=p_desc,
                            duration=p_dur
                        )
                        db.add(place)
                        print(f"    Added Place: {p_name}")
                    else:
                        # Update duration if missing
                        if place.duration is None:
                            place.duration = p_dur
                            db.add(place)
                            print(f"    Updated Duration: {p_name}")
                
                db.commit()
        
        print("Data population complete!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_data()

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from pydantic import BaseModel

from .. import models, schemas
from ..auth import get_current_user, get_db

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendationRequest(BaseModel):
    categories: List[str]
    user_type: str
    limit: int = 20


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Get all unique place categories"""
    categories = db.query(distinct(models.Place.category)).filter(
        models.Place.category.isnot(None)
    ).all()
    return [{"category": cat[0]} for cat in categories if cat[0]]


@router.post("/places")
def recommend_places(
    request: RecommendationRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Recommend places based on user preferences.
    - New users: Filter by selected categories
    - Existing users: Use categories + analyze past itineraries
    """
    
    # Base query: filter by categories
    query = db.query(models.Place).filter(
        models.Place.category.in_(request.categories)
    )
    
    if request.user_type == "existing":
        # For existing users, boost places from cities they've visited
        user_itineraries = db.query(models.Itinerary).filter(
            models.Itinerary.user_id == current_user.user_id
        ).all()
        
        visited_city_ids = set()
        for itin in user_itineraries:
            for city in itin.cities:
                visited_city_ids.add(city.city_id)
        
        if visited_city_ids:
            # Prioritize places from visited cities
            query = query.order_by(
                models.Place.city_id.in_(list(visited_city_ids)).desc()
            )
    
    # Order by rating (if available) or just by name
    places = query.limit(request.limit).all()
    
    # Group by category
    result = {}
    for place in places:
        cat = place.category or "Other"
        if cat not in result:
            result[cat] = []
        result[cat].append({
            "place_id": place.place_id,
            "place_name": place.place_name,
            "category": place.category,
            "city_name": place.city.name if place.city else None,
            "description": place.description,
            "duration": place.duration
        })
    
    return result


@router.get("/top-cities")
def get_top_cities(limit: int = 10, db: Session = Depends(get_db)):
    """Get top-rated cities based on average review ratings of their places"""
    
    # Calculate average rating per city
    city_ratings = (
        db.query(
            models.City.city_id,
            models.City.name,
            func.avg(models.Review.rating).label("avg_rating"),
            func.count(models.Review.review_id).label("review_count")
        )
        .join(models.Place, models.Place.city_id == models.City.city_id)
        .join(models.Review, models.Review.place_id == models.Place.place_id)
        .group_by(models.City.city_id, models.City.name)
        .order_by(func.avg(models.Review.rating).desc())
        .limit(limit)
        .all()
    )
    
    return [
        {
            "city_id": city.city_id,
            "name": city.name,
            "avg_rating": round(float(city.avg_rating), 1) if city.avg_rating else 0,
            "review_count": city.review_count
        }
        for city in city_ratings
    ]

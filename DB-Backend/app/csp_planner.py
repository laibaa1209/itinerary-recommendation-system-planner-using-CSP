from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta, datetime, time
from typing import List, Optional

from sqlalchemy.orm import Session

from . import models


@dataclass
class PlanningRequest:
    user_id: int
    city_ids: List[int]
    start_date: date
    end_date: date
    selected_place_ids: Optional[List[int]] = None  # User-selected activities
    daily_start_time: str = "09:00"  # e.g., "09:00"
    daily_budget: Optional[float] = None
    max_places_per_day: int = 3


@dataclass
class PlannedActivity:
    day_no: int
    place_id: int
    start_time: str
    end_time: str
    notes: str
    cost: float = 0.0


def _available_places_for_cities(db: Session, city_ids: List[int]) -> List[models.Place]:
    return (
        db.query(models.Place)
        .filter(models.Place.city_id.in_(city_ids))
        .order_by(models.Place.category, models.Place.place_name)
        .all()
    )


def _estimate_place_cost(place: models.Place) -> float:
    # In a real app, this might come from DB or category average
    # For now, return a random value between 500 and 5000
    import random
    return float(random.randint(500, 5000))


def _get_place_duration(place: models.Place) -> float:
    """Get duration in hours. Use stored duration or heuristic."""
    if place.duration:
        return float(place.duration)
    
    # Heuristic fallback if duration not set
    base = 2.0
    if place.category:
        cat = place.category.lower()
        if "museum" in cat or "historic" in cat:
            base = 2.0
        elif "restaurant" in cat or "food" in cat:
            base = 1.5
        elif "adventure" in cat or "trek" in cat:
            base = 3.0
        elif "shopping" in cat or "market" in cat:
            base = 2.0
    return base


def add_minutes(time_str: str, minutes: float) -> str:
    """Add minutes to a time string (HH:MM)."""
    t = datetime.strptime(time_str, "%H:%M")
    new_t = t + timedelta(minutes=minutes)
    return new_t.strftime("%H:%M")


def build_itinerary_plan(
    db: Session, request: PlanningRequest
) -> List[PlannedActivity]:
    """
    Enhanced CSP-style planner with time scheduling:
    - variables: each (day, slot) pair
    - domain: selected places (or all places if none selected)
    - constraints:
        * max places per day
        * avoid repeating the same place
        * keep approximate daily cost under daily_budget
        * time scheduling with travel buffers
    """
    all_places = _available_places_for_cities(db, request.city_ids)
    
    # Filter to only selected places if provided
    if request.selected_place_ids:
        places = [p for p in all_places if p.place_id in request.selected_place_ids]
    else:
        places = all_places

    if not places:
        return []

    total_days = (request.end_date - request.start_date).days + 1
    activities: List[PlannedActivity] = []
    used_place_ids: set[int] = set()

    # Travel buffer in minutes
    TRAVEL_BUFFER = 30

    for day in range(1, total_days + 1):
        remaining_budget = request.daily_budget or float("inf")
        day_count = 0
        current_time_str = request.daily_start_time

        for place in places:
            if day_count >= request.max_places_per_day:
                break
            if place.place_id in used_place_ids:
                continue
            
            cost = _estimate_place_cost(place)
            if cost > remaining_budget:
                continue

            # Calculate times
            duration_hours = _get_place_duration(place)
            start_time = current_time_str
            end_time = add_minutes(start_time, duration_hours * 60)
            
            # Check if end time is too late (e.g., after 10 PM)
            if end_time > "22:00":
                break

            activities.append(
                PlannedActivity(
                    day_no=day,
                    place_id=place.place_id,
                    start_time=start_time,
                    end_time=end_time,
                    notes=f"Visit {place.place_name}",
                    cost=cost,
                )
            )
            used_place_ids.add(place.place_id)
            remaining_budget -= cost
            day_count += 1
            
            # Update current time for next activity (end time + buffer)
            current_time_str = add_minutes(end_time, TRAVEL_BUFFER)

    return activities


def recommend_cities_by_reviews(db: Session, limit: int = 5) -> List[models.City]:
    """
    Simple recommendation heuristic:
    - rank cities by average rating of their places' reviews
    - fall back to number of reviews when averages tie
    """
    from sqlalchemy import func

    sub = (
        db.query(
            models.City.city_id.label("city_id"),
            func.avg(models.Review.rating).label("avg_rating"),
            func.count(models.Review.review_id).label("review_count"),
        )
        .join(models.Place, models.Place.city_id == models.City.city_id)
        .join(models.Review, models.Review.place_id == models.Place.place_id)
        .group_by(models.City.city_id)
        .subquery()
    )

    cities = (
        db.query(models.City)
        .join(sub, sub.c.city_id == models.City.city_id)
        .order_by(sub.c.avg_rating.desc(), sub.c.review_count.desc())
        .limit(limit)
        .all()
    )

    return cities

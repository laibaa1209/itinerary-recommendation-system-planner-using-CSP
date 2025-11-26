from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from . import models


@dataclass
class PlanningRequest:
    user_id: int
    city_ids: List[int]
    start_date: date
    end_date: date
    daily_budget: Optional[float] = None
    max_places_per_day: int = 3


@dataclass
class PlannedActivity:
    day_no: int
    place_id: int
    notes: str


def _available_places_for_cities(db: Session, city_ids: List[int]) -> List[models.Place]:
    return (
        db.query(models.Place)
        .filter(models.Place.city_id.in_(city_ids))
        .order_by(models.Place.category, models.Place.place_name)
        .all()
    )


def _estimate_place_cost(place: models.Place) -> float:
    """Very simple heuristic cost per place, could be replaced with real data later."""
    base = 2000.0
    if place.category:
        cat = place.category.lower()
        if "museum" in cat or "historic" in cat:
            base = 1500.0
        elif "restaurant" in cat or "food" in cat:
            base = 1200.0
        elif "adventure" in cat or "trek" in cat:
            base = 3000.0
    return base


def build_itinerary_plan(
    db: Session, request: PlanningRequest
) -> List[PlannedActivity]:
    """
    Very lightweight CSP-style planner:
    - variables: each (day, slot) pair
    - domain: all places in selected cities
    - constraints:
        * max places per day
        * avoid repeating the same place
        * keep approximate daily cost under daily_budget if provided
    """
    places = _available_places_for_cities(db, request.city_ids)
    if not places:
        return []

    total_days = (request.end_date - request.start_date).days + 1
    activities: List[PlannedActivity] = []
    used_place_ids: set[int] = set()

    for day in range(1, total_days + 1):
        remaining_budget = request.daily_budget or float("inf")
        day_count = 0

        for place in places:
            if day_count >= request.max_places_per_day:
                break
            if place.place_id in used_place_ids:
                continue
            cost = _estimate_place_cost(place)
            if cost > remaining_budget:
                continue

            activities.append(
                PlannedActivity(
                    day_no=day,
                    place_id=place.place_id,
                    notes=f"Visit {place.place_name}",
                )
            )
            used_place_ids.add(place.place_id)
            remaining_budget -= cost
            day_count += 1

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



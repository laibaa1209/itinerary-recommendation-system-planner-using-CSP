from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..csp_planner import PlanningRequest, build_itinerary_plan, recommend_cities_by_reviews
from ..auth import get_current_user, get_db

router = APIRouter(prefix="/itineraries", tags=["itineraries"])


def _get_itinerary_or_404(itinerary_id: int, db: Session) -> models.Itinerary:
    itinerary = db.query(models.Itinerary).get(itinerary_id)
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return itinerary


def _enforce_owner_or_admin(
    itinerary: models.Itinerary, current_user: models.User
) -> None:
    if itinerary.user_id != current_user.user_id and current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Not permitted for this itinerary")


@router.post("/", response_model=schemas.ItineraryRead, status_code=201)
def create_itinerary(
    payload: schemas.ItineraryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.user_id != current_user.user_id and current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Cannot create for other users")
    itinerary = models.Itinerary(**payload.dict())
    db.add(itinerary)
    db.commit()
    db.refresh(itinerary)
    return itinerary


@router.get("/", response_model=List[schemas.ItineraryRead])
def list_itineraries(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Itinerary)
    if current_user.user_type != "admin":
        query = query.filter(models.Itinerary.user_id == current_user.user_id)
    return query.options(joinedload(models.Itinerary.cities)).order_by(models.Itinerary.start_date).all()


@router.get("/{itinerary_id}", response_model=schemas.ItineraryRead)
def get_itinerary(
    itinerary_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    itinerary = db.query(models.Itinerary).options(joinedload(models.Itinerary.cities)).get(itinerary_id)
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    _enforce_owner_or_admin(itinerary, current_user)
    return itinerary


@router.put("/{itinerary_id}", response_model=schemas.ItineraryRead)
def update_itinerary(
    itinerary_id: int,
    payload: schemas.ItineraryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    itinerary = _get_itinerary_or_404(itinerary_id, db)
    _enforce_owner_or_admin(itinerary, current_user)
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(itinerary, key, value)
    db.commit()
    db.refresh(itinerary)
    return itinerary


@router.delete("/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary(
    itinerary_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    itinerary = _get_itinerary_or_404(itinerary_id, db)
    _enforce_owner_or_admin(itinerary, current_user)
    db.delete(itinerary)
    db.commit()


@router.post("/{itinerary_id}/cities/{city_id}", status_code=201)
def add_city_to_itinerary(
    itinerary_id: int,
    city_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    itinerary = _get_itinerary_or_404(itinerary_id, db)
    _enforce_owner_or_admin(itinerary, current_user)
    city = db.query(models.City).get(city_id)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    if city in itinerary.cities:
        raise HTTPException(status_code=400, detail="City already in itinerary")
    itinerary.cities.append(city)
    db.commit()
    return {"detail": "City added"}


@router.delete("/{itinerary_id}/cities/{city_id}", status_code=204)
def remove_city_from_itinerary(
    itinerary_id: int,
    city_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    itinerary = _get_itinerary_or_404(itinerary_id, db)
    _enforce_owner_or_admin(itinerary, current_user)
    city = db.query(models.City).get(city_id)
    if not city or city not in itinerary.cities:
        raise HTTPException(status_code=404, detail="City not linked to itinerary")
    itinerary.cities.remove(city)
    db.commit()


@router.post("/{itinerary_id}/plan", status_code=201)
def plan_itinerary(
    itinerary_id: int,
    daily_budget: float | None = None,
    max_places_per_day: int = 3,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Use a simple CSP-style planner to populate activities for an itinerary
    based on its cities, date range and optional budget constraints.
    """
    itinerary = _get_itinerary_or_404(itinerary_id, db)
    _enforce_owner_or_admin(itinerary, current_user)

    if not itinerary.cities:
        raise HTTPException(status_code=400, detail="Add at least one city first")

    req = PlanningRequest(
        user_id=current_user.user_id,
        city_ids=[c.city_id for c in itinerary.cities],
        start_date=itinerary.start_date,
        end_date=itinerary.end_date,
        daily_budget=daily_budget,
        max_places_per_day=max_places_per_day,
    )

    planned = build_itinerary_plan(db, req)

    # clear existing auto activities (for simplicity we just append now)
    for p in planned:
        # Convert string times to python time objects
        s_time = datetime.strptime(p.start_time, "%H:%M").time()
        e_time = datetime.strptime(p.end_time, "%H:%M").time()
        
        activity = models.Activity(
            itinerary_id=itinerary.itinerary_id,
            place_id=p.place_id,
            day_no=p.day_no,
            start_time=s_time,
            end_time=e_time,
            notes=p.notes,
            estimated_cost=p.cost,
        )
        db.add(activity)

    db.commit()
    return {"detail": f"Planned {len(planned)} activities", "count": len(planned)}


@router.post("/{itinerary_id}/plan-custom", status_code=201)
def plan_itinerary_custom(
    itinerary_id: int,
    payload: schemas.CustomPlanRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Plan itinerary with specific selected activities and time scheduling.
    """
    from datetime import datetime
    
    itinerary = _get_itinerary_or_404(itinerary_id, db)
    _enforce_owner_or_admin(itinerary, current_user)

    if not itinerary.cities:
        raise HTTPException(status_code=400, detail="Add at least one city first")

    req = PlanningRequest(
        user_id=current_user.user_id,
        city_ids=[c.city_id for c in itinerary.cities],
        start_date=itinerary.start_date,
        end_date=itinerary.end_date,
        selected_place_ids=payload.place_ids,
        daily_start_time=payload.daily_start_time,
        daily_budget=payload.daily_budget,
        max_places_per_day=payload.max_places_per_day,
    )

    planned = build_itinerary_plan(db, req)

    # Clear existing activities? Or append? 
    # Usually planning replaces the schedule, so let's clear for this itinerary
    # But maybe user wants to keep manual ones? 
    # For now, let's just append but maybe we should delete old ones to avoid duplicates
    # Let's delete old auto-generated ones or just all for this itinerary if re-planning
    db.query(models.Activity).filter(models.Activity.itinerary_id == itinerary_id).delete()

    for p in planned:
        # Convert string times to python time objects
        s_time = datetime.strptime(p.start_time, "%H:%M").time()
        e_time = datetime.strptime(p.end_time, "%H:%M").time()
        
        activity = models.Activity(
            itinerary_id=itinerary.itinerary_id,
            place_id=p.place_id,
            day_no=p.day_no,
            start_time=s_time,
            end_time=e_time,
            notes=p.notes,
            estimated_cost=p.cost,
        )
        db.add(activity)

    db.commit()
    return {"detail": f"Planned {len(planned)} activities", "count": len(planned), "activities": planned}


@router.get("/recommend/top-cities", response_model=list[schemas.CityRead])
def recommend_top_cities(
    limit: int = 5, db: Session = Depends(get_db)
):
    """
    Recommendation endpoint:
    returns cities ranked by average review rating of their places.
    """
    return recommend_cities_by_reviews(db, limit=limit)


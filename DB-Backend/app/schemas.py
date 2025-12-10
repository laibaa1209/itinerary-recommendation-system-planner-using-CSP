from datetime import date, datetime, time
from typing import Optional, List

from pydantic import BaseModel, EmailStr


class ORMBase(BaseModel):
    model_config = {
        "from_attributes": True
    }
    #class Config:
     #   orm_mode = True


# ------------------- Users ------------------- #
class UserBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    contact_info: Optional[str] = None
    user_type: Optional[str] = "traveler"


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    contact_info: str | None = None
    user_type: str | None = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    contact_info: Optional[str] = None
    user_type: Optional[str] = None
    password: Optional[str] = None


class UserRead(BaseModel):
    user_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    contact_info: Optional[str] = None
    user_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True   # REQUIRED for ORM → Pydantic



# ------------------- Itineraries ------------------- #
class ItineraryBase(BaseModel):
    title: Optional[str] = None
    start_date: date
    end_date: date
    total_budget: Optional[float] = None


class ItineraryCreate(ItineraryBase):
    user_id: int


class ItineraryUpdate(BaseModel):
    title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_budget: Optional[float] = None


class ItineraryRead(ORMBase, ItineraryBase):
    itinerary_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    cities: List["CityRead"] = []


class CustomPlanRequest(BaseModel):
    place_ids: List[int]
    daily_start_time: str = "09:00"
    daily_budget: Optional[float] = None
    max_places_per_day: int = 3


# ------------------- Cities ------------------- #
class CityBase(BaseModel):
    name: str
    description: Optional[str] = None
    province: Optional[str] = None


class CityCreate(CityBase):
    pass


class CityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    province: Optional[str] = None


class CityRead(ORMBase, CityBase):
    city_id: int


# ------------------- Places ------------------- #
class PlaceBase(BaseModel):
    city_id: int
    place_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[dict] = None
    duration: Optional[float] = 2.0


class PlaceCreate(PlaceBase):
    pass


class PlaceUpdate(BaseModel):
    city_id: Optional[int] = None
    place_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[dict] = None
    duration: Optional[float] = None


class PlaceRead(ORMBase, PlaceBase):
    place_id: int


# ------------------- Activities ------------------- #
class ActivityBase(BaseModel):
    itinerary_id: int
    place_id: Optional[int] = None
    day_no: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None
    estimated_cost: Optional[float] = 0.0


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    place_id: Optional[int] = None
    day_no: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None


class ActivityRead(ORMBase, ActivityBase):
    activity_id: int


# ------------------- Reviews ------------------- #
class ReviewBase(BaseModel):
    user_id: int
    place_id: int
    rating: int
    rating_comment: Optional[str] = None
    review_date: Optional[date] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    rating_comment: Optional[str] = None
    review_date: Optional[date] = None


class ReviewRead(ORMBase, ReviewBase):
    review_id: int
    place: Optional["PlaceRead"] = None


# ------------------- Weather ------------------- #
class WeatherBase(BaseModel):
    city_id: int
    date: date
    temperature: Optional[dict] = None
    conditions: Optional[str] = None


class WeatherCreate(WeatherBase):
    pass


class WeatherUpdate(BaseModel):
    date: Optional[date] = None
    temperature: Optional[dict] = None
    conditions: Optional[str] = None


class WeatherRead(ORMBase, WeatherBase):
    weather_id: int


# ------------------- Expenses ------------------- #
class ExpenseBase(BaseModel):
    itinerary_id: int
    description: Optional[str] = None
    amount: float
    category: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None


class ExpenseRead(ORMBase, ExpenseBase):
    expense_id: int

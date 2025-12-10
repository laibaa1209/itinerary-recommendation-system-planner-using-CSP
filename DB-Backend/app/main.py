from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from .database import Base, engine
from .auth import get_db
from .routers import (
    activities,
    auth_routes,
    cities,
    expenses,
    itineraries,
    places,
    recommendations,
    reviews,
    users,
    weather,
)

app = FastAPI(title="Travel Planner API")

# Global exception handler to catch all unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    error_trace = traceback.format_exc()
    error_msg = str(exc)
    error_type = type(exc).__name__
    
    print(f"\n{'='*60}")
    print(f"UNHANDLED ERROR ({error_type}):")
    print(f"{'='*60}")
    print(f"Path: {request.url.path}")
    print(f"Method: {request.method}")
    print(f"Error: {error_msg}")
    print(f"\nFull traceback:")
    print(error_trace)
    print(f"{'='*60}\n")
    
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {error_type} - {error_msg}",
            "error_type": error_type
        }
    )

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# IMPORTANT: Create all tables in Neon
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified successfully")
except Exception as e:
    print(f"WARNING: Failed to create tables: {e}")
    print("This might be okay if tables already exist")

app.include_router(auth_routes.router)
app.include_router(users.router)
app.include_router(itineraries.router)
app.include_router(cities.router)
app.include_router(places.router)
app.include_router(activities.router)
app.include_router(reviews.router)
app.include_router(expenses.router)
app.include_router(weather.router)
app.include_router(recommendations.router)

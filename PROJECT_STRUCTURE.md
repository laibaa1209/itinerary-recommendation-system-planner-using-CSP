# Project Structure

## 📁 Folder Structure

```
itinerary-recommendation-system-planner-using-CSP/
├── DB-Backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI app entry point
│   │   ├── auth.py                # Authentication utilities
│   │   ├── config.py              # Configuration
│   │   ├── database.py            # Database connection
│   │   ├── models.py              # SQLAlchemy models
│   │   ├── schemas.py             # Pydantic schemas
│   │   ├── csp_planner.py        # CSP itinerary planner
│   │   └── routers/               # API route handlers
│   │       ├── __init__.py
│   │       ├── auth_routes.py     # /auth endpoints
│   │       ├── users.py           # /users endpoints
│   │       ├── itineraries.py     # /itineraries endpoints
│   │       ├── cities.py           # /cities endpoints
│   │       ├── places.py          # /places endpoints
│   │       ├── activities.py      # /activities endpoints
│   │       ├── reviews.py         # /reviews endpoints
│   │       ├── expenses.py        # /expenses endpoints
│   │       └── weather.py         # /weather endpoints
│   ├── requirements.txt
│   └── venv/                      # Virtual environment
│
└── my-app/                        # Frontend (HTML/CSS/JS)
    ├── index.html                 # Landing page
    ├── main.js                    # Landing page logic
    ├── auth.html                  # Sign in/Sign up page
    ├── auth.js                    # Auth logic
    ├── auth-utils.js              # Shared auth utilities
    ├── dashboard.html             # User dashboard
    ├── dashboard.js               # Dashboard logic
    ├── itinerary-builder.html     # Create itinerary
    ├── itinerary-builder.js      # Builder logic
    ├── itinerary-details.html     # View itinerary details
    ├── itinerary-details.js       # Details page logic
    ├── itinerary-expenses-reviews.js  # Expenses & reviews
    ├── profile.html               # User profile
    ├── profile.js                 # Profile logic
    ├── recommend-itinerary.html   # Recommendations
    ├── recommend-itinerary.js     # Recommendations logic
    └── styles.css                 # Global styles
```

##  API Endpoints Mapping

### Authentication
- `POST /auth/login` → `auth.js` (login form)
- `POST /auth/register` → `auth.js` (signup form)

### Users
- `GET /users/me` → `profile.js` (load profile)
- `PUT /users/me` → `profile.js` (update profile)

### Itineraries
- `GET /itineraries` → `dashboard.js` (list all)
- `POST /itineraries` → `itinerary-builder.js` (create)
- `GET /itineraries/{id}` → `itinerary-details.js` (get one)
- `POST /itineraries/{id}/plan` → `itinerary-details.js` (auto-plan)
- `POST /itineraries/{id}/cities/{city_id}` → `itinerary-builder.js` (add city)
- `DELETE /itineraries/{id}/cities/{city_id}` → (not used in frontend yet)
- `GET /itineraries/recommend/top-cities` → `recommend-itinerary.js`

### Activities
- `GET /activities?itinerary_id={id}` → `itinerary-details.js`, `itinerary-expenses-reviews.js`

### Expenses
- `GET /expenses?itinerary_id={id}` → `itinerary-expenses-reviews.js`
- `POST /expenses` → `itinerary-expenses-reviews.js`

### Reviews
- `GET /reviews?place_id={id}` → `itinerary-expenses-reviews.js`
- `POST /reviews` → `itinerary-expenses-reviews.js`

### Places
- `GET /places` → `itinerary-expenses-reviews.js` (load all)
- `GET /places/{id}` → `itinerary-expenses-reviews.js` (get one)

### Cities
- `GET /cities` → `itinerary-builder.js` (load for dropdown)

### Backend
- [x] All routers imported in `main.py`
- [x] CORS configured for `http://localhost:3000`
- [x] CSP planner endpoint exists: `/itineraries/{id}/plan`
- [x] Recommendation endpoint exists: `/itineraries/recommend/top-cities`
- [x] All models defined in `models.py`
- [x] All schemas defined in `schemas.py`

### Frontend
- [x] All HTML files have correct script tags
- [x] All JS files use `API_BASE = "http://127.0.0.1:8000"`
- [x] Auth utilities shared via `auth-utils.js`
- [x] Logout functionality on all pages
- [x] Auth checks on protected pages

### Integration
- [x] Signup form includes all schema fields (first_name, last_name, email, contact_info, password, user_type)
- [x] User types: traveller, tourist, habitant
- [x] Itinerary creation includes city selection
- [x] Dashboard loads real itineraries
- [x] Details page loads real data
- [x] Expenses tracking connected
- [x] Reviews system connected
- [x] Auto-plan button connected
- [x] Recommendations page connected

## 🚀 How to Run

### Backend (PowerShell #1)
```powershell
cd DB-Backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Frontend (PowerShell #2)
```powershell
cd my-app
npm install
npm run dev
```

## 📝 Notes

- Old React files in `my-app/src/` are not used (legacy)
- Current frontend uses pure HTML/CSS/JS in `my-app/` root
- All endpoints require authentication except:
  - `/auth/login`
  - `/auth/register`
  - `/cities` (public)
  - `/places` (public)
  - `/itineraries/recommend/top-cities` (public)


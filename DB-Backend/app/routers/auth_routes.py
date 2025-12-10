from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import (
    authenticate_user,
    create_access_token,
    get_db,
    hash_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserRead, status_code=201)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    import traceback
    print(f"User in: {user_in}")
    try:
        # Check if email already exists
        existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Use default "traveler" if user_type is not provided or is None
        user_type = user_in.user_type if user_in.user_type else "traveler"
        
        # Create new user
        new_user = models.User(
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            email=user_in.email,
            password_hash=hash_password(user_in.password),
            contact_info=user_in.contact_info,
            user_type=user_type,
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Manually construct response to ensure all fields match schema
        return schemas.UserRead(
            user_id=new_user.user_id,
            first_name=new_user.first_name,
            last_name=new_user.last_name,
            email=new_user.email,
            contact_info=new_user.contact_info,
            user_type=new_user.user_type,
            created_at=new_user.created_at
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Rollback on any other error
        if db:
            try:
                db.rollback()
            except Exception as rollback_error:
                print(f"Rollback error: {rollback_error}")
        
        # Log the full error for debugging
        error_trace = traceback.format_exc()
        error_msg = str(e)
        error_type = type(e).__name__
        
        print(f"\n{'='*60}")
        print(f"REGISTRATION ERROR ({error_type}):")
        print(f"{'='*60}")
        print(f"Error: {error_msg}")
        print(f"\nFull traceback:")
        print(error_trace)
        print(f"{'='*60}\n")
        
        # Return more detailed error in response
        raise HTTPException(
            status_code=500, 
            detail=f"Registration failed: {error_type} - {error_msg}"
        )


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    import traceback
    try:
        print(f"Login attempt for: {form_data.username}")
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            print(f"Authentication failed for: {form_data.username}")
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        print(f"User authenticated: {user.user_id}, {user.email}")
        token = create_access_token({"sub": str(user.user_id)})
        print(f"Token created successfully")
        return {"access_token": token, "token_type": "bearer"}
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        error_trace = traceback.format_exc()
        error_msg = str(e)
        error_type = type(e).__name__
        
        print(f"\n{'='*60}")
        print(f"LOGIN ERROR ({error_type}):")
        print(f"{'='*60}")
        print(f"Error: {error_msg}")
        print(f"\nFull traceback:")
        print(error_trace)
        print(f"{'='*60}\n")
        
        raise HTTPException(
            status_code=500, 
            detail=f"Login failed: {error_type} - {error_msg}"
        )


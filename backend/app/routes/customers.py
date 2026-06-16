from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.services import customer_service
from app.auth.jwt import get_current_user
from app.models.user import User
from app.models.order import Order

router = APIRouter()

def serialize_customer(customer, db: Session, user_id: int) -> dict:
    total_orders = db.query(func.count(Order.id)).filter(
        Order.customer_id == customer.id, Order.user_id == user_id
    ).scalar() or 0
    return {
        "id": customer.id,
        "user_id": customer.user_id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "total_orders": total_orders,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
    }

@router.get("/")
def get_customers(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customers = customer_service.get_all_customers(db, current_user.id, search=search, skip=skip, limit=limit)
    return [serialize_customer(c, db, current_user.id) for c in customers]

@router.get("/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = customer_service.get_customer_by_id(db, customer_id, current_user.id)
    return serialize_customer(customer, db, current_user.id)

@router.post("/", status_code=201)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = customer_service.create_customer(db, customer, current_user.id)
    return serialize_customer(c, db, current_user.id)

@router.put("/{customer_id}")
def update_customer(customer_id: int, customer: CustomerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = customer_service.update_customer(db, customer_id, customer, current_user.id)
    return serialize_customer(c, db, current_user.id)

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return customer_service.delete_customer(db, customer_id, current_user.id)

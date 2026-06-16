from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


def get_all_customers(db: Session, user_id: int, search: Optional[str] = None,
                      skip: int = 0, limit: int = 100) -> List[Customer]:
    query = db.query(Customer).filter(Customer.user_id == user_id)
    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%") | Customer.email.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()


def get_customer_by_id(db: Session, customer_id: int, user_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.user_id == user_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


def create_customer(db: Session, customer_data: CustomerCreate, user_id: int) -> Customer:
    existing = db.query(Customer).filter(Customer.email == customer_data.email, Customer.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    customer = Customer(**customer_data.dict(), user_id=user_id)
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    return customer


def update_customer(db: Session, customer_id: int, customer_data: CustomerUpdate, user_id: int) -> Customer:
    customer = get_customer_by_id(db, customer_id, user_id)
    if customer_data.email and customer_data.email != customer.email:
        existing = db.query(Customer).filter(Customer.email == customer_data.email, Customer.user_id == user_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    update_data = customer_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int, user_id: int) -> dict:
    customer = get_customer_by_id(db, customer_id, user_id)
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}

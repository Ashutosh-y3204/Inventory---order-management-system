from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse
from app.services import order_service
from app.auth.jwt import get_current_user
from app.models.user import User

router = APIRouter()

def serialize_order(order) -> dict:
    return {
        "id": order.id,
        "user_id": order.user_id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.name if order.customer else None,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else None,
                "quantity": item.quantity,
                "price": item.price,
            }
            for item in order.items
        ],
    }

@router.get("/")
def get_orders(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders = order_service.get_all_orders(db, current_user.id, status_filter=status, skip=skip, limit=limit)
    return [serialize_order(o) for o in orders]

@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = order_service.get_order_by_id(db, order_id, current_user.id)
    return serialize_order(order)

@router.post("/", status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = order_service.create_order(db, order, current_user.id)
    return serialize_order(order)

@router.post("/{order_id}/cancel")
def cancel_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = order_service.cancel_order(db, order_id, current_user.id)
    return serialize_order(order)

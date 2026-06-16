from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductRestock, StockAdjustment
from app.schemas.inventory_transaction import InventoryTransactionResponse
from app.services import product_service
from app.auth.jwt import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return product_service.get_all_products(db, current_user.id, search=search, category=category, skip=skip, limit=limit)

@router.get("/low-stock", response_model=List[ProductResponse])
def get_low_stock(
    threshold: int = Query(10, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return product_service.get_low_stock_products(db, current_user.id, threshold=threshold)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return product_service.get_product_by_id(db, product_id, current_user.id)

@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return product_service.create_product(db, product, current_user.id)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return product_service.update_product(db, product_id, product, current_user.id)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return product_service.delete_product(db, product_id, current_user.id)

@router.post("/{product_id}/restock", response_model=ProductResponse)
def restock_product(product_id: int, data: ProductRestock, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return product_service.restock_product(db, product_id, data, current_user.id)

@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
def adjust_stock(product_id: int, data: StockAdjustment, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return product_service.adjust_stock(db, product_id, data, current_user.id)

@router.get("/{product_id}/transactions", response_model=List[InventoryTransactionResponse])
def get_transactions(product_id: int, limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return product_service.get_inventory_transactions(db, product_id, current_user.id, limit=limit)

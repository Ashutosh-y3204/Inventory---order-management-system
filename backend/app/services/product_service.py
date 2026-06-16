from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional
from app.models.product import Product
from app.models.inventory_transaction import InventoryTransaction
from app.schemas.product import ProductCreate, ProductUpdate, ProductRestock, StockAdjustment


def _log_transaction(db: Session, user_id: int, product: Product, txn_type: str,
                     quantity_change: int, reference_id: int = None, note: str = None):
    before = product.stock_quantity
    after = before + quantity_change
    txn = InventoryTransaction(
        user_id=user_id,
        product_id=product.id,
        transaction_type=txn_type,
        quantity_change=quantity_change,
        quantity_before=before,
        quantity_after=after,
        reference_id=reference_id,
        note=note,
    )
    db.add(txn)
    return after


def get_all_products(db: Session, user_id: int, search: Optional[str] = None,
                     category: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Product]:
    query = db.query(Product).filter(Product.user_id == user_id)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))
    if category:
        query = query.filter(Product.category == category)
    return query.offset(skip).limit(limit).all()


def get_product_by_id(db: Session, product_id: int, user_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id, Product.user_id == user_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def create_product(db: Session, product_data: ProductCreate, user_id: int) -> Product:
    existing = db.query(Product).filter(Product.sku == product_data.sku, Product.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")
    product = Product(**product_data.dict(), user_id=user_id)
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")
    # Log initial stock if > 0
    if product.stock_quantity > 0:
        _log_transaction(db, user_id, product, "initial_stock", product.stock_quantity, note="Initial stock on creation")
        db.commit()
    return product


def update_product(db: Session, product_id: int, product_data: ProductUpdate, user_id: int) -> Product:
    product = get_product_by_id(db, product_id, user_id)
    if product_data.sku and product_data.sku != product.sku:
        existing = db.query(Product).filter(Product.sku == product_data.sku, Product.user_id == user_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")
    update_data = product_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int, user_id: int) -> dict:
    product = get_product_by_id(db, product_id, user_id)
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}


def get_low_stock_products(db: Session, user_id: int, threshold: int = 10) -> List[Product]:
    return db.query(Product).filter(Product.user_id == user_id, Product.stock_quantity <= threshold).all()


def restock_product(db: Session, product_id: int, restock_data: ProductRestock, user_id: int) -> Product:
    product = get_product_by_id(db, product_id, user_id)
    new_qty = _log_transaction(db, user_id, product, "restock", restock_data.quantity, note=restock_data.note)
    product.stock_quantity = new_qty
    db.commit()
    db.refresh(product)
    return product


def adjust_stock(db: Session, product_id: int, adjustment: StockAdjustment, user_id: int) -> Product:
    product = get_product_by_id(db, product_id, user_id)
    new_qty = product.stock_quantity + adjustment.quantity_change
    if new_qty < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock cannot go below 0")
    _log_transaction(db, user_id, product, "adjustment", adjustment.quantity_change, note=adjustment.note)
    product.stock_quantity = new_qty
    db.commit()
    db.refresh(product)
    return product


def get_inventory_transactions(db: Session, product_id: int, user_id: int, limit: int = 50):
    get_product_by_id(db, product_id, user_id)  # verify ownership
    return (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.product_id == product_id, InventoryTransaction.user_id == user_id)
        .order_by(InventoryTransaction.created_at.desc())
        .limit(limit)
        .all()
    )

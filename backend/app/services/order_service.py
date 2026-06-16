from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory_transaction import InventoryTransaction
from app.schemas.order import OrderCreate


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


def get_all_orders(db: Session, user_id: int, status_filter: Optional[str] = None,
                   skip: int = 0, limit: int = 100) -> List[Order]:
    query = db.query(Order).filter(Order.user_id == user_id)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


def get_order_by_id(db: Session, order_id: int, user_id: int) -> Order:
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def create_order(db: Session, order_data: OrderCreate, user_id: int) -> Order:
    # Verify customer belongs to user
    customer = db.query(Customer).filter(Customer.id == order_data.customer_id, Customer.user_id == user_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    total_amount = 0.0
    order_items_to_create = []

    for item in order_data.items:
        product = db.query(Product).filter(
            Product.id == item.product_id, Product.user_id == user_id
        ).with_for_update().first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Product with id {item.product_id} not found")
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}, Requested: {item.quantity}"
            )
        order_items_to_create.append({"product": product, "quantity": item.quantity, "price": product.price})
        total_amount += product.price * item.quantity

    order = Order(user_id=user_id, customer_id=order_data.customer_id, total_amount=total_amount, status="completed")
    db.add(order)
    db.flush()

    for item_data in order_items_to_create:
        product = item_data["product"]
        db.add(OrderItem(order_id=order.id, product_id=product.id,
                         quantity=item_data["quantity"], price=item_data["price"]))
        new_qty = _log_transaction(db, user_id, product, "sale", -item_data["quantity"],
                                   reference_id=order.id, note=f"Order #{order.id}")
        product.stock_quantity = new_qty

    try:
        db.commit()
        db.refresh(order)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create order")
    return order


def cancel_order(db: Session, order_id: int, user_id: int) -> Order:
    order = get_order_by_id(db, order_id, user_id)
    if order.status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order already cancelled")

    # Restore stock for each item
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.user_id == user_id).with_for_update().first()
        if product:
            new_qty = _log_transaction(db, user_id, product, "cancel_restore", item.quantity,
                                       reference_id=order_id, note=f"Cancelled Order #{order_id}")
            product.stock_quantity = new_qty

    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return order

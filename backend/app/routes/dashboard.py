from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.inventory_transaction import InventoryTransaction
from app.auth.jwt import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uid = current_user.id
    total_products = db.query(Product).filter(Product.user_id == uid).count()
    total_customers = db.query(Customer).filter(Customer.user_id == uid).count()
    total_orders = db.query(Order).filter(Order.user_id == uid).count()
    low_stock = db.query(Product).filter(Product.user_id == uid, Product.stock_quantity <= 10).count()
    revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.user_id == uid, Order.status != "cancelled"
    ).scalar() or 0.0
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_alerts": low_stock,
        "total_revenue": round(float(revenue), 2),
    }

@router.get("/revenue-by-category")
def get_revenue_by_category(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uid = current_user.id
    results = (
        db.query(Product.category, func.sum(OrderItem.price * OrderItem.quantity).label("revenue"))
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Product.user_id == uid, Order.user_id == uid, Order.status != "cancelled")
        .group_by(Product.category)
        .all()
    )
    return [{"category": r.category or "Uncategorized", "revenue": round(float(r.revenue), 2)} for r in results]

@router.get("/stock-status")
def get_stock_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uid = current_user.id
    products = db.query(Product).filter(Product.user_id == uid).limit(10).all()
    pending = (
        db.query(OrderItem.product_id, func.sum(OrderItem.quantity).label("pending"))
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.user_id == uid, Order.status == "completed")
        .group_by(OrderItem.product_id)
        .all()
    )
    pending_map = {p.product_id: p.pending for p in pending}
    return [
        {
            "name": f"{p.name} ({p.sku})",
            "current_stock": p.stock_quantity,
            "pending_orders": pending_map.get(p.id, 0)
        }
        for p in products
    ]

@router.get("/low-stock-table")
def get_low_stock_table(
    threshold: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    uid = current_user.id
    products = db.query(Product).filter(Product.user_id == uid, Product.stock_quantity <= threshold).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "category": p.category,
            "current_stock": p.stock_quantity,
            "safety_threshold": 10,
            "alert_status": "Critical" if p.stock_quantity == 0 else "Low",
        }
        for p in products
    ]

@router.get("/recent-orders")
def get_recent_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uid = current_user.id
    orders = db.query(Order).filter(Order.user_id == uid).order_by(Order.created_at.desc()).limit(10).all()
    result = []
    for o in orders:
        first_item = o.items[0] if o.items else None
        result.append({
            "order_id": f"#{str(o.id).zfill(4)}",
            "date": o.created_at.strftime("%m/%d/%Y"),
            "customer": o.customer.name if o.customer else "N/A",
            "product": first_item.product.name if first_item and first_item.product else "—",
            "category": first_item.product.category if first_item and first_item.product else "—",
            "total": round(o.total_amount, 2),
            "status": o.status,
            "items_count": len(o.items),
        })
    return result

@router.get("/recent-activity")
def get_recent_activity(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uid = current_user.id
    txns = (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.user_id == uid)
        .order_by(InventoryTransaction.created_at.desc())
        .limit(15)
        .all()
    )
    result = []
    for t in txns:
        result.append({
            "id": t.id,
            "product_id": t.product_id,
            "product_name": t.product.name if t.product else "N/A",
            "transaction_type": t.transaction_type,
            "quantity_change": t.quantity_change,
            "quantity_before": t.quantity_before,
            "quantity_after": t.quantity_after,
            "note": t.note,
            "created_at": t.created_at.strftime("%m/%d/%Y %H:%M"),
        })
    return result

@router.get("/revenue-trend")
def get_revenue_trend(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uid = current_user.id
    from sqlalchemy import cast, Date
    results = (
        db.query(
            cast(Order.created_at, Date).label("date"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("orders")
        )
        .filter(Order.user_id == uid, Order.status != "cancelled")
        .group_by(cast(Order.created_at, Date))
        .order_by(cast(Order.created_at, Date).desc())
        .limit(30)
        .all()
    )
    return [{"date": str(r.date), "revenue": round(float(r.revenue), 2), "orders": r.orders} for r in results]

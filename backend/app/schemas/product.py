from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime

class ProductCreate(BaseModel):
    name: str
    sku: str
    category: Optional[str] = "General"
    price: float
    stock_quantity: int = 0

    @validator("price")
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v

    @validator("stock_quantity")
    def stock_non_negative(cls, v):
        if v < 0:
            raise ValueError("Stock quantity cannot be negative")
        return v

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None

class ProductRestock(BaseModel):
    quantity: int
    note: Optional[str] = None

    @validator("quantity")
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Restock quantity must be greater than 0")
        return v

class StockAdjustment(BaseModel):
    quantity_change: int
    note: Optional[str] = None

class ProductResponse(BaseModel):
    id: int
    user_id: int
    name: str
    sku: str
    category: Optional[str]
    price: float
    stock_quantity: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

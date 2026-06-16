from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryTransactionResponse(BaseModel):
    id: int
    product_id: int
    transaction_type: str
    quantity_change: int
    quantity_before: int
    quantity_after: int
    reference_id: Optional[int]
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

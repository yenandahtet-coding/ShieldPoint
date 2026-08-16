from pydantic import BaseModel, Field
from typing import Optional

class TransactionRequest(BaseModel):
    senderId: str
    receiverPhone: Optional[str] = None
    merchantId: Optional[str] = None
    amount: float = Field(..., gt=0)
    note: Optional[str] = None
    pin: Optional[str] = None
    country: Optional[str] = None

class TransactionResponse(BaseModel):
    transactionId: str
    status: str
    message: str

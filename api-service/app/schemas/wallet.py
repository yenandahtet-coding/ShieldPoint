from pydantic import BaseModel

class WalletResponse(BaseModel):
    walletId: str
    balance: float
    currency: str

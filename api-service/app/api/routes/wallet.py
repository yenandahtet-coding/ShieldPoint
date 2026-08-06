from fastapi import APIRouter
from app.schemas.wallet import WalletResponse
from app.services.wallet_service import WalletService

router = APIRouter()

@router.get("/wallet", response_model=WalletResponse)
def get_wallet(user_id: str):
    return WalletService.get_wallet(user_id)

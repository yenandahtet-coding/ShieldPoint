from fastapi import APIRouter, status
from app.schemas.transaction import TransactionRequest, TransactionResponse
from app.services.transaction_service import TransactionService

router = APIRouter()

@router.post("/transfer", response_model=TransactionResponse, status_code=status.HTTP_202_ACCEPTED)
def transfer(request: TransactionRequest):
    return TransactionService.process_transfer(request)

@router.post("/deposit", response_model=TransactionResponse, status_code=status.HTTP_202_ACCEPTED)
def deposit(request: TransactionRequest):
    return TransactionService.process_deposit(request)

@router.post("/withdraw", response_model=TransactionResponse, status_code=status.HTTP_202_ACCEPTED)
def withdraw(request: TransactionRequest):
    return TransactionService.process_withdraw(request)

@router.get("/transactions")
def get_transactions(user_id: str):
    return TransactionService.get_transactions(user_id)

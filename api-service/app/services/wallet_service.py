from app.schemas.wallet import WalletResponse

class WalletService:
    @staticmethod
    def get_wallet(user_id: str) -> WalletResponse:
        # Mocked DB read
        return WalletResponse(
            walletId=f"W-{user_id}",
            balance=100000.0,
            currency="MMK"
        )

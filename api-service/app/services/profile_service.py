from app.schemas.profile import ProfileResponse

class ProfileService:
    @staticmethod
    def get_profile(user_id: str) -> ProfileResponse:
        return ProfileResponse(
            id=user_id,
            name="John Doe",
            phone="09123456789"
        )

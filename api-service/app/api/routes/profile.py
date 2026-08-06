from fastapi import APIRouter
from app.schemas.profile import ProfileResponse
from app.services.profile_service import ProfileService

router = APIRouter()

@router.get("/profile", response_model=ProfileResponse)
def get_profile(user_id: str):
    return ProfileService.get_profile(user_id)

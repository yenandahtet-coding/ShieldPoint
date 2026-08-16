from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

class ProfileStatusResponse(BaseModel):
    id: str
    status: str

@router.post("/admin/profiles/{user_id}/freeze", response_model=ProfileStatusResponse)
async def freeze_profile(user_id: str):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration is missing")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"
    payload = {"status": "FROZEN"}
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(url, json=payload, headers=headers)
        
        if response.status_code not in [200, 204] or len(response.json()) == 0:
            raise HTTPException(status_code=404, detail=f"Profile {user_id} not found or update failed")
            
        return {"id": user_id, "status": "FROZEN"}

@router.post("/admin/profiles/{user_id}/unfreeze", response_model=ProfileStatusResponse)
async def unfreeze_profile(user_id: str):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration is missing")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"
    payload = {"status": "ACTIVE"}
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(url, json=payload, headers=headers)
        
        if response.status_code not in [200, 204] or len(response.json()) == 0:
            raise HTTPException(status_code=404, detail=f"Profile {user_id} not found or update failed")
            
        return {"id": user_id, "status": "ACTIVE"}

@router.get("/admin/profiles/{user_id}/status", response_model=ProfileStatusResponse)
async def get_profile_status(user_id: str):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration is missing")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=status"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        
        if response.status_code == 200 and len(response.json()) > 0:
            status = response.json()[0].get("status", "ACTIVE")
            return {"id": user_id, "status": status}
            
        raise HTTPException(status_code=404, detail=f"Profile {user_id} not found")

from fastapi import APIRouter, Depends
from middleware.auth import verify_token

router = APIRouter()

@router.get("/")
async def get_dashboard_data(user = Depends(verify_token)):
    # Implement dashboard data logic
    return {"message": "Dashboard data", "user_id": user["sub"]}
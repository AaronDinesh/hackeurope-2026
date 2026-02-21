from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class StoryboardIn(BaseModel):
    plan_id: str
    n_frames: int = 6

@router.post("/v1/storyboard")
async def storyboard(payload: StoryboardIn):
    return {
        "plan_id": payload.plan_id,
        "storyboard": [
            {"shot_id": "s1", "image_url": None, "description": "placeholder"}
        ],
    }

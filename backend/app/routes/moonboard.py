from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class MoonboardIn(BaseModel):
    plan_id: str
    n_tiles: int = 6

@router.post("/v1/moonboard")
async def moonboard(payload: MoonboardIn):
    return {
        "plan_id": payload.plan_id,
        "moonboard": [
            {"tile_id": "m1", "image_url": None, "caption": "placeholder"}
        ],
    }

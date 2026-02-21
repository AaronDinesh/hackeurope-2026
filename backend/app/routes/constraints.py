from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class PromptIn(BaseModel):
    prompt: str

@router.post("/v1/constraints")
async def constraints(payload: PromptIn):
    return {
        "plan_id": "temp",
        "negatives": ["blurry", "low quality"]
    }

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.store import get_plan, update_plan
from backend.app.services.nanobanana import generate_and_store_image

router = APIRouter()

class MoodboardIn(BaseModel):
    plan_id: str

@router.post("/v1/moodboard")
async def moodboard(payload: MoodboardIn):
    plan = get_plan(payload.plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Unknown plan_id")

    prompt = plan["prompt"]
    cached = plan.get("moodboard")
    if cached:
        return {"plan_id": payload.plan_id, "moodboard": cached}

    base = f"Create a moodboard from user prompt. Prompt : {prompt}"

    try:
        moodboard_image = await generate_and_store_image(
            base,
            prefix=f"moodboard-{payload.plan_id}-m1",
            description="Moodboard image",
        )
        update_plan(payload.plan_id, {"moodboard": moodboard_image})

        return {"plan_id": payload.plan_id, "moodboard": moodboard_image}

    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

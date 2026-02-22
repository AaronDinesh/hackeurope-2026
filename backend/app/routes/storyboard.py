from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.store import get_plan, update_plan
from backend.app.services.nanobanana import generate_and_store_image

router = APIRouter()

class StoryboardIn(BaseModel):
    plan_id: str

@router.post("/v1/storyboard")
async def storyboard(payload: StoryboardIn):
    plan = get_plan(payload.plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Unknown plan_id")

    prompt = plan["prompt"]
    cached = plan.get("storyboard")
    if cached:
        return {"plan_id": payload.plan_id, "storyboard": cached}

    base = f"Create a board with different frames like they are cut scenes of a short video from user prompt. Prompt : {prompt}"

    try:
        storyboard_image = await generate_and_store_image(
            base,
            prefix=f"storyboard-{payload.plan_id}-m1",
            description="Storyboard image",
        )
        update_plan(payload.plan_id, {"storyboard": storyboard_image})

        return {"plan_id": payload.plan_id, "storyboard": storyboard_image}

    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

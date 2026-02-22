import asyncio

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.nanobanana import generate_and_store_image
from backend.app.store import create_plan, update_plan
from backend.app.services.gemini import gemini_generate_text_bundle

router = APIRouter()

class PromptIn(BaseModel):
    prompt: str

@router.post("/v1/constraints")
async def constraints(payload: PromptIn):
    try:
        bundle = await gemini_generate_text_bundle(payload.prompt)

        # Minimal validation (keep it simple)
        if "negatives" not in bundle or "palette" not in bundle or "summary" not in bundle:
            raise ValueError("Gemini bundle missing required keys")

        plan_id = create_plan(prompt=payload.prompt, bundle=bundle)

        moodboard_prompt = f"Create a moodboard from user prompt. Prompt : {payload.prompt}"
        storyboard_prompt = (
            "Create a board with different frames like they are cut scenes of a short video "
            f"from user prompt. Prompt : {payload.prompt}"
        )

        moodboard_task = generate_and_store_image(
            moodboard_prompt,
            prefix=f"moodboard-{plan_id}-m1",
            description="Moodboard image",
        )
        storyboard_task = generate_and_store_image(
            storyboard_prompt,
            prefix=f"storyboard-{plan_id}-m1",
            description="Storyboard image",
        )
        moodboard, storyboard = await asyncio.gather(moodboard_task, storyboard_task)

        update_plan(plan_id, {"moodboard": moodboard, "storyboard": storyboard})
        return {
            "plan_id": plan_id,
            "negatives": bundle["negatives"],
            "moodboard": moodboard,
            "storyboard": storyboard,
        }

    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

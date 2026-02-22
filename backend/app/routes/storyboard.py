from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.nanobanana import build_storyboard_prompt, generate_and_store_image

router = APIRouter()

class StoryboardIn(BaseModel):
    prompt: str

@router.post("/v1/storyboard")
async def storyboard(payload: StoryboardIn):
    base = build_storyboard_prompt(payload.prompt)

    try:
        storyboard_image = await generate_and_store_image(
            base,
            prefix="storyboard",
            description="Storyboard image",
        )
        return {"storyboard": storyboard_image}

    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

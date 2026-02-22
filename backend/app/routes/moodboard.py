from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.nanobanana import build_moodboard_prompt, generate_and_store_image

router = APIRouter()

class MoodboardIn(BaseModel):
    prompt: str

@router.post("/v1/moodboard")
async def moodboard(payload: MoodboardIn):
    base = build_moodboard_prompt(payload.prompt)

    try:
        moodboard_image = await generate_and_store_image(
            base,
            prefix="moodboard",
            description="Moodboard image",
        )
        return {"moodboard": moodboard_image}

    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

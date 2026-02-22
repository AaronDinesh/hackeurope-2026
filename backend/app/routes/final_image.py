from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.nanobanana import generate_and_store_image

router = APIRouter()


class FinalImageIn(BaseModel):
    prompt: str
    constraints: str | None = None
    hexcodes: str | None = None
    summary: str | None = None
    moodboard_url: str | None = None
    storyboard_url: str | None = None


def _build_final_image_prompt(payload: FinalImageIn) -> str:
    parts = [
        "Create one polished final keyframe image for the concept below.",
        f"USER PROMPT:\n{payload.prompt}",
    ]

    if payload.constraints:
        parts.append(f"NEGATIVE CONSTRAINTS:\n{payload.constraints}")
    if payload.hexcodes:
        parts.append(f"COLOR PALETTE (HEX):\n{payload.hexcodes}")
    if payload.summary:
        parts.append(f"CREATIVE SUMMARY:\n{payload.summary}")
    if payload.moodboard_url:
        parts.append(f"MOODBOARD REFERENCE IMAGE URL:\n{payload.moodboard_url}")
    if payload.storyboard_url:
        parts.append(f"STORYBOARD REFERENCE IMAGE URL:\n{payload.storyboard_url}")

    parts.append(
        "Output a single cinematic still that reflects the style, lighting, composition, and tone."
    )
    return "\n\n".join(parts)


@router.post("/v1/final-image")
async def final_image(payload: FinalImageIn):
    try:
        prompt = _build_final_image_prompt(payload)
        image = await generate_and_store_image(
            prompt,
            prefix="final-image",
            description="Final generated image",
        )
        return {"final_image": image}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

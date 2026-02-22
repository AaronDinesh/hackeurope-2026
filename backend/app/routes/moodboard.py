from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.store import get_plan
from backend.app.services.nanobanana import decode_and_store_data_url, generate_image

router = APIRouter()
GENERATED_DIR = Path(__file__).resolve().parents[2] / "static" / "generated"

class MoodboardIn(BaseModel):
    plan_id: str

@router.post("/v1/moodboard")
async def moodboard(payload: MoodboardIn):
    plan = get_plan(payload.plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Unknown plan_id")

    prompt = plan["prompt"]
    base = f"Create a moodboard from user prompt. Prompt : {prompt}"

    try:
        data_url = await generate_image(base)
        filename = decode_and_store_data_url(
            data_url=data_url,
            out_dir=GENERATED_DIR,
            prefix=f"moodboard-{payload.plan_id}-m1",
        )
        items = [{
            "tile_id": "m1",
            "image_url": f"/static/generated/{filename}",
            "caption": "Moodboard tile 1",
        }]

        return {"plan_id": payload.plan_id, "moodboard": items}

    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

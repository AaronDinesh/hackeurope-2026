from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.gemini import gemini_generate_text_bundle

router = APIRouter()

class PromptIn(BaseModel):
    prompt: str


@router.post("/v1/hexcodes")
async def hexcodes(payload: PromptIn):
    try:
        bundle = await gemini_generate_text_bundle(payload.prompt)
        palette = bundle.get("palette")
        if palette is None:
            raise ValueError("Gemini bundle missing palette")
        return {"hexcodes": palette}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

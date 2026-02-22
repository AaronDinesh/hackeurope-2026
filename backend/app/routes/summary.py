from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.gemini import gemini_generate_text_bundle

router = APIRouter()

class PromptIn(BaseModel):
    prompt: str


@router.post("/v1/summary")
async def summary(payload: PromptIn):
    try:
        bundle = await gemini_generate_text_bundle(payload.prompt)
        summary_data = bundle.get("summary")
        if summary_data is None:
            raise ValueError("Gemini bundle missing summary")
        return {"summary": summary_data}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.gemini import gemini_generate_text_bundle

router = APIRouter()

class PromptIn(BaseModel):
    prompt: str

@router.post("/v1/constraints")
async def constraints(payload: PromptIn):
    try:
        bundle = await gemini_generate_text_bundle(payload.prompt)

        negatives = bundle.get("negatives")
        if not isinstance(negatives, list) or not negatives:
            raise ValueError("Gemini bundle missing required keys")

        # Return a single prompt string for UI consumption.
        return {"negatives": ", ".join(negatives)}

    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

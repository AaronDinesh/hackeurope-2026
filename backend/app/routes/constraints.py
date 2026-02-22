from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.store import create_plan
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
        return {"plan_id": plan_id, "negatives": bundle["negatives"]}

    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
from fastapi import APIRouter, HTTPException
from backend.app.store import get_plan

router = APIRouter()

@router.get("/v1/hexcodes")
async def hexcodes(plan_id: str):
    plan = get_plan(plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Unknown plan_id")
    return {"plan_id": plan_id, "palette": plan["bundle"]["palette"]}

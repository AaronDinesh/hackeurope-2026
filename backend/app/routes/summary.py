from fastapi import APIRouter

router = APIRouter()

@router.get("/v1/summary")
async def summary(plan_id: str):
    return {
        "plan_id": plan_id,
        "summary": {
            "logline": "Temporary summary",
            "style": "Temporary style",
            "keywords": ["temp", "demo"],
        },
    }

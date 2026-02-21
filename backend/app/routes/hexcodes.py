from fastapi import APIRouter

router = APIRouter()

@router.get("/v1/hexcodes")
async def hexcodes(plan_id: str):
    return {
        "plan_id": plan_id,
        "palette": {
            "primary": ["#FF6B6B"],
            "secondary": ["#1E1E1E"],
            "accent": ["#00D4FF"],
            "background": ["#0A0A0A"],
        },
    }

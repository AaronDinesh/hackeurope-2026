import uuid
from typing import Any, Dict

_PLANS: Dict[str, Dict[str, Any]] = {}

def create_plan(prompt: str, bundle: Dict[str, Any]) -> str:
    plan_id = uuid.uuid4().hex
    _PLANS[plan_id] = {
        "prompt": prompt,
        "bundle": bundle,  # contains negatives, palette, summary
    }
    return plan_id

def get_plan(plan_id: str) -> Dict[str, Any] | None:
    return _PLANS.get(plan_id)
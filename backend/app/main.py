from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import (
    GEMINI_API_KEY,
    GEMINI_IMAGE_MODEL,
    GEMINI_MODEL,
    VEO_API_KEY,
    VEO_MODEL,
)
from backend.app.routes.constraints import router as constraints_router
from backend.app.routes.hexcodes import router as hexcodes_router
from backend.app.routes.summary import router as summary_router
from backend.app.routes.moodboard import router as moodboard_router
from backend.app.routes.storyboard import router as storyboard_router
from backend.app.routes.veo import router as veo_router
from backend.app.routes.final_image import router as final_image_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "tauri://localhost",
        "https://tauri.localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = Path(__file__).resolve().parent.parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


def _mask_key(key: str | None) -> str | None:
    if not key:
        return None
    if len(key) <= 8:
        return "*" * len(key)
    return f"{key[:6]}...{key[-4:]}"

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/debug/runtime-config")
async def debug_runtime_config():
    return {
        "gemini_model": GEMINI_MODEL,
        "gemini_image_model": GEMINI_IMAGE_MODEL,
        "veo_model": VEO_MODEL,
        "gemini_api_key_masked": _mask_key(GEMINI_API_KEY),
        "veo_api_key_masked": _mask_key(VEO_API_KEY),
        "same_key": GEMINI_API_KEY == VEO_API_KEY,
    }

app.include_router(constraints_router)
app.include_router(hexcodes_router)
app.include_router(summary_router)
app.include_router(moodboard_router)
app.include_router(storyboard_router)
app.include_router(veo_router)
app.include_router(final_image_router)

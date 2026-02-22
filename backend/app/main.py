from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.app.routes.constraints import router as constraints_router
from backend.app.routes.hexcodes import router as hexcodes_router
from backend.app.routes.summary import router as summary_router
from backend.app.routes.moodboard import router as moodboard_router
from backend.app.routes.storyboard import router as storyboard_router

app = FastAPI()

static_dir = Path(__file__).resolve().parent.parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(constraints_router)
app.include_router(hexcodes_router)
app.include_router(summary_router)
app.include_router(moodboard_router)
app.include_router(storyboard_router)

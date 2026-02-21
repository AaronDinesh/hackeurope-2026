from fastapi import FastAPI

from backend.app.routes.constraints import router as constraints_router
from backend.app.routes.hexcodes import router as hexcodes_router
from backend.app.routes.summary import router as summary_router
from backend.app.routes.moonboard import router as moonboard_router
from backend.app.routes.storyboard import router as storyboard_router

app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(constraints_router)
app.include_router(hexcodes_router)
app.include_router(summary_router)
app.include_router(moonboard_router)
app.include_router(storyboard_router)

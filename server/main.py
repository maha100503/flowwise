import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
from contextlib import asynccontextmanager
from database import init_db_async
from routes.workflows import router as workflows_router
from routes.execute import router as execute_router
from routes.copilot import router as copilot_router
from routes.websocket import router as websocket_router
from routes.microsoft import router as microsoft_router
from routes.upload import router as upload_router

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Lifespan: initialize database on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    await init_db_async()
    yield
    # Clean up (if needed)


app = FastAPI(
    title="FlowCraft API",
    description="Backend API for the FlowCraft workflow editor",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:9173",
        "http://127.0.0.1:9173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(workflows_router)
app.include_router(execute_router)
app.include_router(copilot_router)
app.include_router(websocket_router)
app.include_router(microsoft_router)
app.include_router(upload_router)


@app.get("/")
def root():
    return {
        "name": "FlowCraft API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "workflows": "/api/workflows",
            "execute": "/api/execute/{workflow_id}",
            "executions": "/api/executions/{workflow_id}",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8088, reload=True)

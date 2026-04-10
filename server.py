"""
StadiumSmart – FastAPI Backend
Serves the static web app and proxies Gemini API calls server-side.
Deployable to Google Cloud Run.
"""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import httpx
from pydantic import BaseModel

app = FastAPI(
    title="StadiumSmart API",
    description="Smart venue assistant backend for large sporting events",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Static Files ──────────────────────────────────────────────────
STATIC_DIR = Path(__file__).parent
app.mount("/css", StaticFiles(directory=str(STATIC_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(STATIC_DIR / "js")), name="js")


# ── Models ────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    system_context: str = ""


class ChatResponse(BaseModel):
    reply: str
    status: str = "ok"


# ── Routes ────────────────────────────────────────────────────────
@app.get("/", response_class=FileResponse, include_in_schema=False)
async def root():
    """Serve the SPA entry point."""
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(str(index_path))


@app.get("/health")
async def health():
    """Health check endpoint for Cloud Run."""
    return {"status": "ok", "service": "StadiumSmart"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Proxy chat requests to the Gemini API server-side.
    The API key is read from the GEMINI_API_KEY environment variable.
    This keeps the key off the client-side entirely.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured on server. Set GEMINI_API_KEY env var.",
        )

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"models/gemini-2.0-flash:generateContent?key={api_key}"
    )

    # Build contents from history + new message
    contents = req.history + [{"role": "user", "parts": [{"text": req.message}]}]

    payload = {
        "system_instruction": {
            "parts": [{"text": req.system_context}] if req.system_context else [],
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 512,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Gemini API error: {exc.response.text}",
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Network error: {str(exc)}")

    data = response.json()
    reply_text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )

    if not reply_text:
        raise HTTPException(status_code=500, detail="Empty response from Gemini")

    return ChatResponse(reply=reply_text)


# ── Entry Point ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)

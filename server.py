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
    Keeps the API key secure on the backend.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return JSONResponse(
            status_code=503,
            content={
                "reply": "⚠️ Assistant is currently offline (API key not configured on server).",
                "status": "error"
            }
        )

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"models/gemini-2.0-flash:generateContent?key={api_key}"
    )

    # Build contents from history + new message
    # Ensure history follows [user, model, user, model] pattern
    contents = req.history + [{"role": "user", "parts": [{"text": req.message}]}]

    payload = {
        "system_instruction": {
            "parts": [{"text": req.system_context}] if req.system_context else [],
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024,
            "topP": 0.95,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(endpoint, json=payload)
            
            if response.status_code != 200:
                err_data = response.json()
                msg = err_data.get("error", {}).get("message", "Unknown Gemini error")
                return JSONResponse(
                    status_code=response.status_code,
                    content={"reply": f"🤖 Gemini Error: {msg}", "status": "error"}
                )
            
            data = response.json()
            reply_text = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )

            if not reply_text:
                return ChatResponse(reply="I'm sorry, I couldn't generate a response. Please try again.", status="error")

            return ChatResponse(reply=reply_text)

    except httpx.ReadTimeout:
        return JSONResponse(status_code=504, content={"reply": "⏳ Request timed out. Gemini is taking too long to respond.", "status": "error"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"reply": f"💥 Server Error: {str(e)}", "status": "error"})


# ── Entry Point ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)

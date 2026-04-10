"""
StadiumSmart – FastAPI Backend
Enterprise-grade backend with Google SDK integration and structured logging.
Deployable to Google Cloud Run.
"""

import os
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

# Official Google SDKs
import google.generativeai as genai
try:
    import google.cloud.logging
    logging_client = google.cloud.logging.Client()
    logging_client.setup_logging()
except Exception:
    # Fallback for local development without GCP credentials
    import logging
    logging.basicConfig(level=logging.INFO)

# ── Configuration ────────────────────────────────────────────────
class Settings(BaseSettings):
    gemini_api_key: str = ""
    port: int = 8080
    model_name: str = "gemini-3.1-flash-lite-preview"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)

app = FastAPI(
    title="StadiumSmart API",
    description="Smart venue assistant backend powered by Gemini 3.1",
    version="1.1.0",
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
    history: List[dict] = []
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
    return {"status": "ok", "service": "StadiumSmart", "sdk": "google-generativeai"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Proxy chat requests to Gemini using the official Google SDK.
    """
    if not settings.gemini_api_key:
        return JSONResponse(
            status_code=503,
            content={
                "reply": "⚠️ Assistant is currently offline (API key not configured on server).",
                "status": "error"
            }
        )

    try:
        # Use simple model generation for now (stateless proxy)
        # In a real app, we'd use start_chat() for session management
        model = genai.GenerativeModel(
            model_name=settings.model_name,
            system_instruction=req.system_context if req.system_context else None
        )

        # Convert history to SDK format if needed
        # Our frontend history is already formatted for Gemini (role, parts: [{text}])
        # genai SDK expects [{'role': 'user', 'parts': ['text']}]
        formatted_history = []
        for h in req.history:
            formatted_history.append({
                "role": "user" if h["role"] == "user" else "model",
                "parts": [h["parts"][0]["text"]]
            })

        response = await model.generate_content_async(
            contents=formatted_history + [{"role": "user", "parts": [req.message]}],
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1024,
                top_p=0.95,
            )
        )

        if not response.text:
            return ChatResponse(reply="I'm sorry, I couldn't generate a response. Please try again.", status="error")

        return ChatResponse(reply=response.text)

    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"reply": f"💥 Server Error: {str(e)}", "status": "error"}
        )


# ── Entry Point ───────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=settings.port, reload=False)

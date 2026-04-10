import pytest
from fastapi.testclient import TestClient
from server import app, settings
import google.generativeai as genai

client = TestClient(app)

# ── 1. Basic Health & Connectivity ───────────────────────────────
def test_health_endpoint():
    """Verify that the health check is functional for Cloud Run."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok", 
        "service": "StadiumSmart", 
        "sdk": "google-generativeai"
    }

def test_root_serves_index():
    """Verify that the SPA entry point is served."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

# ── 2. Input Validation ──────────────────────────────────────────
def test_chat_invalid_payload():
    """Verify that malformed requests are rejected with 422."""
    # Missing 'message' field
    response = client.post("/api/chat", json={"not_a_message": "hi"})
    assert response.status_code == 422

def test_chat_empty_payload():
    """Verify empty requests are handled."""
    response = client.post("/api/chat", json={})
    assert response.status_code == 422

# ── 3. Error Handling & State ────────────────────────────────────
def test_chat_offline_when_key_missing(monkeypatch):
    """Verify 503 is returned if API key is not configured."""
    monkeypatch.setattr(settings, "gemini_api_key", "")
    response = client.post("/api/chat", json={"message": "hi"})
    assert response.status_code == 503
    assert "offline" in response.json()["reply"].lower()

# ── 4. Mocking SDK Behavior (The 'Professional' Test) ───────────
class MockResponse:
    def __init__(self, text):
        self.text = text

# We use sync Mock since the SDK call in server.py is awaited, 
# but we can mock the async generation if we want to be precise.
# For simplicity in this suite, we'll mock the high-level method.

@pytest.mark.asyncio
async def test_chat_success_mock(monkeypatch):
    """Verify the API contract when Gemini returns a success."""
    
    # Mock the async method on GenerativeModel
    async def mock_generate_content(*args, **kwargs):
        return MockResponse("Hello! I am your MetroArena assistant.")

    # We patch the class method
    monkeypatch.setattr("google.generativeai.GenerativeModel.generate_content_async", mock_generate_content)
    monkeypatch.setattr(settings, "gemini_api_key", "mock_key")

    # FastAPI TestClient doesn't support async calls directly to routes like this easily without AsyncClient,
    # but for endpoint logic verification, we can use the default client if the route is async.
    response = client.post("/api/chat", json={"message": "What is Gate A?"})
    
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "status" in data
    assert data["status"] == "ok"
    assert "MetroArena" in data["reply"]

def test_chat_server_error_handling(monkeypatch):
    """Verify that server-side exceptions are caught and returned as 500."""
    
    async def mock_crash(*args, **kwargs):
        raise Exception("Google API Quota Exceeded")

    monkeypatch.setattr("google.generativeai.GenerativeModel.generate_content_async", mock_crash)
    monkeypatch.setattr(settings, "gemini_api_key", "mock_key")

    response = client.post("/api/chat", json={"message": "crash me"})
    assert response.status_code == 500
    assert "Server Error" in response.json()["reply"]

# 🏟️ StadiumSmart – Smart Venue Assistant

> **PromptWars Hackathon Submission** | Vertical: Attendee Experience & Real-Time Venue Coordination

StadiumSmart is an AI-powered concierge web application that transforms the physical event experience for attendees at large-scale sporting venues. It addresses crowd movement confusion, long waiting times, and real-time coordination through a beautiful, mobile-first Progressive Web App backed by Google AI.

---

## 🎯 Chosen Vertical

**Attendee Experience & Real-Time Venue Coordination**

Attendees at large stadiums face three core pain points:
1. **Navigation confusion** – complex multi-gate, multi-level venues with no live guidance
2. **Inefficient queue management** – no visibility into which gate, restroom, or food stall has the shortest wait
3. **Missed information** – match updates, emergency alerts, and announcements are fragmented

StadiumSmart solves all three in a single, lightweight application.

---

## 🧠 Approach & Logic

### Architecture

```
┌─────────────────────────────────────────────┐
│          Browser (SPA – Pure HTML/JS)        │
│                                              │
│  Dashboard → Match Card + Gate Status        │
│  Assistant → Gemini Chat (crowd-aware)       │
│  Map       → Google Maps Embed               │
│  Crowds    → Simulated Real-Time Intel       │
│  Experience→ Personalized Seat Guide + FAQ   │
└──────────────────────┬──────────────────────┘
                       │ HTTPS
          ┌────────────▼────────────┐
          │   FastAPI Server        │
          │   (Google Cloud Run)    │
          │                         │
          │  GET  /          → SPA  │
          │  POST /api/chat  → AI   │
          │  GET  /health    → ✓    │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │   Google Gemini API     │
          │   gemini-2.0-flash      │
          └─────────────────────────┘
```

### How the AI Works

The Gemini assistant uses a **venue-aware system prompt** that includes:
- Complete gate, section, amenity, and transit information
- **Live crowd data** injected at request time (which gate has the shortest queue *right now*)
- Policies, FAQ, and accessibility information

This means answers like "Which gate should I use?" are dynamically personalized based on real-time conditions — not static text.

### Crowd Intelligence Engine

A lightweight JavaScript simulation engine (`crowd.js`) generates realistic wait times for:
- All 5 entry gates
- 4 food & beverage stalls
- 4 restroom blocks
- 2 ATMs
- Medical centre
- Merchandise shop

Data **refreshes every 30 seconds** with smooth drift (no sudden jumps), simulating realistic crowd patterns during a live event.

---

## 🛠️ How the Solution Works

### 5 Core Sections

| Section | What it does |
|---|---|
| **🏠 Dashboard** | Live match scorecard (animated), gate crowd badges, quick access buttons |
| **🤖 AI Assistant** | Multi-turn Gemini chat with crowd context injected. Suggested questions auto-populated |
| **🗺️ Venue Map** | Google Maps Embed API showing stadium location + satellite view. Gates reference card + transit guide |
| **👥 Crowd Intel** | Sorted list of all locations by crowd level. Color-coded bars (🟢 Low / 🟡 Moderate / 🔴 High) |
| **🎟️ My Experience** | Personalized seat details, smart tips for current conditions, venue FAQ |

### Key User Flows

**"I'm lost — how do I get to my seat?"**
→ User opens Assistant → asks "How do I reach Stand 15?" → Gemini responds with gate direction (Gate B, Level 2), current crowd level at Gate B, and a tip to use the west entranceway if it's busy.

**"Where's the shortest food queue?"**
→ User checks Crowd Intel tab → sorted list shows West Wing Canteen has the least wait → user navigates there.

**"How do I exit quickly after the match?"**
→ User asks the AI assistant → receives personalized exit strategy based on their section.

---

## 🔧 Google Services Used

| Service | Integration |
|---|---|
| **Gemini API** (`gemini-2.0-flash`) | Core AI assistant with multi-turn chat and crowd-aware system prompts |
| **Google Maps Embed API** | Interactive satellite map of stadium location with POI context |
| **Google Fonts** | `Inter` + `Space Grotesk` for premium typography |
| **Google Cloud Run** | FastAPI server for production deployment + server-side API key security |

---

## 🚀 Running Locally

### Option A: Open Directly (No Server)

The app works as a pure static site for demo purposes:

```bash
# Just open index.html in your browser
# (Use a local server to avoid CORS issues with ES modules)
python -m http.server 8080
# Then visit http://localhost:8080
```

### Option B: FastAPI Server (Recommended)

```bash
# Install dependencies
pip install -r requirements.txt

# Set your API key (never hardcode it)
export GEMINI_API_KEY="your_key_here"   # Linux/macOS
set GEMINI_API_KEY=your_key_here         # Windows

# Run the server
python server.py

# Visit http://localhost:8080
```

### Option C: Docker

```bash
docker build -t stadiumsmart .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key stadiumsmart
```

### Deploying to Google Cloud Run

```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
gcloud run deploy stadiumsmart \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key

# Your app will be available at the Cloud Run URL
```

---

## 💡 Assumptions Made

1. **Demo Venue**: Uses a fictional "MetroArena Stadium" in Mumbai as the demo venue. In production, venue data would be loaded from a CMS or API.
2. **Simulated Crowd Data**: Real deployments would integrate with venue management systems (ticketing APIs, sensor data) for actual crowd counts. The simulation uses realistic patterns (drift updates, bounded values).
3. **Match Score**: Simulated cricket score. Real integration would use a sports data API (e.g., Cricbuzz API, SportMonks).
4. **Ticket Data**: The "My Experience" section uses hardcoded seat data (Stand 15, Row G, Seat 24). Real deployment would authenticate users and fetch their ticket data.
5. **API Key Modes**: 
   - When running via FastAPI (`/api/chat` endpoint), the key is server-side via env var
   - When opening as a static HTML file, users enter their Gemini key client-side (stored in `localStorage`, never transmitted to any server except Google)

---

## 📁 Project Structure

```
StadiumSmart/
├── index.html          # SPA entry point – all 5 sections
├── css/
│   └── style.css       # Full design system (glassmorphism, dark sport theme)
├── js/
│   ├── app.js          # SPA router, dashboard, chat, crowd renderer
│   ├── gemini.js       # Gemini API client (streaming-simulated)
│   ├── map.js          # Google Maps Embed + transit info
│   ├── crowd.js        # Real-time crowd simulation engine
│   └── data.js         # Static venue data & Gemini system prompt
├── server.py           # FastAPI backend (Cloud Run)
├── requirements.txt    # Python deps
├── Dockerfile          # Cloud Run container
├── .gitignore
└── README.md
```

---

## ✅ Evaluation Criteria Coverage

| Criteria | Implementation |
|---|---|
| **Code Quality** | ES6 modules, clean separation of concerns, JSDoc-style comments, PEP 8 Python |
| **Security** | API key never committed; client-side keys stored in `localStorage` only; server-side env-var mode available |
| **Efficiency** | Zero npm dependencies; lazy-load map only when tab is opened; crowd data drifts (no full reload) |
| **Testing** | Manual test checklist below; Pydantic validation on API models |
| **Accessibility** | ARIA labels on all interactive elements, `role` attributes, `aria-live` regions, keyboard navigation, `prefers-reduced-motion` support, focus-visible styles |
| **Google Services** | Gemini API (AI), Maps Embed API (venue map), Google Fonts (typography), Cloud Run (deployment) |

---

## 🧪 Manual Test Checklist

- [ ] Open `index.html` → dashboard renders with match card and gate badges
- [ ] Gate badges show colour-coded crowd levels (green/amber/red)
- [ ] Click "Crowd Intel" → all locations listed with wait bars
- [ ] Wait 30 seconds → crowd data updates automatically
- [ ] Click "Map" → Google Maps embed loads (stadium location)
- [ ] Click "AI Assistant" → API key modal appears (if no saved key)
- [ ] Enter Gemini key → welcome message appears
- [ ] Click a suggested question → answer streams in
- [ ] Manually type "Which gate has the shortest queue?" → Gemini responds with live data
- [ ] Press Tab → all interactive elements receive visible focus
- [ ] Resize to mobile (375px) → layout adapts correctly

---

## 📄 License

MIT License – see LICENSE file for details.

---

*Built with ❤️ using Google Gemini API, Google Maps, FastAPI, and Pure HTML/CSS/JS.*

# LILA BLACK — Player Journey Visualizer

A web-based game telemetry visualization tool for Level Designers.
Visualize player journeys, kills, deaths, loot, and heatmaps on game minimaps.

---

## Requirements

Make sure the following are installed on your machine before running:

| Requirement | Version | Download |
|-------------|---------|----------|
| **Python** | 3.10 or higher | https://python.org/downloads |
| **Node.js** | 18 or higher | https://nodejs.org |
| **pip** | comes with Python | — |
| **npm** | comes with Node.js | — |

### Check if already installed

```bash
python3 --version   # should show 3.10+
node --version      # should show v18+
pip3 --version
npm --version
```

---

## Setup (First Time Only)

### Step 1 — Clone the repo

```bash
git clone https://github.com/Sethu1904/lila-black-visualizer.git
cd lila-black-visualizer
```

### Step 2 — Add the player_data folder

> ⚠️ The `player_data/` folder is **not included** in the repo (too large for git).
> You must copy it manually into the project root.

After cloning, your folder structure should look like this:

```
lila-black-visualizer/
├── backend/
├── frontend/
├── player_data/          ← copy this folder here manually
│   ├── February_10/
│   ├── February_11/
│   ├── February_12/
│   ├── February_13/
│   ├── February_14/
│   └── minimaps/
│       ├── AmbroseValley_Minimap.png
│       ├── GrandRift_Minimap.png
│       └── Lockdown_Minimap.jpg
├── setup.sh
├── README.md
├── ARCHITECTURE.md
└── INSIGHTS.md
```

### Step 3 — Run the setup script

This installs all Python and Node.js dependencies automatically:

```bash
bash setup.sh
```

That's it for setup. You only need to do this once.

---

## Running the App

You need **two terminals** open at the same time.

### Terminal 1 — Start the Backend

```bash
cd backend
./start.sh
```

Or manually:

```bash
cd backend
pip3 install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

Wait until you see:
```
INFO: Data load complete: 89104 rows
INFO: Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 — Start the Frontend

```bash
cd frontend
npm install        # only needed first time if you skipped setup.sh
npm run dev
```

Frontend will be available at: **http://localhost:3000**

---

## Open the App

Once both servers are running, open your browser and go to:

👉 **http://localhost:3000**

---

## If You Get a "Port Already in Use" Error

Kill the old process and restart:

```bash
# Kill port 8000 (backend)
lsof -ti :8000 | xargs kill -9

# Kill port 3000 (frontend)
lsof -ti :3000 | xargs kill -9
```

Then start both servers again.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Uvicorn (Python) |
| Data processing | Pandas + PyArrow |
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Map rendering | HTML5 Canvas |

---

## API Endpoints

Once the backend is running, all endpoints are available at `http://localhost:8000`:

| Endpoint | Description |
|----------|-------------|
| `GET /` | API status and list of endpoints |
| `GET /docs` | Interactive Swagger UI to test endpoints |
| `GET /api/health` | Health check + total rows loaded |
| `GET /api/minimap/{map_name}` | Serve minimap image (AmbroseValley / GrandRift / Lockdown) |
| `GET /api/filters` | All available maps, dates, and matches |
| `GET /api/matches?map_id=&date=` | Filtered match list with player counts |
| `GET /api/match/{id}/paths` | Player movement paths for canvas rendering |
| `GET /api/match/{id}/events` | Kill / death / loot events for a match |
| `GET /api/heatmap?type=kills` | Heatmap grid (kills / deaths / movement / loot) |
| `GET /api/analytics` | Aggregated stats, charts data, top matches |
| `GET /api/stats/overview` | Global summary across all data |

---

## Project Structure

```
lila-black-visualizer/
├── backend/
│   ├── main.py            # FastAPI app + all API endpoints
│   ├── data_loader.py     # Parquet loader, runs in background thread
│   ├── requirements.txt   # Python dependencies
│   └── start.sh           # Quick-start script
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # Main dashboard (tab switcher)
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── components/
│   │   │   ├── Header.tsx            # Top nav bar
│   │   │   ├── Sidebar.tsx           # Filters panel
│   │   │   ├── MapCanvas.tsx         # Canvas: player paths + events
│   │   │   ├── HeatmapCanvas.tsx     # Canvas: heatmap overlay
│   │   │   ├── Timeline.tsx          # Playback timeline
│   │   │   ├── StatsPanel.tsx        # Right stats panel
│   │   │   └── tabs/
│   │   │       ├── MapView.tsx       # Tab 1: Map View
│   │   │       ├── Heatmaps.tsx      # Tab 2: Heatmaps
│   │   │       ├── Events.tsx        # Tab 3: Events
│   │   │       └── Analytics.tsx     # Tab 4: Analytics
│   │   ├── hooks/
│   │   │   ├── useFilters.ts
│   │   │   └── useMatchData.ts
│   │   └── lib/
│   │       ├── api.ts                # All fetch calls to backend
│   │       └── mapUtils.ts           # World → canvas coordinate mapping
│   └── package.json
│
├── setup.sh           # One-shot install script
├── README.md
├── ARCHITECTURE.md    # Design decisions and tradeoffs
└── INSIGHTS.md        # 3 data insights from the game data
```

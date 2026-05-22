# Architecture — LILA BLACK Player Journey Visualizer

## Tech Stack & Why

| Layer | Choice | Reason |
|-------|--------|--------|
| **Backend** | FastAPI (Python) | Native parquet/pandas ecosystem; fast async endpoints; auto-generates Swagger docs |
| **Frontend** | Next.js 14 (App Router) | React-based, fast dev experience, SSR-ready, easy Vercel deployment |
| **Styling** | Tailwind CSS | Rapid dark-theme UI without custom CSS overhead |
| **Charts** | Recharts | Declarative React charts; good for time-series and donut charts |
| **Map rendering** | HTML5 Canvas | Full pixel-level control for paths, event markers, and heatmap overlays |
| **Data format** | Apache Parquet (pyarrow) | Columnar format, fast reads, compact storage for 89K rows |

---

## Data Flow

```
player_data/**/*.nakama-0  (1,243 parquet files)
        │
        ▼
data_loader.py  ──  background thread on startup
  • Walks February_10 … February_14 folders
  • Reads each file with pyarrow → pandas DataFrame
  • Decodes event column (bytes → UTF-8 string)
  • Detects is_bot: UUID user_id = human, numeric = bot
  • Tags each row with date parsed from folder name
  • Concatenates all → single 89,104-row global DataFrame (cached in memory)
        │
        ▼
FastAPI endpoints  (http://localhost:8000/api/*)
  • Filter/aggregate the in-memory DataFrame per request
  • Return JSON to frontend
  • Serve minimap images via FileResponse
        │
        ▼
Next.js frontend  (http://localhost:3000)
  • Fetches data from API on filter change
  • Draws player paths & event markers on HTML5 Canvas
  • Renders heatmap as radial gradient blobs on Canvas
  • Displays charts with Recharts
```

---

## Coordinate Mapping (World → Minimap)

The game uses a 3D world coordinate system. For 2D minimap rendering, only `x` and `z` are used (`y` is elevation/height and is ignored).

Each map has a known **origin** and **scale** that defines how world coordinates map to the minimap image (1024×1024 px):

```
u = (x - origin_x) / scale          → normalized 0–1 horizontal
v = (z - origin_z) / scale          → normalized 0–1 vertical

pixel_x = u * canvas_width
pixel_y = (1 - v) * canvas_height   ← Y axis is FLIPPED (image origin = top-left)
```

| Map | Scale | Origin X | Origin Z |
|-----|-------|----------|----------|
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

The canvas is sized to the rendered image element dimensions (not fixed 1024px), so the same formula works at any display resolution by substituting `canvas_width` / `canvas_height`.

---

## Assumptions Made

| Ambiguity | Assumption |
|-----------|------------|
| `ts` column stores very small epoch offsets (match-relative, not wall-clock time) | Treated as relative match time; sorted by `ts` to reconstruct timeline |
| No explicit `Kill` / `Killed` human-vs-human events found in sampled data | BotKill (human kills bot) dominates; Kill/Killed events are rare but handled |
| No weapon or distance metadata in the parquet schema | Event detail cards show event type, position, and player type only |
| February 14 is a partial day | Loaded as-is with a "partial day" note; no special handling needed |
| Files with no `.parquet` extension | Passed directly to `pyarrow.parquet.read_table()` — works without extension |
| Map POI names not in the data | Grid-based zone labels used for heatmap statistics (e.g., "Zone A1") |

---

## Major Tradeoffs

| Decision | Option A (chosen) | Option B (rejected) | Why |
|----------|-------------------|---------------------|-----|
| **Data loading** | Load all 89K rows into memory on startup | Query parquet files per request | Memory (~50MB) is trivial; eliminates per-request I/O latency |
| **Heatmap rendering** | Canvas radial gradients (client-side) | Server-side PIL image generation | Lower server load; smoother UX; instant intensity slider updates |
| **Map rendering** | HTML5 Canvas overlay on `<img>` | Leaflet.js / MapLibre | No tile server needed; pixel-perfect control; simpler codebase |
| **Position sampling** | Every 5th Position event per player per request | All position events | Reduces per-match payload from ~5K to ~1K points; still smooth paths |
| **Heatmap grid** | 50×50 histogram bins (server-side) | Raw point cloud (client-side) | Bounded response size regardless of data volume; fast to render |
| **Frontend framework** | Next.js (React) | Streamlit / plain HTML | Easier to build interactive multi-tab UI; deployable to Vercel |

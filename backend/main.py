"""
main.py – FastAPI application for LILA BLACK Player Journey Visualizer
"""

from __future__ import annotations

import os
import logging
from pathlib import Path
from typing import List, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

import data_loader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="LILA BLACK Visualizer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MINIMAPS_DIR = Path(data_loader.MINIMAPS_DIR)

MINIMAP_FILES = {
    "AmbroseValley": "AmbroseValley_Minimap.png",
    "GrandRift": "GrandRift_Minimap.png",
    "Lockdown": "Lockdown_Minimap.jpg",
}

HUMAN_COLORS = [
    "#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8",
    "#0ea5e9", "#38bdf8", "#06b6d4", "#67e8f9",
]
BOT_COLORS = [
    "#ef4444", "#f87171", "#dc2626", "#b91c1c",
    "#f97316", "#fb923c", "#ea580c", "#c2410c",
]

KILL_EVENTS = {"Kill", "BotKill"}
DEATH_EVENTS = {"Killed", "BotKilled", "KilledByStorm"}
MOVE_EVENTS = {"Position", "BotPosition"}
LOOT_EVENTS = {"Loot"}


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    data_loader.start_loading()


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "name": "LILA BLACK Visualizer API",
        "status": "running",
        "loaded": data_loader.is_loaded(),
        "total_rows": data_loader.total_rows(),
        "docs": "http://localhost:8000/docs",
        "frontend": "http://localhost:3000",
        "endpoints": [
            "/api/health",
            "/api/filters",
            "/api/matches",
            "/api/match/{match_id}/paths",
            "/api/match/{match_id}/events",
            "/api/heatmap",
            "/api/analytics",
            "/api/minimap/{map_name}",
            "/api/stats/overview",
        ],
    }


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "loaded": data_loader.is_loaded(),
        "total_rows": data_loader.total_rows(),
    }


# ── Minimap images ────────────────────────────────────────────────────────────
@app.get("/api/minimap/{map_name}")
def get_minimap(map_name: str):
    filename = MINIMAP_FILES.get(map_name)
    if not filename:
        raise HTTPException(status_code=404, detail=f"Unknown map: {map_name}")
    fp = MINIMAPS_DIR / filename
    if not fp.exists():
        raise HTTPException(status_code=404, detail=f"Minimap file not found: {fp}")
    media_type = "image/jpeg" if filename.endswith(".jpg") else "image/png"
    return FileResponse(str(fp), media_type=media_type)


# ── Filters ───────────────────────────────────────────────────────────────────
@app.get("/api/filters")
def get_filters():
    df = data_loader.get_df()
    if df.empty:
        return {"maps": [], "dates": [], "matches": []}

    maps = sorted(df["map_id"].dropna().unique().tolist())
    dates = sorted(df["date"].dropna().unique().tolist())

    match_groups = (
        df.groupby(["match_id", "map_id", "date"])
        .agg(player_count=("user_id", "nunique"), event_count=("event", "count"))
        .reset_index()
    )
    matches = match_groups.to_dict(orient="records")

    return {"maps": maps, "dates": dates, "matches": matches}


# ── Matches ───────────────────────────────────────────────────────────────────
@app.get("/api/matches")
def get_matches(
    map_id: Optional[str] = None,
    date: Optional[str] = None,
):
    df = data_loader.get_df()
    if df.empty:
        return []

    sub = df.copy()
    if map_id:
        sub = sub[sub["map_id"] == map_id]
    if date:
        sub = sub[sub["date"] == date]

    if sub.empty:
        return []

    groups = (
        sub.groupby(["match_id", "map_id", "date"])
        .apply(
            lambda g: pd.Series(
                {
                    "human_count": int(g.loc[~g["is_bot"], "user_id"].nunique()),
                    "bot_count": int(g.loc[g["is_bot"], "user_id"].nunique()),
                    "event_count": len(g),
                }
            )
        )
        .reset_index()
    )
    return groups.to_dict(orient="records")


# ── Match paths ───────────────────────────────────────────────────────────────
@app.get("/api/match/{match_id}/paths")
def get_match_paths(
    match_id: str,
    player_type: str = Query("all", description="all | human | bot"),
):
    df = data_loader.get_df()
    if df.empty:
        raise HTTPException(status_code=404, detail="No data loaded")

    sub = df[df["match_id"] == match_id]
    if sub.empty:
        raise HTTPException(status_code=404, detail=f"Match {match_id} not found")

    if player_type == "human":
        sub = sub[~sub["is_bot"]]
    elif player_type == "bot":
        sub = sub[sub["is_bot"]]

    map_id = sub["map_id"].iloc[0]

    players = []
    human_idx = 0
    bot_idx = 0

    for uid, grp in sub.groupby("user_id"):
        is_bot = bool(grp["is_bot"].iloc[0])
        if is_bot:
            color = BOT_COLORS[bot_idx % len(BOT_COLORS)]
            bot_idx += 1
        else:
            color = HUMAN_COLORS[human_idx % len(HUMAN_COLORS)]
            human_idx += 1

        grp_sorted = grp.sort_values("ts")

        # Separate position events (sample) from non-position events (keep all)
        pos_mask = grp_sorted["event"].isin(MOVE_EVENTS)
        pos_rows = grp_sorted[pos_mask].iloc[::5]  # every 5th
        non_pos_rows = grp_sorted[~pos_mask]

        path_df = pd.concat([pos_rows, non_pos_rows]).sort_values("ts")

        path_points = []
        for _, row in path_df.iterrows():
            ts_val = row["ts"]
            if hasattr(ts_val, "timestamp"):
                ts_ms = int(ts_val.timestamp() * 1000)
            else:
                ts_ms = int(ts_val)
            path_points.append(
                {
                    "x": float(row["x"]),
                    "z": float(row["z"]),
                    "ts": ts_ms,
                    "event": row["event"],
                }
            )

        players.append(
            {
                "user_id": str(uid),
                "is_bot": is_bot,
                "color": color,
                "path": path_points,
            }
        )

    return {"map_id": map_id, "players": players}


# ── Match events ──────────────────────────────────────────────────────────────
@app.get("/api/match/{match_id}/events")
def get_match_events(
    match_id: str,
    event_types: Optional[str] = Query(None, description="comma-separated event types"),
    player_type: str = Query("all"),
):
    df = data_loader.get_df()
    if df.empty:
        raise HTTPException(status_code=404, detail="No data loaded")

    sub = df[df["match_id"] == match_id]
    if sub.empty:
        raise HTTPException(status_code=404, detail=f"Match {match_id} not found")

    # Exclude pure position events
    sub = sub[~sub["event"].isin(MOVE_EVENTS)]

    if player_type == "human":
        sub = sub[~sub["is_bot"]]
    elif player_type == "bot":
        sub = sub[sub["is_bot"]]

    if event_types:
        types = [e.strip() for e in event_types.split(",")]
        sub = sub[sub["event"].isin(types)]

    if sub.empty:
        return []

    sub = sub.sort_values("ts")
    ts_start = sub["ts"].min()

    result = []
    for _, row in sub.iterrows():
        ts_val = row["ts"]
        ts_start_val = ts_start
        if hasattr(ts_val, "timestamp"):
            ts_ms = int(ts_val.timestamp() * 1000)
            diff_s = (ts_val - ts_start_val).total_seconds()
        else:
            ts_ms = int(ts_val)
            diff_s = float(ts_val - ts_start_val) / 1000.0

        result.append(
            {
                "user_id": str(row["user_id"]),
                "is_bot": bool(row["is_bot"]),
                "x": float(row["x"]),
                "z": float(row["z"]),
                "ts": ts_ms,
                "event": row["event"],
                "ts_seconds": round(diff_s, 2),
            }
        )

    return result


# ── Heatmap ───────────────────────────────────────────────────────────────────
@app.get("/api/heatmap")
def get_heatmap(
    map_id: Optional[str] = None,
    date: Optional[str] = None,
    match_id: Optional[str] = None,
    type: str = Query("kills", description="kills | deaths | movement | loot"),
):
    df = data_loader.get_df()
    if df.empty:
        return {"map_id": map_id or "AmbroseValley", "points": [], "max_weight": 0}

    sub = df.copy()
    if map_id:
        sub = sub[sub["map_id"] == map_id]
    if date:
        sub = sub[sub["date"] == date]
    if match_id:
        sub = sub[sub["match_id"] == match_id]

    # Filter by heatmap type
    if type == "kills":
        sub = sub[sub["event"].isin(KILL_EVENTS)]
    elif type == "deaths":
        sub = sub[sub["event"].isin(DEATH_EVENTS)]
    elif type == "movement":
        sub = sub[sub["event"].isin(MOVE_EVENTS)]
        sub = sub.iloc[::10]  # heavy sample
    elif type == "loot":
        sub = sub[sub["event"].isin(LOOT_EVENTS)]

    if sub.empty:
        return {"map_id": map_id or "AmbroseValley", "points": [], "max_weight": 0}

    resolved_map = sub["map_id"].iloc[0] if map_id is None else map_id

    # Bin into a 50x50 grid then return centers with counts as weight
    x_vals = sub["x"].astype(float).values
    z_vals = sub["z"].astype(float).values

    bins = 50
    H, xedges, zedges = np.histogram2d(x_vals, z_vals, bins=bins)
    max_weight = float(H.max()) if H.max() > 0 else 1.0

    points = []
    for i in range(bins):
        for j in range(bins):
            w = float(H[i, j])
            if w > 0:
                cx = float((xedges[i] + xedges[i + 1]) / 2)
                cz = float((zedges[j] + zedges[j + 1]) / 2)
                points.append({"x": cx, "z": cz, "weight": w})

    return {"map_id": resolved_map, "points": points, "max_weight": max_weight}


# ── Analytics ─────────────────────────────────────────────────────────────────
@app.get("/api/analytics")
def get_analytics(
    map_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    df = data_loader.get_df()
    if df.empty:
        return _empty_analytics()

    sub = df.copy()
    if map_id:
        sub = sub[sub["map_id"] == map_id]
    if date_from:
        sub = sub[sub["date"] >= date_from]
    if date_to:
        sub = sub[sub["date"] <= date_to]

    if sub.empty:
        return _empty_analytics()

    # Overview
    kills = int(sub["event"].isin(KILL_EVENTS).sum())
    deaths = int(sub["event"].isin(DEATH_EVENTS).sum())
    loot = int(sub["event"].isin(LOOT_EVENTS).sum())
    storm_deaths = int((sub["event"] == "KilledByStorm").sum())
    total_matches = sub["match_id"].nunique()
    total_players = sub["user_id"].nunique()
    human_count = int(sub.loc[~sub["is_bot"], "user_id"].nunique())
    bot_count = int(sub.loc[sub["is_bot"], "user_id"].nunique())

    # Avg match duration
    match_durations = (
        sub.groupby("match_id")["ts"]
        .agg(lambda x: (x.max() - x.min()).total_seconds() if hasattr(x.max() - x.min(), "total_seconds") else 0)
    )
    avg_duration = float(match_durations.mean()) if not match_durations.empty else 0

    # Kills over time
    by_date = sub.groupby("date")
    kills_over_time = []
    for date, grp in by_date:
        kills_over_time.append(
            {
                "date": date,
                "kills": int(grp["event"].isin(KILL_EVENTS).sum()),
                "deaths": int(grp["event"].isin(DEATH_EVENTS).sum()),
                "loot": int(grp["event"].isin(LOOT_EVENTS).sum()),
            }
        )
    kills_over_time.sort(key=lambda r: r["date"])

    # Top matches by kill count
    match_stats = (
        sub.groupby(["match_id", "map_id"])
        .apply(
            lambda g: pd.Series(
                {
                    "kill_count": int(g["event"].isin(KILL_EVENTS).sum()),
                    "player_count": g["user_id"].nunique(),
                }
            )
        )
        .reset_index()
        .sort_values("kill_count", ascending=False)
        .head(10)
    )
    top_matches = match_stats.to_dict(orient="records")

    # Event breakdown (non-position)
    event_counts = sub[~sub["event"].isin(MOVE_EVENTS)]["event"].value_counts()
    event_breakdown = {k: int(v) for k, v in event_counts.items()}

    # Matches by map
    matches_by_map = {
        k: int(v)
        for k, v in sub.groupby("map_id")["match_id"].nunique().items()
    }

    return {
        "overview": {
            "total_kills": kills,
            "total_deaths": deaths,
            "total_loot": loot,
            "storm_deaths": storm_deaths,
            "total_matches": total_matches,
            "total_players": total_players,
            "avg_match_duration_seconds": round(avg_duration, 1),
            "human_count": human_count,
            "bot_count": bot_count,
        },
        "kills_over_time": kills_over_time,
        "top_matches": top_matches,
        "event_breakdown": event_breakdown,
        "matches_by_map": matches_by_map,
    }


def _empty_analytics():
    return {
        "overview": {
            "total_kills": 0,
            "total_deaths": 0,
            "total_loot": 0,
            "storm_deaths": 0,
            "total_matches": 0,
            "total_players": 0,
            "avg_match_duration_seconds": 0,
            "human_count": 0,
            "bot_count": 0,
        },
        "kills_over_time": [],
        "top_matches": [],
        "event_breakdown": {},
        "matches_by_map": {},
    }


# ── Overview stats ────────────────────────────────────────────────────────────
@app.get("/api/stats/overview")
def stats_overview():
    df = data_loader.get_df()
    if df.empty:
        return {"total_rows": 0, "total_matches": 0, "total_players": 0}
    return {
        "total_rows": len(df),
        "total_matches": df["match_id"].nunique(),
        "total_players": df["user_id"].nunique(),
        "maps": df["map_id"].nunique(),
        "dates": sorted(df["date"].unique().tolist()),
    }

"""
data_loader.py
Loads all parquet files from the player_data directory into a global DataFrame.
Loading is done lazily (on first request) in a background thread.
"""

import os
import glob
import threading
import logging
import re
import pandas as pd
import pyarrow.parquet as pq

logger = logging.getLogger(__name__)

# ── paths ────────────────────────────────────────────────────────────────────
DATA_ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "player_date"
)
DATA_ROOT = os.path.normpath(DATA_ROOT)

MINIMAPS_DIR = os.path.join(DATA_ROOT, "minimaps")

# ── global state ─────────────────────────────────────────────────────────────
_df: pd.DataFrame | None = None
_loading = False
_load_lock = threading.Lock()
_load_event = threading.Event()

# month name → month number
MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
}

UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def _parse_date(folder_name: str) -> str:
    """February_10 → '2026-02-10'"""
    parts = folder_name.split("_")
    if len(parts) == 2:
        month_str = parts[0].lower()
        day_str = parts[1].zfill(2)
        month_num = MONTH_MAP.get(month_str, 1)
        return f"2026-{month_num:02d}-{day_str}"
    return "2026-01-01"


def _is_bot(user_id: str) -> bool:
    """Bots have numeric user_ids; humans have UUIDs."""
    return not UUID_RE.match(str(user_id))


def _load_all() -> pd.DataFrame:
    """Walk DATA_ROOT, read every *.nakama-0 file, return combined DataFrame."""
    frames = []
    pattern = os.path.join(DATA_ROOT, "*", "*.nakama-0")
    files = glob.glob(pattern)

    # Also try non-recursive direct structure
    if not files:
        pattern2 = os.path.join(DATA_ROOT, "**", "*.nakama-0")
        files = glob.glob(pattern2, recursive=True)

    logger.info("Found %d parquet files under %s", len(files), DATA_ROOT)

    for fp in files:
        try:
            folder = os.path.basename(os.path.dirname(fp))
            date_str = _parse_date(folder)

            table = pq.read_table(fp)
            df_chunk = table.to_pandas()

            # Decode event bytes → str
            if df_chunk["event"].dtype == object:
                df_chunk["event"] = df_chunk["event"].apply(
                    lambda v: v.decode("utf-8") if isinstance(v, bytes) else str(v)
                )

            df_chunk["date"] = date_str
            df_chunk["is_bot"] = df_chunk["user_id"].apply(_is_bot)

            frames.append(df_chunk)
        except Exception as exc:
            logger.warning("Failed to load %s: %s", fp, exc)

    if not frames:
        logger.warning("No data loaded! Check DATA_ROOT: %s", DATA_ROOT)
        return pd.DataFrame(columns=[
            "user_id", "match_id", "map_id", "x", "y", "z",
            "ts", "event", "date", "is_bot",
        ])

    combined = pd.concat(frames, ignore_index=True)
    # Ensure ts is datetime
    if not pd.api.types.is_datetime64_any_dtype(combined["ts"]):
        combined["ts"] = pd.to_datetime(combined["ts"], unit="ms")

    logger.info(
        "Loaded %d rows across %d files",
        len(combined),
        len(frames),
    )
    return combined


def _background_load():
    global _df, _loading
    try:
        logger.info("Starting background data load…")
        result = _load_all()
        _df = result
        logger.info("Data load complete: %d rows", len(_df))
    except Exception as exc:
        logger.error("Data load failed: %s", exc)
        _df = pd.DataFrame(columns=[
            "user_id", "match_id", "map_id", "x", "y", "z",
            "ts", "event", "date", "is_bot",
        ])
    finally:
        _loading = False
        _load_event.set()


def start_loading():
    """Call once at app startup to kick off background loading."""
    global _loading
    with _load_lock:
        if _loading or _df is not None:
            return
        _loading = True
    t = threading.Thread(target=_background_load, daemon=True)
    t.start()


def get_df() -> pd.DataFrame:
    """
    Return the global DataFrame, waiting up to 120 s for the first load.
    After that, return whatever we have (may be empty on error).
    """
    if _df is None:
        start_loading()
        _load_event.wait(timeout=120)
    return _df if _df is not None else pd.DataFrame()


def is_loaded() -> bool:
    return _df is not None


def total_rows() -> int:
    df = get_df()
    return len(df)

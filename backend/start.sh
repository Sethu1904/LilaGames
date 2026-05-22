#!/bin/bash
# Start the LILA BLACK FastAPI backend
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting LILA BLACK backend on http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

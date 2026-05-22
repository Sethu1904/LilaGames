#!/bin/bash

# ─────────────────────────────────────────────────────────────
# LILA BLACK Visualizer — One-shot setup script
# Run this once on any new machine after cloning the repo.
# ─────────────────────────────────────────────────────────────

set -e  # exit on first error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════╗"
echo "║   LILA BLACK Visualizer — Setup               ║"
echo "╚═══════════════════════════════════════════════╝"
echo -e "${NC}"

# ── 1. Check Python ───────────────────────────────────────────
echo -e "${YELLOW}[1/5] Checking Python...${NC}"
if ! command -v python3 &>/dev/null; then
  echo -e "${RED}✗ Python3 not found. Install from https://python.org (3.10+)${NC}"
  exit 1
fi
PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"

# ── 2. Check Node.js ──────────────────────────────────────────
echo -e "${YELLOW}[2/5] Checking Node.js...${NC}"
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org (18+)${NC}"
  exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"

# ── 3. Check player_data folder ───────────────────────────────
echo -e "${YELLOW}[3/5] Checking player_data folder...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYER_DATA_DIR="$SCRIPT_DIR/player_data"

if [ ! -d "$PLAYER_DATA_DIR" ]; then
  echo -e "${RED}✗ player_data/ folder not found at: $PLAYER_DATA_DIR${NC}"
  echo ""
  echo "  The player_data folder is NOT included in the git repo (too large)."
  echo "  Copy it manually next to this folder:"
  echo ""
  echo "    lila-black-visualizer/"
  echo "    ├── backend/"
  echo "    ├── frontend/"
  echo "    ├── player_data/        ← copy this here"
  echo "    │   ├── February_10/"
  echo "    │   ├── February_11/"
  echo "    │   ├── February_12/"
  echo "    │   ├── February_13/"
  echo "    │   ├── February_14/"
  echo "    │   └── minimaps/"
  echo ""
  exit 1
else
  FILE_COUNT=$(find "$PLAYER_DATA_DIR" -name "*.nakama-0" | wc -l | tr -d ' ')
  echo -e "${GREEN}✓ player_data/ found ($FILE_COUNT parquet files)${NC}"
fi

# ── 4. Install Python dependencies ────────────────────────────
echo -e "${YELLOW}[4/5] Installing Python packages...${NC}"
cd "$SCRIPT_DIR/backend"
pip3 install -r requirements.txt --quiet
echo -e "${GREEN}✓ Python packages installed${NC}"

# ── 5. Install Node dependencies ──────────────────────────────
echo -e "${YELLOW}[5/5] Installing Node packages...${NC}"
cd "$SCRIPT_DIR/frontend"
npm install --silent
echo -e "${GREEN}✓ Node packages installed${NC}"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Setup complete! Run the app:                ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}║  Terminal 1 (backend):                        ║${NC}"
echo -e "${GREEN}║    cd backend && ./start.sh                   ║${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}║  Terminal 2 (frontend):                       ║${NC}"
echo -e "${GREEN}║    cd frontend && npm run dev                 ║${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}║  Then open: http://localhost:3000             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

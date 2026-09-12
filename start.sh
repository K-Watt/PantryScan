#!/usr/bin/env bash
#
# PantryScan — one-button launcher
# Boots PostgreSQL (in Colima), the .NET API, and the React UI, then opens the app.
# Press Ctrl+C to stop the API and UI (PostgreSQL keeps running in the background).
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_CONTAINER="pantryscan-pg"
DB_IMAGE="postgres:17-alpine"
DB_USER="pantryscan"
DB_PASS="pantryscan"
DB_NAME="pantryscandb"
API_URL="http://localhost:5169"
UI_URL="http://localhost:5173"

# Colima/docker live in Homebrew's bin; make sure it's on PATH.
export PATH="/opt/homebrew/bin:$PATH"

say() { printf "\033[1;36m▶ %s\033[0m\n" "$1"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$1"; }

API_PID=""
UI_PID=""
kill_port() {  # kill whatever is listening on a TCP port (and its children)
  local pids; pids=$(lsof -ti "tcp:$1" 2>/dev/null || true)
  [ -n "$pids" ] && kill $pids 2>/dev/null || true
  sleep 1
  pids=$(lsof -ti "tcp:$1" 2>/dev/null || true)
  [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
}
cleanup() {
  trap - INT TERM EXIT   # avoid re-entry
  echo
  say "Shutting down app (PostgreSQL stays up)…"
  [ -n "$UI_PID" ]  && kill "$UI_PID"  2>/dev/null || true
  [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null || true
  kill_port 5173   # Vite UI
  kill_port 5169   # .NET API
  pkill -f "PantryScan.Api" 2>/dev/null || true
  ok "Stopped. (Run ./start.sh again anytime.)"
}
trap cleanup INT TERM EXIT

# 1) Container runtime ---------------------------------------------------------
if ! colima status >/dev/null 2>&1; then
  say "Starting Colima (container VM)…"
  colima start --cpu 2 --memory 4 --disk 20 >/dev/null 2>&1
fi
ok "Colima running"

# 2) PostgreSQL ----------------------------------------------------------------
if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  ok "PostgreSQL already running"
elif docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  say "Starting PostgreSQL container…"
  docker start "$DB_CONTAINER" >/dev/null
else
  say "Creating PostgreSQL container…"
  docker run -d --name "$DB_CONTAINER"     -e "POSTGRES_USER=${DB_USER}"     -e "POSTGRES_PASSWORD=${DB_PASS}"     -e "POSTGRES_DB=${DB_NAME}"     -p 5432:5432     --restart unless-stopped     "$DB_IMAGE" >/dev/null
fi

# Readiness is checked inside the container, so no psql client is needed on the host.
say "Waiting for PostgreSQL to accept connections…"
for i in $(seq 1 40); do
  if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    ok "PostgreSQL ready"; break
  fi
  [ "$i" -eq 40 ] && { echo "PostgreSQL did not come up in time."; exit 1; }
  sleep 2
done

# 3) API -----------------------------------------------------------------------
say "Starting .NET API…"
kill_port 5169   # clear any stale API instance so the port is free
pkill -f "PantryScan.Api" 2>/dev/null || true
( cd "$ROOT/api/PantryScan.Api" && dotnet run ) > /tmp/pantryscan-api.log 2>&1 &
API_PID=$!
for i in $(seq 1 40); do
  curl -s "$API_URL/" >/dev/null 2>&1 && { ok "API up at $API_URL"; break; }
  [ "$i" -eq 40 ] && { echo "API failed to start — see /tmp/pantryscan-api.log"; tail -20 /tmp/pantryscan-api.log; exit 1; }
  sleep 2
done

# 4) UI (install deps if missing) ---------------------------------------------
if [ ! -d "$ROOT/ui-react/node_modules" ]; then
  say "Installing UI dependencies (first run)…"
  ( cd "$ROOT/ui-react" && npm install )
fi
say "Starting React UI…"
kill_port 5173   # clear any stale Vite instance so the port is free
( cd "$ROOT/ui-react" && npm run dev ) > /tmp/pantryscan-ui.log 2>&1 &
UI_PID=$!
for i in $(seq 1 40); do
  curl -s "$UI_URL" >/dev/null 2>&1 && { ok "UI up at $UI_URL"; break; }
  [ "$i" -eq 40 ] && { echo "UI failed to start — see /tmp/pantryscan-ui.log"; tail -20 /tmp/pantryscan-ui.log; exit 1; }
  sleep 1
done

# 5) Open browser --------------------------------------------------------------
open "$UI_URL"
echo
ok "PantryScan is running — $UI_URL"
echo "  Press Ctrl+C here to stop the app."

# Keep the script alive. An interruptible poll loop (rather than `wait`) ensures
# the Ctrl+C trap always fires promptly, and exits if either service dies on its own.
while kill -0 "$API_PID" 2>/dev/null && kill -0 "$UI_PID" 2>/dev/null; do
  sleep 1
done

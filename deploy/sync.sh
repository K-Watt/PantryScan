#!/usr/bin/env bash
# Poll origin/<branch> and redeploy when the commit changes.
#
# Safety properties:
#   - Builds BEFORE swapping, so a broken commit leaves the running app untouched.
#   - Exits in milliseconds when nothing changed (compares SHAs, no rebuild).
#   - Outbound only: the host reaches GitHub, nothing reaches in.
#   - After a failed build it stays on the new commit so it does not retry the
#     same broken build every interval; the next push triggers a fresh attempt.
set -uo pipefail

REPO="${PANTRYSCAN_REPO:-/opt/pantryscan}"
BRANCH="${PANTRYSCAN_BRANCH:-main}"
LOG="${PANTRYSCAN_LOG:-/var/log/pantryscan-deploy.log}"
COMPOSE="$REPO/deploy/docker-compose.yml"

log() { echo "[$(date '+%F %T')] $*" >> "$LOG"; }

cd "$REPO" || { log "ERROR: repo $REPO not found"; exit 1; }

if ! git fetch --quiet origin "$BRANCH" 2>>"$LOG"; then
    log "ERROR: git fetch failed"
    exit 1
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")
[ "$LOCAL" = "$REMOTE" ] && exit 0

log "change detected on $BRANCH: ${LOCAL:0:8} -> ${REMOTE:0:8}"
git reset --hard "origin/$BRANCH" >/dev/null 2>>"$LOG"
SUBJECT=$(git log -1 --pretty=%s)

log "building ${REMOTE:0:8} ($SUBJECT)"
if ! docker compose -f "$COMPOSE" build >>"$LOG" 2>&1; then
    log "BUILD FAILED for ${REMOTE:0:8} - previous version left running"
    exit 1
fi

log "build ok, restarting containers"
if ! docker compose -f "$COMPOSE" up -d >>"$LOG" 2>&1; then
    log "ERROR: compose up failed for ${REMOTE:0:8}"
    exit 1
fi

log "deployed ${REMOTE:0:8} ($SUBJECT)"

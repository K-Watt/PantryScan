#!/usr/bin/env bash
# Poll origin/<branch> and redeploy when the commit changes AND CI passed.
#
# Design notes:
#   - Polling, not a webhook: the host reaches out to GitHub, nothing reaches in.
#     No inbound port is opened. (A self-hosted Actions runner would also work,
#     but this repo is public, and running one on a public repo lets anyone with
#     a pull request execute code on this machine.)
#   - CI-gated: a commit is only deployed once GitHub Actions reports success,
#     so a commit that fails tests never reaches the host.
#   - Builds BEFORE swapping, so a broken build leaves the running app untouched.
#   - Quiet: exits in milliseconds when nothing changed, and reports a given
#     commit's pending/failed state only once instead of every poll.
set -uo pipefail

REPO="${PANTRYSCAN_REPO:-/opt/pantryscan}"
BRANCH="${PANTRYSCAN_BRANCH:-main}"
LOG="${PANTRYSCAN_LOG:-/var/log/pantryscan-deploy.log}"
STATE="${PANTRYSCAN_STATE:-/var/lib/pantryscan-deploy.state}"
SLUG="${PANTRYSCAN_SLUG:-K-Watt/PantryScan}"
REQUIRE_CI="${PANTRYSCAN_REQUIRE_CI:-1}"
COMPOSE="$REPO/deploy/docker-compose.yml"

log() { echo "[$(date '+%F %T')] $*" >> "$LOG"; }

# Log a message only once per (sha, kind) so a pending or failing commit does
# not spam the log on every poll.
log_once() {
    local key="$1"; shift
    [ -f "$STATE" ] && grep -qxF "$key" "$STATE" && return 0
    echo "$key" >> "$STATE"
    log "$@"
}

cd "$REPO" || { log "ERROR: repo $REPO not found"; exit 1; }

git fetch --quiet origin "$BRANCH" 2>>"$LOG" || { log "ERROR: git fetch failed"; exit 1; }

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")
[ "$LOCAL" = "$REMOTE" ] && exit 0

SHORT="${REMOTE:0:8}"

# --- CI gate -----------------------------------------------------------------
# Ask GitHub for the combined conclusion of the check runs on this commit.
# Unauthenticated works for public repos (60 requests/hour; we use ~12).
if [ "$REQUIRE_CI" = "1" ]; then
    API="https://api.github.com/repos/$SLUG/commits/$REMOTE/check-runs"
    JSON=$(curl -sf --max-time 30 -H "Accept: application/vnd.github+json" "$API" 2>/dev/null)

    if [ -z "$JSON" ]; then
        log_once "$REMOTE:apifail" "$SHORT: could not reach GitHub check-runs API; not deploying"
        exit 0
    fi

    read -r TOTAL DONE_N OK_N <<<"$(printf '%s' "$JSON" | python3 -c '
import sys, json
d = json.load(sys.stdin)
runs = d.get("check_runs", [])
total = len(runs)
done = sum(1 for r in runs if r.get("status") == "completed")
ok = sum(1 for r in runs if r.get("conclusion") in ("success", "neutral", "skipped"))
print(total, done, ok)
' 2>/dev/null)"

    if [ -z "${TOTAL:-}" ] || [ "$TOTAL" = "0" ]; then
        log_once "$REMOTE:noci" "$SHORT: no CI runs reported yet; waiting"
        exit 0
    fi
    if [ "$DONE_N" != "$TOTAL" ]; then
        log_once "$REMOTE:pending" "$SHORT: CI still running ($DONE_N/$TOTAL complete); waiting"
        exit 0
    fi
    if [ "$OK_N" != "$TOTAL" ]; then
        log_once "$REMOTE:failed" "$SHORT: CI FAILED ($OK_N/$TOTAL passed); NOT deploying"
        exit 0
    fi
    log "$SHORT: CI passed ($OK_N/$TOTAL)"
fi

# --- deploy ------------------------------------------------------------------
log "deploying ${LOCAL:0:8} -> $SHORT"
git reset --hard "origin/$BRANCH" >/dev/null 2>>"$LOG"
SUBJECT=$(git log -1 --pretty=%s)

log "building $SHORT ($SUBJECT)"
if ! docker compose -f "$COMPOSE" build >>"$LOG" 2>&1; then
    log "BUILD FAILED for $SHORT - previous version left running"
    exit 1
fi

log "build ok, restarting containers"
if ! docker compose -f "$COMPOSE" up -d >>"$LOG" 2>&1; then
    log "ERROR: compose up failed for $SHORT"
    exit 1
fi

log "deployed $SHORT ($SUBJECT)"

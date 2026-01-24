#!/usr/bin/env bash
# Apravas deployment script: self-debugging with safe rollback on failure.
# - App path in containers: /opt/apravas (avoids conflict with host /app)
# - On error: rollback to :previous images if health check fails; otherwise clean down.

set -e

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-indo-israel}"
DEPLOY_HEALTH_URL="${DEPLOY_HEALTH_URL:-http://localhost}"
HEALTH_RETRIES="${HEALTH_RETRIES:-12}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"

# Project root = directory of this script
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Resolve docker-compose command (v2: "docker compose" or v1: "docker-compose")
COMPOSE_CMD=""
for cmd in "docker compose" "docker-compose"; do
  if $cmd version >/dev/null 2>&1; then
    COMPOSE_CMD="$cmd"
    break
  fi
done
if [ -z "$COMPOSE_CMD" ]; then
  echo "[deploy] ERROR: docker and docker-compose (or 'docker compose') must be installed." >&2
  exit 1
fi

log() { echo "[deploy] $*"; }
err() { echo "[deploy] ERROR: $*" >&2; }

# ---------- Show frontend and backend URLs ----------
print_urls() {
  log "Frontend (app):  $DEPLOY_HEALTH_URL"
  log "Backend (API):   $DEPLOY_HEALTH_URL/api/"
}

# ---------- Preflight ----------
preflight() {
  log "Preflight checks..."
  if ! command -v docker >/dev/null 2>&1; then
    err "Docker is not installed or not in PATH."
    exit 1
  fi
  if [ ! -f "docker-compose.yml" ]; then
    err "docker-compose.yml not found in $ROOT"
    exit 1
  fi
  if [ ! -f "nginx/nginx.conf" ]; then
    err "nginx/nginx.conf not found."
    exit 1
  fi
  if [ ! -f ".env" ]; then
    err ".env file not found."
    echo "" >&2
    echo "  Create it from the example:" >&2
    echo "    cp .env.example .env" >&2
    echo "" >&2
    echo "  Then edit .env if needed and run this script again." >&2
    exit 1
  fi
  # Load APP_PORT from .env (Docker Compose also uses it for nginx port mapping)
  if [ -z "${APP_PORT}" ] && [ -f .env ]; then
    APP_PORT=$(grep -E '^APP_PORT=' .env 2>/dev/null | cut -d= -f2- | tr -d ' "')
  fi
  APP_PORT="${APP_PORT:-80}"
  # When using a non-80 port with default health URL, include port in DEPLOY_HEALTH_URL
  if [ "$APP_PORT" != "80" ] && [ "$DEPLOY_HEALTH_URL" = "http://localhost" ]; then
    DEPLOY_HEALTH_URL="http://localhost:${APP_PORT}"
  fi
  log "Preflight OK."
}

# ---------- Tag current :latest as :previous (for rollback) ----------
tag_previous() {
  log "Tagging current images as :previous (for rollback)..."
  for img in indo-israel-frontend indo-israel-backend; do
    if docker image inspect "$img:latest" >/dev/null 2>&1; then
      docker tag "$img:latest" "$img:previous" 2>/dev/null || true
      log "  $img:latest -> :previous"
    else
      log "  $img:latest not present (first deploy?); skip :previous"
    fi
  done
}

# ---------- Build ----------
do_build() {
  log "Building images..."
  if ! $COMPOSE_CMD build; then
    err "Build failed. Fix errors above and re-run. No containers were started."
    exit 1
  fi
  log "Build OK."
  print_urls
}

# ---------- Up ----------
do_up() {
  log "Starting containers..."
  if ! $COMPOSE_CMD up -d; then
    err "Start failed. Stopping any partial start (rollback to clean state)..."
    $COMPOSE_CMD down 2>/dev/null || true
    err "Containers stopped. Fix the error above and re-run."
    exit 1
  fi
  log "Containers started."
}

# ---------- Health check ----------
health_check() {
  local url="$1"
  local retries="$2"
  local interval="$3"
  local i=1
  while [ "$i" -le "$retries" ]; do
    if curl -sf --max-time 10 "${url}/api/health" >/dev/null 2>&1; then
      log "Health check OK (${url}/api/health)."
      return 0
    fi
    log "  Health check $i/$retries failed, retry in ${interval}s..."
    sleep "$interval"
    i=$((i + 1))
  done
  return 1
}

# ---------- Rollback to :previous ----------
do_rollback() {
  log "Attempting rollback to :previous images..."
  if $COMPOSE_CMD -f docker-compose.rollback.yml up -d; then
    sleep 3
    if health_check "$DEPLOY_HEALTH_URL" 3 3; then
      log "Rollback OK: previous version is running."
      return 0
    fi
    err "Rollback containers started but health check failed. Stopping rollback stack."
    $COMPOSE_CMD -f docker-compose.rollback.yml down 2>/dev/null || true
  else
    err "Rollback up failed ( :previous images may be missing)."
    $COMPOSE_CMD -f docker-compose.rollback.yml down 2>/dev/null || true
  fi
  return 1
}

# ---------- Deploy (main path) ----------
deploy() {
  preflight
  tag_previous
  do_build
  do_up

  log "Waiting for health check (${HEALTH_RETRIES}x every ${HEALTH_INTERVAL}s)..."
  if health_check "$DEPLOY_HEALTH_URL" "$HEALTH_RETRIES" "$HEALTH_INTERVAL"; then
    log "Deployment finished successfully."
    print_urls
    return 0
  fi

  err "Health check failed. Stopping new deployment and attempting rollback..."
  $COMPOSE_CMD down 2>/dev/null || true

  if do_rollback; then
    err "Deployment of new version failed; rolled back to previous version. Investigate build/runtime errors and redeploy."
    exit 1
  fi

  err "Deployment failed. Rollback attempted but :previous images are missing or failed. All containers stopped. Fix errors and redeploy."
  exit 1
}

# ---------- Rollback (manual: down current, up :previous) ----------
rollback() {
  preflight
  log "Manual rollback: stopping current deployment..."
  $COMPOSE_CMD down 2>/dev/null || true
  if ! do_rollback; then
    err "Rollback failed. Check that indo-israel-frontend:previous and indo-israel-backend:previous exist (from a prior successful deploy)."
    exit 1
  fi
  log "Manual rollback done."
  print_urls
}

# ---------- Stop ----------
stop() {
  preflight
  log "Stopping all containers..."
  $COMPOSE_CMD down 2>/dev/null || true
  log "Containers stopped."
}

# ---------- Main ----------
case "${1:-deploy}" in
  deploy) deploy ;;
  rollback) rollback ;;
  stop) stop ;;
  *)
    echo "Usage: $0 {deploy|rollback|stop}"
    echo "  deploy   - build, up, health check; on failure: down and try rollback to :previous"
    echo "  rollback - down current, up :previous (manual rollback)"
    echo "  stop     - docker-compose down"
    exit 1
    ;;
esac

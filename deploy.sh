#!/usr/bin/env bash
# Apravas deployment script: self-debugging with safe rollback on failure.
# - App path in containers: /opt/apravas (avoids conflict with host /app)
# - On error: rollback to :previous images if health check fails; otherwise clean down.

set -e

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-indo-israel}"
DEPLOY_HEALTH_URL="${DEPLOY_HEALTH_URL:-http://localhost}"
HEALTH_RETRIES="${HEALTH_RETRIES:-12}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"
# Seconds to wait after "up -d" before first health check (lets backend/frontend finish cold start)
HEALTH_STARTUP_DELAY="${HEALTH_STARTUP_DELAY:-15}"

# Project root = directory of this script
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Resolve docker-compose command (prefer v2 plugin over legacy Python docker-compose)
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
# Classic builder mode when buildx is missing (set by configure_docker_build)
DOCKER_BUILD_MODE=""

# Flags (set by parse_args)
FLAG_REMOVE=0
FLAG_REBUILD=0
COMMAND=""

log() { echo "[deploy] $*"; }
err() { echo "[deploy] ERROR: $*" >&2; }

usage() {
  cat <<EOF
Usage: $0 [command] [options]

Commands:
  deploy     build, up, health check; on failure rollback to :previous (default)
  preflight  run environment checks only (no build/start)
  remove     stop containers and remove project images
  rollback   down current stack, up :previous images
  stop       docker compose down

Options (with deploy, or alone as shortcuts):
  --remove   remove containers and project images before deploy (or run remove only)
  --rebuild  docker compose build --no-cache

Examples:
  $0 preflight
  $0 deploy
  $0 deploy --remove --rebuild
  $0 --remove
  $0 remove
EOF
}

# ---------- Show frontend and backend URLs ----------
print_urls() {
  log "Frontend (app):  $DEPLOY_HEALTH_URL"
  log "Backend (API):   $DEPLOY_HEALTH_URL/api/"
}

# ---------- Preflight ----------
preflight_core() {
  log "Preflight checks..."
  if ! command -v docker >/dev/null 2>&1; then
    err "Docker is not installed or not in PATH."
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    err "Docker daemon is not running or not accessible (try: sudo systemctl start docker)."
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
  if ! [[ "$APP_PORT" =~ ^[0-9]+$ ]] || [ "$APP_PORT" -lt 1 ] || [ "$APP_PORT" -gt 65535 ]; then
    err "APP_PORT in .env must be a valid port number (1-65535), got: ${APP_PORT:-<empty>}"
    exit 1
  fi
  # When using a non-80 port with default health URL, include port in DEPLOY_HEALTH_URL
  if [ "$APP_PORT" != "80" ] && [ "$DEPLOY_HEALTH_URL" = "http://localhost" ]; then
    DEPLOY_HEALTH_URL="http://localhost:${APP_PORT}"
  fi
}

# BuildKit needs the buildx CLI; many EC2/Ubuntu installs enable BuildKit in the daemon without buildx.
# DEPLOY_USE_BUILDKIT: auto (default) | 0 (classic) | 1 (require buildx)
configure_docker_build() {
  local mode="${DEPLOY_USE_BUILDKIT:-auto}"

  if [ "$mode" = "0" ]; then
    export DOCKER_BUILDKIT=0
    export COMPOSE_DOCKER_CLI_BUILD=0
    DOCKER_BUILD_MODE="classic (DEPLOY_USE_BUILDKIT=0)"
    log "Docker build: $DOCKER_BUILD_MODE"
    return 0
  fi

  if [ "$mode" = "1" ]; then
    if ! docker buildx version >/dev/null 2>&1; then
      err "DEPLOY_USE_BUILDKIT=1 but docker buildx is missing."
      err "buildx not found. On Ubuntu docker.io: sudo ./scripts/install-docker-plugins.sh"
      err "Or deploy without BuildKit: DEPLOY_USE_BUILDKIT=0 $0 deploy"
      exit 1
    fi
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    DOCKER_BUILD_MODE="BuildKit (buildx)"
    log "Docker build: $DOCKER_BUILD_MODE"
    return 0
  fi

  # auto: use BuildKit only when buildx is installed and responds
  if docker buildx version >/dev/null 2>&1; then
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    DOCKER_BUILD_MODE="BuildKit (buildx)"
  else
    export DOCKER_BUILDKIT=0
    export COMPOSE_DOCKER_CLI_BUILD=0
    DOCKER_BUILD_MODE="classic (buildx not installed)"
  fi
  log "Docker build: $DOCKER_BUILD_MODE"
}

preflight() {
  preflight_core
  configure_docker_build
  if [ "$COMPOSE_CMD" = "docker-compose" ]; then
    log "Tip: install docker-compose-plugin (docker compose v2) to avoid Python compose warnings on build."
  fi
  if ! command -v curl >/dev/null 2>&1; then
    err "curl is required for deploy health checks (install curl and retry)."
    exit 1
  fi
  log "Preflight OK (compose: $COMPOSE_CMD, health URL: $DEPLOY_HEALTH_URL)."
}

# ---------- Remove containers and project images ----------
do_remove() {
  log "Stopping containers and removing project images..."
  $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
  $COMPOSE_CMD -f docker-compose.rollback.yml down --remove-orphans 2>/dev/null || true
  for img in indo-israel-frontend indo-israel-backend indo-israel-nginx; do
    for tag in latest previous; do
      if docker image inspect "${img}:${tag}" >/dev/null 2>&1; then
        docker rmi -f "${img}:${tag}" 2>/dev/null || true
        log "  removed ${img}:${tag}"
      fi
    done
  done
  log "Remove complete."
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
compose_build() {
  local build_args=("$@")
  # Suppress noisy urllib3/chardet warnings from legacy Python docker-compose only
  if [ "$COMPOSE_CMD" = "docker-compose" ]; then
    PYTHONWARNINGS="${PYTHONWARNINGS:-ignore::UserWarning}" $COMPOSE_CMD build "${build_args[@]}"
  else
    $COMPOSE_CMD build "${build_args[@]}"
  fi
}

do_build() {
  local build_args=()
  configure_docker_build
  if [ "$FLAG_REBUILD" -eq 1 ]; then
    build_args=(--no-cache)
    log "Building images (--no-cache)..."
  else
    log "Building images..."
  fi
  if compose_build "${build_args[@]}"; then
    log "Build OK."
    print_urls
    return 0
  fi

  # Retry with classic builder if BuildKit/buildx was enabled but broken on the host
  if [ "${DOCKER_BUILDKIT:-0}" = "1" ]; then
    log "Build failed with BuildKit; retrying with classic builder (DOCKER_BUILDKIT=0)..."
    export DOCKER_BUILDKIT=0
    export COMPOSE_DOCKER_CLI_BUILD=0
    DOCKER_BUILD_MODE="classic (fallback after BuildKit failure)"
    if compose_build "${build_args[@]}"; then
      log "Build OK (classic builder)."
      log "For faster builds later: sudo ./scripts/install-docker-plugins.sh"
      print_urls
      return 0
    fi
  fi

  err "Build failed. Fix errors above and re-run. No containers were started."
  if ! docker buildx version >/dev/null 2>&1; then
    err "This host has no docker buildx. Deploy should use the classic builder automatically;"
    err "if you still see 'BuildKit is enabled but buildx is missing', run: DEPLOY_USE_BUILDKIT=0 $0 deploy"
    err "Or install plugins: sudo ./scripts/install-docker-plugins.sh"
  fi
  exit 1
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
  if [ "$FLAG_REMOVE" -eq 1 ]; then
    do_remove
  fi
  tag_previous
  do_build
  do_up

  log "Waiting ${HEALTH_STARTUP_DELAY}s for services to start, then health check (${HEALTH_RETRIES}x every ${HEALTH_INTERVAL}s)..."
  sleep "$HEALTH_STARTUP_DELAY"
  if health_check "$DEPLOY_HEALTH_URL" "$HEALTH_RETRIES" "$HEALTH_INTERVAL"; then
    log "Deployment finished successfully."
    print_urls
    return 0
  fi

  err "Health check failed. Stopping new deployment and attempting rollback..."
  log "Recent backend/frontend logs from the failed deployment:"
  $COMPOSE_CMD logs --tail=120 backend frontend 2>&1 | sed 's/^/[deploy]   /' >&2 || true
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
  preflight_core
  log "Preflight OK."
  log "Stopping all containers..."
  $COMPOSE_CMD down 2>/dev/null || true
  log "Containers stopped."
}

# ---------- Remove (standalone) ----------
remove() {
  preflight_core
  log "Preflight OK."
  do_remove
}

# ---------- Parse command and flags ----------
parse_args() {
  COMMAND="deploy"
  while [ $# -gt 0 ]; do
    case "$1" in
      deploy|preflight|rollback|stop|remove)
        COMMAND="$1"
        shift
        ;;
      --remove)
        FLAG_REMOVE=1
        shift
        ;;
      --rebuild)
        FLAG_REBUILD=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        err "Unknown argument: $1"
        usage
        exit 1
        ;;
    esac
  done
}

# If only flags were passed (e.g. ./deploy.sh --remove), default command stays deploy
# but user wants ./deploy.sh --remove alone => remove only:
# Detect: when argv is only --remove (handled in main after parse)

main() {
  local raw=("$@")
  parse_args "$@"

  # ./deploy.sh --remove  (no subcommand) => remove only, not full deploy
  if [ ${#raw[@]} -gt 0 ]; then
    local only_flags=1
    for arg in "${raw[@]}"; do
      case "$arg" in
        --remove|--rebuild) ;;
        *) only_flags=0; break ;;
      esac
    done
    if [ "$only_flags" -eq 1 ] && [ "$FLAG_REMOVE" -eq 1 ] && [ "$COMMAND" = "deploy" ]; then
      COMMAND="remove"
    fi
  fi

  case "$COMMAND" in
    deploy) deploy ;;
    preflight) preflight ;;
    remove) remove ;;
    rollback) rollback ;;
    stop) stop ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"

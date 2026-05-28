#!/usr/bin/env bash
# Install docker buildx + compose plugins on Ubuntu when apt cannot find
# docker-buildx-plugin / docker-compose-plugin (common with docker.io from Ubuntu repos).
#
# Usage:
#   ./scripts/install-docker-plugins.sh          # manual binaries (works with docker.io)
#   ./scripts/install-docker-plugins.sh --apt    # add Docker CE apt repo, then apt install

set -euo pipefail

BUILDX_VERSION="${BUILDX_VERSION:-v0.21.1}"
COMPOSE_VERSION="${COMPOSE_VERSION:-v2.32.4}"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/lib/docker/cli-plugins}"

log() { echo "[install-docker-plugins] $*"; }
err() { echo "[install-docker-plugins] ERROR: $*" >&2; }

need_root() {
  if [ "$(id -u)" -ne 0 ]; then
    err "Run with sudo: sudo $0 $*"
    exit 1
  fi
}

detect_arch() {
  local machine
  machine="$(uname -m)"
  case "$machine" in
    x86_64|amd64) echo "amd64" ;;
    aarch64|arm64) echo "arm64" ;;
    *)
      err "Unsupported architecture: $machine"
      exit 1
      ;;
  esac
}

install_manual() {
  need_root "$@"
  local arch plugin_dir
  arch="$(detect_arch)"
  plugin_dir="$INSTALL_DIR"
  mkdir -p "$plugin_dir"

  log "Installing buildx ${BUILDX_VERSION} (${arch}) -> ${plugin_dir}/docker-buildx"
  curl -fsSL \
    "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-${arch}" \
    -o "${plugin_dir}/docker-buildx"
  chmod +x "${plugin_dir}/docker-buildx"

  log "Installing compose ${COMPOSE_VERSION} (${arch}) -> ${plugin_dir}/docker-compose"
  curl -fsSL \
    "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${arch}" \
    -o "${plugin_dir}/docker-compose"
  chmod +x "${plugin_dir}/docker-compose"

  log "Verifying..."
  docker buildx version
  docker compose version

  if ! docker buildx inspect default >/dev/null 2>&1; then
    log "Creating default buildx builder..."
    docker buildx create --use --name default
  fi

  log "Done. Re-run: ./deploy.sh preflight && ./deploy.sh deploy"
}

install_via_docker_apt() {
  need_root "$@"
  if [ ! -f /etc/os-release ]; then
    err "/etc/os-release not found; use manual install instead."
    exit 1
  fi
  # shellcheck source=/dev/null
  . /etc/os-release
  if [ "${ID:-}" != "ubuntu" ]; then
    err "Docker CE apt repo steps are written for Ubuntu; use: $0 (without --apt)"
    exit 1
  fi

  local codename="${VERSION_CODENAME:-}"
  if [ -z "$codename" ] && [ -n "${VERSION_ID:-}" ]; then
    case "$VERSION_ID" in
      24.04) codename=noble ;;
      22.04) codename=jammy ;;
      20.04) codename=focal ;;
      *)
        err "Unknown Ubuntu VERSION_ID=$VERSION_ID; use manual install: $0"
        exit 1
        ;;
    esac
  fi

  log "Adding Docker official apt repository (Ubuntu ${codename})..."
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${codename} stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  log "Verifying..."
  docker buildx version
  docker compose version
  docker buildx create --use --name default 2>/dev/null || true
  log "Done. Re-run: ./deploy.sh deploy"
}

usage() {
  cat <<EOF
Install docker buildx and compose when Ubuntu apt cannot find docker-*-plugin packages.

  sudo $0              Install plugin binaries (works with existing docker.io)
  sudo $0 --apt        Install from Docker CE apt repo (replaces docker.io with docker-ce)

You do NOT need this script if deploy works with the classic builder:
  DEPLOY_USE_BUILDKIT=0 ./deploy.sh deploy
EOF
}

case "${1:-}" in
  ""|-h|--help) usage ;;
  --apt) install_via_docker_apt ;;
  --manual) install_manual ;;
  *) err "Unknown option: $1"; usage; exit 1 ;;
esac

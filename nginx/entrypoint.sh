#!/usr/bin/env sh
set -eu

CERT_DIR="/etc/nginx/certs"
CERT_FILE="${CERT_DIR}/fullchain.pem"
KEY_FILE="${CERT_DIR}/privkey.pem"

mkdir -p "$CERT_DIR"

if [ ! -s "$CERT_FILE" ] || [ ! -s "$KEY_FILE" ]; then
  echo "[nginx] TLS cert/key not found; generating self-signed certificate."

  # Generate a self-signed certificate suitable for local/dev use.
  # Includes SANs for localhost + 127.0.0.1 to avoid modern browser warnings about missing SAN.
  openssl req -x509 -nodes -newkey rsa:2048 \
    -days 3650 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
    >/dev/null 2>&1

  chmod 600 "$KEY_FILE" || true
fi

exec nginx -g "daemon off;"


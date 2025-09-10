#!/usr/bin/env bash
set -euo pipefail

echo "Starting build process..."

BIN_DIR="$HOME/bin"
mkdir -p "$BIN_DIR"
export PATH="$BIN_DIR:$PATH"

# --- Install czctl v2.20.0 to $HOME/bin ---
VERSION="2.20.0"
PLATFORM="linux"
ARCH="$(uname -m)"; [[ "$ARCH" == "x86_64" ]] && ARCH="amd64" || ARCH="arm64"

PAYLOAD="headless-${PLATFORM}-${ARCH}.tar.gz"
URL="https://releases.codezero.io/${VERSION}/${PAYLOAD}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

(
  cd "$TMP_DIR"
  echo "Downloading $URL"
  curl -sSfLO "$URL"
  tar -zxf "$PAYLOAD" -C "$BIN_DIR"
)
chmod +x "${BIN_DIR}/czctl" || true

echo "czctl $VERSION installed to $BIN_DIR"
czctl version || true

# If czctl tries to edit /etc/hosts or needs real elevation, consider:
# export C6O_SUDO_MODE=noop

# --- Your czctl workflow ---
czctl auth login --apikey "${CZ_ORG_API_KEY}"
czctl space select --id "${CZ_SPACE_ID}"
czctl consume all

# Example HTTP call
curl -L http://sample-project-leaf.sample-project:3010/api

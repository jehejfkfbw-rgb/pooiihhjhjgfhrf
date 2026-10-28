#!/usr/bin/env bash
# NEBRAS AI — safe run script for NB-XMW8Y9
set -euo pipefail
export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-production}"
# NOTE: no secrets are stored here — inject via environment at deploy time.
cd "$(dirname "$0")/.."
exec node src/server.js

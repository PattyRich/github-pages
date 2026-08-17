#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
CONFIG_PATH="${SHOWCASE_CONFIG_PATH:-$SCRIPT_DIR/showcase_config.sh}"
LIST_PATH="${1:-$REPO_ROOT/showcase.txt}"

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Showcase config was not found: $CONFIG_PATH" >&2
  echo "Create scripts/showcase_config.sh with SERVER_HOST, SERVER_USER, and PEM_PATH." >&2
  exit 1
fi
# shellcheck source=/dev/null
source "$CONFIG_PATH"

REMOTE_REPO_DIR="${REMOTE_REPO_DIR:-/var/www/server/github-pages}"

if [[ -z "$SERVER_HOST" || -z "$SERVER_USER" || -z "$PEM_PATH" ]]; then
  echo "Missing SERVER_HOST, SERVER_USER, or PEM_PATH." >&2
  echo "Define them in $CONFIG_PATH or export them before running this script." >&2
  exit 1
fi

if command -v cygpath >/dev/null 2>&1 && [[ "$PEM_PATH" =~ ^[A-Za-z]:\\ ]]; then
  PEM_PATH="$(cygpath -u "$PEM_PATH")"
fi

if [[ ! -f "$LIST_PATH" ]]; then
  echo "Showcase list was not found: $LIST_PATH" >&2
  exit 1
fi
if [[ ! -f "$PEM_PATH" ]]; then
  echo "SSH private key was not found: $PEM_PATH" >&2
  exit 1
fi
command -v ssh >/dev/null 2>&1 || { echo "ssh was not found on PATH." >&2; exit 1; }
command -v scp >/dev/null 2>&1 || { echo "scp was not found on PATH." >&2; exit 1; }

REMOTE_TARGET="${SERVER_USER}@${SERVER_HOST}"
REMOTE_LIST_PATH="/tmp/praynr-showcase-$(date +%s)-$$.txt"

echo "Uploading showcase list..."
scp -i "$PEM_PATH" -o StrictHostKeyChecking=accept-new -- \
  "$LIST_PATH" "$REMOTE_TARGET:$REMOTE_LIST_PATH"

REMOTE_COMMAND="set -e; trap 'rm -f $REMOTE_LIST_PATH' EXIT; cd '$REMOTE_REPO_DIR'; docker compose -f docker-compose.prod.yml exec -T api python showcase.py < '$REMOTE_LIST_PATH'"

echo "Publishing showcase on $SERVER_HOST..."
ssh -i "$PEM_PATH" -o StrictHostKeyChecking=accept-new -- \
  "$REMOTE_TARGET" "$REMOTE_COMMAND"

echo "Showcase published successfully from $LIST_PATH"

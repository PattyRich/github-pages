#!/bin/sh
set -eu

marker="/var/cache/nginx/praynr-config.sha256"
config_dir="/etc/nginx/praynr"

config_hash="$(
  sha256sum \
    "$config_dir/praynr.conf" \
    "$config_dir/cloudflare.conf" |
    sha256sum |
    cut -d ' ' -f 1
)"
previous_hash="$(cat "$marker" 2>/dev/null || true)"

if [ "$config_hash" = "$previous_hash" ]; then
  echo "Nginx site configuration is unchanged."
  exit 0
fi

nginx -t
nginx -s reload

mkdir -p "$(dirname "$marker")"
printf '%s\n' "$config_hash" > "$marker"
echo "Nginx site configuration reloaded gracefully."

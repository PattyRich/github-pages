#!/bin/sh
set -eu

source_dir="${FRONTEND_SOURCE_DIR:-/opt/frontend}"
frontend_root="${FRONTEND_ROOT:-/srv/frontend}"
requested_release="${1:-${FRONTEND_RELEASE:-manual}}"
asset_grace_days="${FRONTEND_ASSET_GRACE_DAYS:-7}"

case "$requested_release" in
  ''|*[!A-Za-z0-9._-]*)
    echo "Frontend release names may only contain letters, numbers, dots, underscores, and hyphens." >&2
    exit 1
    ;;
esac

case "$asset_grace_days" in
  ''|*[!0-9]*)
    echo "FRONTEND_ASSET_GRACE_DAYS must be a non-negative whole number." >&2
    exit 1
    ;;
esac

if [ ! -s "$source_dir/index.html" ]; then
  echo "Frontend build is missing index.html." >&2
  exit 1
fi

releases_dir="$frontend_root/releases"
shared_assets_dir="$frontend_root/shared/assets"
release="$requested_release"
release_suffix=0

mkdir -p "$releases_dir" "$shared_assets_dir"

# Keep hashed assets from recent HTML releases available across the atomic switch.
if [ -d "$source_dir/assets" ]; then
  cp -a "$source_dir/assets/." "$shared_assets_dir/"
fi

while [ -e "$releases_dir/$release" ]; do
  release_suffix=$((release_suffix + 1))
  release="${requested_release}-$(date +%s)-$$-$release_suffix"
done

staging_dir="$releases_dir/.${release}.tmp.$$"
release_dir="$releases_dir/$release"
next_link="$frontend_root/.current.$$"

cleanup_staging() {
  rm -rf "$staging_dir"
  rm -f "$next_link"
}
trap cleanup_staging EXIT INT TERM

mkdir "$staging_dir"
cp -a "$source_dir/." "$staging_dir/"
mv "$staging_dir" "$release_dir"

ln -s "releases/$release" "$next_link"
mv -Tf "$next_link" "$frontend_root/current"

trap - EXIT INT TERM

# Retain the active release plus four rollback snapshots.
kept=0
for candidate in $(ls -1dt "$releases_dir"/* 2>/dev/null); do
  if [ "$candidate" = "$release_dir" ]; then
    continue
  fi
  kept=$((kept + 1))
  if [ "$kept" -gt 4 ]; then
    rm -rf "$candidate"
  fi
done

# Remove expired shared assets only when none of the retained releases reference them.
export releases_dir shared_assets_dir
find "$shared_assets_dir" -type f -mtime "+$asset_grace_days" -exec sh -c '
  asset_path="$1"
  relative_path="${asset_path#"$shared_assets_dir"/}"

  for retained_release in "$releases_dir"/*; do
    if [ -f "$retained_release/assets/$relative_path" ]; then
      exit 0
    fi
  done

  rm -f "$asset_path"
  echo "Removed expired unreferenced asset: $relative_path"
' sh '{}' \;

echo "Frontend release $release is active."

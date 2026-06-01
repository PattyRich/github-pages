#!/usr/bin/env bash
set -euo pipefail

CONTAINER="github-pages-api-1"
UPLOAD_BASE="/app/static/uploads"
DAYS=730
LOGFILE="$(dirname "${BASH_SOURCE[0]}")/delete_old_images.log"

TOTAL=0
for SUBDIR in proofs board-images; do
    COUNT=$(MSYS_NO_PATHCONV=1 docker exec "$CONTAINER" \
        find "$UPLOAD_BASE/$SUBDIR" \
        -type f \
        \( -name '*.webp' -o -name '*.jpg' -o -name '*.png' -o -name '*.gif' \) \
        -mtime +$DAYS \
        -delete -print | wc -l)
    TOTAL=$((TOTAL + COUNT))
done

if [ "$TOTAL" -gt 0 ]; then
    echo "$(date '+%F %T') deleted $TOTAL file(s) older than ${DAYS} days" >> "$LOGFILE"
fi
# Wiki Image Cache Progress

Branch: `wiki-image-cache`

## Goal

Implement a shared, lazy-loaded OSRS Wiki image cache. Wiki images should be downloaded on first use, stored once globally, reused by all boards, and served locally thereafter. User uploads must remain separate.

## Status

- [x] Confirmed all work is isolated to `wiki-image-cache`; `main` is untouched.
- [x] Inspected board serialization, image serving, production volumes, dependencies, and tests.
- [x] Added a dedicated shared `WikiImageCache` service in `services/api/imageManager.py`.
- [x] Reused the existing board-image Flask route as the lazy cache endpoint (`.../wiki-cache?url=...`) to avoid invasive server changes.
- [x] Rewrites approved Wiki URLs only when board responses call `board_images.public_url`; MongoDB keeps the original source URL.
- [x] Added deterministic SHA-256 URL keys, atomic writes, filesystem locks, redirect revalidation, byte/pixel limits, actual image validation, and SSRF protections.
- [x] Added a separate persistent `wiki_image_cache` Docker volume mounted at `/app/static/wiki-images`.
- [x] Added focused unit tests in `services/api/test_wiki_image_cache.py`.
- [ ] Run the backend tests in a checkout/CI environment.
- [ ] Perform a manual production-like smoke test with a real Wiki PNG and animated GIF/WebP.
- [ ] Consider returning explicit 400/502 JSON responses from the cache route instead of Flask's default 500 for cache failures.

## Commits

- `fcd06e6` — Add wiki image cache progress log.
- `835f24c` — Add shared lazy wiki image cache.
- `cb69ec1` — Persist shared wiki image cache.
- `221b68c` — Add wiki image cache tests.

## Current branch diff

The branch is four commits ahead of `main` and zero commits behind as of the implementation review. Changed files:

- `services/api/imageManager.py`
- `services/api/test_wiki_image_cache.py`
- `docker-compose.prod.yml`
- `docs/wiki-image-cache-progress.md`

## Design decisions

- Keep original Wiki URLs in MongoDB; no data migration is required.
- Use the existing `/static/uploads/board-images/<path>` Flask route with a reserved `wiki-cache` filename as the lazy endpoint.
- Store downloaded files physically in `/app/static/wiki-images`, separate from user uploads despite sharing the existing route namespace.
- Use normalized source URL SHA-256 hashes so multiple boards share one file.
- Restrict downloads to `oldschool.runescape.wiki` and `runescape.wiki`.
- Validate DNS results and redirect destinations to reduce SSRF risk.
- Preserve source image bytes and animation; do not resize or re-encode Wiki images.
- Use `fcntl` filesystem locking so separate uWSGI processes sharing the volume do not download the same missing image simultaneously.
- Do not delete shared cache entries when a board is removed.

## Resume instructions

1. Check out `wiki-image-cache`.
2. From `services/api`, install requirements and run:

   ```bash
   python -m pytest test_wiki_image_cache.py test_server.py -v
   ```

3. Fix any failures before opening a PR.
4. Start the production Compose stack or an equivalent local setup and load a board containing a Wiki image.
5. Confirm the first request creates one file in `/app/static/wiki-images` and later requests do not contact the Wiki.
6. Confirm two boards using the same normalized Wiki URL share the same cached file.
7. Confirm animated GIF/WebP images remain animated.
8. Decide whether to add explicit cache-route error mapping (invalid URL → 400, upstream failure → 502) before merging.

## Known limitations

- No GitHub status checks were attached to the latest commit at the time of review, so tests have not been executed by CI yet.
- The browser-facing cache URL lives under the existing board-upload route namespace for compatibility, although cached files are stored in a separate shared volume.
- Failed downloads currently propagate through the existing Flask route and may produce a generic 500 response.

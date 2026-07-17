# Wiki Image Cache Progress

Branch: `wiki-image-cache`

## Goal

Implement a shared, lazy-loaded OSRS Wiki image cache. Wiki images should be downloaded on first use, stored once globally, reused by all boards, and served locally thereafter. User uploads must remain separate.

## Status

- [x] Confirmed all work is isolated to `wiki-image-cache`; `main` is untouched.
- [x] Inspected board serialization, image serving, production volumes, dependencies, and tests.
- [x] Added a dedicated shared `WikiImageCache` service in `services/api/wikiImageCache.py`.
- [x] Added a dedicated lazy cache endpoint under the existing board-image URL namespace (`.../wiki-cache?url=...`).
- [x] Rewrites approved Wiki URLs only when board responses call `board_images.public_url`; MongoDB keeps the original source URL.
- [x] Added deterministic SHA-256 URL keys, atomic writes, filesystem locks, redirect revalidation, byte/pixel limits, actual image validation, and SSRF protections.
- [x] Added a separate persistent `wiki_image_cache` Docker volume mounted at `/app/static/wiki-images`.
- [x] Added focused unit tests in `services/api/test_wiki_image_cache.py`.
- [x] Expanded tests for board URL rewriting, animated GIF preservation, oversized responses, private redirect destinations, and invalid content.
- [x] Restored the accidentally truncated cache test suite and added it to `make test-backend`.
- [x] Added HMAC-signed cache URLs, a dedicated rate-limited route, bounded cache size/count, and explicit 400/502/507 responses.
- [x] Replaced automatic redirects with a manually validated redirect loop.
- [x] Made cache locking work on both Linux and Windows using a bounded set of sharded lock files.
- [x] Added a local-time fallback for Windows installations without the IANA timezone database so cache logging remains usable.
- [x] Added local Git and Docker exclusions for generated cache files.
- [x] Moved cache limits, timeouts, hosts, and rate limits into source constants and removed all Wiki cache environment configuration.
- [x] Generate the signing secret once inside the persistent cache volume and reuse it across processes and restarts.
- [x] Moved OSRS pixel-image URL normalization to the backend so pixel tiles cannot bypass the local cache.
- [x] Normalize away MediaWiki hexadecimal cache-buster query strings such as `?42f5b`.
- [x] Ran the focused backend suite successfully: 94 tests passed on 2026-07-17.
- [x] Smoke-tested a real Wiki PNG/WebP response and animated GIF; both subsequent lookups were cache hits.

## Commits

- `fcd06e6` — Add wiki image cache progress log.
- `835f24c` — Add shared lazy wiki image cache.
- `cb69ec1` — Persist shared wiki image cache.
- `221b68c` — Add wiki image cache tests.
- `6267d33` — Update wiki image cache progress.
- `3ca218e` — Expand wiki image cache coverage.

## Current branch diff

The branch is ahead of `main` and zero commits behind as of the latest review. Changed files:

- `services/api/imageManager.py`
- `services/api/wikiImageCache.py`
- `services/api/logger.py`
- `services/api/test_wiki_image_cache.py`
- `services/api/server.py`
- `services/api/test_server.py`
- `services/api/.dockerignore`
- `services/api/Dockerfile`
- `docker-compose.prod.yml`
- `docs/wiki-image-cache-progress.md`
- `docs/architecture.md`
- `.gitignore`
- `.dockerignore`
- `Makefile`

## Design decisions

- Keep original Wiki URLs in MongoDB; no data migration is required.
- Keep the lazy endpoint under `/static/uploads/board-images/wiki-cache` while routing it separately from ordinary uploaded images.
- Store downloaded files physically in `/app/static/wiki-images`, separate from user uploads despite sharing the existing route namespace.
- Use normalized source URL SHA-256 hashes so multiple boards share one file.
- Restrict downloads to HTTPS `/images/` paths on `oldschool.runescape.wiki` and `runescape.wiki`; reject credentials, parameters, and query strings other than stripped MediaWiki hexadecimal cache-busters.
- Sign each browser-facing cache URL with a 256-bit HMAC key generated and persisted inside the shared cache volume.
- Validate DNS results before every request and validate each redirect destination before following it.
- Preserve source image bytes and animation; do not resize or re-encode Wiki images.
- Resolve OSRS pixel-image thumbnails to their full-size Wiki source before generating the signed cache URL.
- Use portable advisory locking and 256 sharded lock files so separate uWSGI processes do not download the same missing image simultaneously without allowing unbounded lock-file growth.
- Limit the shared cache to 10,000 entries or 2 GiB using constants in `wikiImageCache.py`; existing entries remain readable when the limit is reached.
- Rate-limit the dedicated cache route separately from ordinary uploaded-image serving using a constant in `server.py`.
- Do not delete shared cache entries when a board is removed.

## Resume instructions

1. Check out `wiki-image-cache`.
2. From `services/api`, install requirements and run:

   ```bash
   python -m pytest test_wiki_image_cache.py test_server.py -v
   ```

3. Start the production Compose stack or an equivalent local setup and load a board containing a Wiki image.
4. Confirm the first request creates one file in `/app/static/wiki-images` and later requests do not contact the Wiki.
5. Confirm two boards using the same normalized Wiki URL share the same cached file.
6. Confirm animated GIF/WebP images remain animated.
7. Confirm an altered or unsigned cache URL returns 400 and an invalid upstream image returns 502.

## Known limitations

- The browser-facing cache URL lives under the existing board-upload route namespace for compatibility, although cached files are stored in a separate shared volume.
- Cache entries are not automatically evicted. New misses return 507 after the fixed byte or entry limit is reached, while existing cache hits continue to work.
- Deleting `.signing-key` from the cache volume rotates the signing key and invalidates old cache URLs; clients receive fresh URLs on their next board response.

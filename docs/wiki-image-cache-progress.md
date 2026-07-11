# Wiki Image Cache Progress

Branch: `wiki-image-cache`

## Goal

Implement a shared, lazy-loaded OSRS Wiki image cache. Wiki images should be downloaded on first use, stored once globally, reused by all boards, and served locally thereafter. User uploads must remain separate.

## Status

- [x] Confirmed work is isolated to `wiki-image-cache`.
- [x] Inspected `services/api/imageManager.py` and confirmed existing `ImageStore` is intended for user-uploaded/data-URI images with UUID filenames.
- [ ] Inspect board serialization/routes, deployment volumes, dependencies, and tests.
- [ ] Add dedicated shared `WikiImageCache` service.
- [ ] Add lazy cache API route.
- [ ] Rewrite approved Wiki URLs only in API responses.
- [ ] Add persistent shared cache volume/configuration.
- [ ] Add tests.
- [ ] Run/verify available checks.

## Design decisions

- Keep original Wiki URLs in MongoDB; do not require a migration.
- Rewrite approved Wiki image URLs only when serializing board responses.
- Store cached files in a dedicated shared cache directory, not under user uploads.
- Use deterministic URL hashes so multiple boards share one file.
- Restrict downloads to approved Wiki hosts and validate redirects.
- Save atomically and preserve animation.
- Do not delete shared cache entries when a board is removed.

## Resume notes

Next step: inspect `services/api/server.py`, Docker Compose files, Python dependencies, and backend tests to identify exact integration points before editing code.

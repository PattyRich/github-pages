# 🦒 Praynr — OSRS Community Toolbox

A full-stack, production-deployed web application for the Old School RuneScape community. Features a real-time collaborative Bingo board system and a social graph explorer that maps competitive player relationships across the League of Legends ranked ladder.

**Live:** [praynr.com](https://praynr.com) · **Frontend:** [pattyrich.github.io/github-pages](https://pattyrich.github.io/github-pages/) · **Logs:** [dozzle.praynr.com](https://dozzle.praynr.com)

> **Docs:** [System Architecture](docs/architecture.md) · [LoL-Beat Deep Dive](docs/lol-beat.md)

---

## What It Does

**Bingo Boards** — Create, share, and collaboratively track customizable OSRS bingo boards. Teams authenticate independently, mark tiles with proof text, proof images, and points, and see each other's progress in real time. Board state is stored in MongoDB with a 3-year TTL, while uploaded proof images are compressed to WebP files and saved outside MongoDB so board payloads stay lean.

**LoL-Beat** — Given any two League of Legends summoners, find the shortest "beat chain" connecting them: a path of players who defeated each other in ranked games, all the way up to the #1 Challenger. Built on a Redis-backed player graph crawled from the Riot API, with BFS pathfinding and background job processing via RQ. See [docs/lol-beat.md](docs/lol-beat.md) for a full breakdown of the graph schema, crawl strategy, and API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Python 3.13, Flask, uWSGI |
| Background Jobs | Redis Queue (RQ) |
| Database | MongoDB 7.0 |
| File Storage | Docker volume-backed local filesystem for Bingo proof images |
| Cache / Graph Store | Redis 7 |
| Reverse Proxy | Nginx + Cloudflare |
| Infrastructure | AWS Lightsail, Docker Compose |
| CI/CD | GitHub Actions |
| Monitoring | Dozzle |

---

## Architecture

This is a monorepo organized for clarity and scale:

```
root/
├── apps/frontend/          # React 19 + TypeScript SPA (Vite)
├── services/api/           # Flask API + RQ Worker
├── scripts/                # Backup automation, data ingestion
├── nginx/                  # Reverse proxy & SSL config
└── .github/workflows/      # CI/CD pipelines
```

See [docs/architecture.md](docs/architecture.md) for a full breakdown of the system design, data models, and background job flow.

---

## Quick Start

The project is managed via a root-level `Makefile`.

```bash
# Install all dependencies
make install

# Configure environment (copy and fill in API keys)
cp services/api/.env.example services/api/.env

# Start backend (Docker) + frontend (Vite) with cleanup on exit
make dev
```

---

## Testing

Three test layers cover the stack from unit to browser:

| Layer | Tool | What it covers |
|---|---|---|
| Backend | pytest | Flask API routes and server logic |
| Frontend | TypeScript, Vitest + Testing Library | Static typing and React component rendering |
| E2E | Playwright (Python) | Full browser flows against a live local stack |

Run the backend tests, frontend typecheck/unit tests, and E2E suite at once:

```bash
make test
```

Or run each layer individually:

```bash
# Backend — Flask API tests
.venv/Scripts/python.exe -m pytest services/api/test_server.py -q

# Frontend — Vitest unit tests
cd apps/frontend && npm test

# Frontend — TypeScript typecheck
make typecheck

# Frontend — typecheck, lint, format check, and unit tests
make frontend-verify

# E2E — Playwright browser tests (requires make dev to be running)
make e2e

# E2E with a visible browser window
make e2e-headed
```

### Playwright E2E

The Playwright suite drives a real Chromium browser against the running local stack and cleans up any MongoDB documents and uploaded image artifacts it creates afterward. See [tests/e2e/README.md](tests/e2e/README.md) for setup instructions, environment variable options (headless mode, slow-mo, mobile viewport, custom Mongo URI, etc.), and how the board-name prefix suppresses Discord alerts for test boards.

---

## CI/CD

GitHub Actions handles all deployments automatically on push to `main`:

- **Frontend** — Typechecked, built, and deployed to `/var/www/frontend` on the production server via SCP.
- **Backend** — API and worker containers restarted on AWS Lightsail via SSH.
- **Maintenance** — Weekly job prunes old Docker images and updates base images.

---

## Docker (Production)

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Rebuild only the API and worker after code changes (zero-downtime for other services)
docker compose -f docker-compose.prod.yml up -d --build --no-deps api worker

# Stop (data is safe in named volumes)
docker compose -f docker-compose.prod.yml down
```

> [!CAUTION]
> **Never** use `docker compose down -v` in production — it destroys MongoDB, Redis, Dozzle, and proof image upload volumes permanently.

Production stores uploaded Bingo proof images in the Docker named volume `proof_uploads`, mounted into the API container at `/app/static/uploads`. The API writes proof files under `/app/static/uploads/proofs` and serves them from `/static/uploads/proofs/<filename>`. MongoDB stores only the proof image path, not the image bytes.

Local development uses the bind mount `./services/api:/app`, so proof uploads are written to `services/api/static/uploads/proofs` on your machine. That directory is ignored by Git.

---

## Monitoring

Dozzle provides live container log streaming at [dozzle.praynr.com](https://dozzle.praynr.com) — useful for debugging production without SSH access. Auth is configured in `dozzle/users.yml`.

---

## Backups & Recovery

### Automated Backups
Daily SSH-streamed backups from the server to local storage, managed by Windows Task Scheduler.

```powershell
# Manual backup
powershell -ExecutionPolicy Bypass -File "scripts/backup.ps1"
```

Keeps the 5 most recent backups automatically.

### MongoDB Restore

```bash
# Copy archive into the container
docker cp your_backup.gz github-pages-mongo-1:/tmp/backup.gz

# Restore
docker exec github-pages-mongo-1 mongorestore --archive=/tmp/backup.gz --gzip
```

### Proof Image Uploads
Proof images are not part of MongoDB backups. In production they live in the Docker named volume `proof_uploads`; include that volume in any full-server backup or migration plan.

### Maintenance Mode
Toggle the `IS_MAINTENANCE` boolean in `apps/frontend/src/index.tsx` to enable maintenance mode for Bingo and LoL-Beat routes.


---

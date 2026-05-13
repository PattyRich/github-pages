# 🦒 Praynr — OSRS Community Toolbox

A full-stack, production-deployed web application for the Old School RuneScape community. Features a real-time collaborative Bingo board system and a social graph explorer that maps competitive player relationships across the League of Legends ranked ladder.

**Live:** [praynr.com](https://praynr.com) · **Frontend:** [pattyrich.github.io/github-pages](https://pattyrich.github.io/github-pages/) · **Logs:** [dozzle.praynr.com](https://dozzle.praynr.com)

> **Docs:** [System Architecture](docs/architecture.md) · [LoL-Beat Deep Dive](docs/lol-beat.md)

---

## What It Does

**Bingo Boards** — Create, share, and collaboratively track customizable OSRS bingo boards. Teams authenticate independently, mark tiles with images and points, and see each other's progress in real time. Boards are stored in MongoDB with a 3-year TTL and auto-expire to keep the database lean.

**LoL-Beat** — Given any two League of Legends summoners, find the shortest "beat chain" connecting them: a path of players who defeated each other in ranked games, all the way up to the #1 Challenger. Built on a Redis-backed player graph crawled from the Riot API, with BFS pathfinding and background job processing via RQ. See [docs/lol-beat.md](docs/lol-beat.md) for a full breakdown of the graph schema, crawl strategy, and API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Bootstrap 5 |
| Backend | Python 3.13, Flask, uWSGI |
| Background Jobs | Redis Queue (RQ) |
| Database | MongoDB 7.0 |
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
├── apps/frontend/          # React 19 SPA (Vite)
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

## CI/CD

GitHub Actions handles all deployments automatically on push to `main`:

- **Frontend** — Built and deployed to `/var/www/frontend` on the production server via SCP.
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
> **Never** use `docker compose down -v` in production — it destroys MongoDB and Redis volumes permanently.

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

### Maintenance Mode
Toggle the `IS_MAINTENANCE` boolean in `apps/frontend/src/index.jsx` to enable maintenance mode for Bingo and LoL-Beat routes.

# Project Architecture

This project is a full-stack application designed to handle both interactive gaming (Bingo) and data-intensive Riot API crawling (LoL-Beat).

## Monorepo Layout

```text
root/
├── apps/
│   └── frontend/          # React 19 SPA (Vite)
├── services/
│   └── api/               # Unified Flask API + Background Worker
├── scripts/               # Maintenance (Backups, Data Ingestion)
├── nginx/                 # Production Proxy & SSL config
└── .github/workflows/     # CI/CD (Frontend scp / Backend ssh)
```

---

## 🎨 Frontend (`apps/frontend`)
- **State Management**: React Hooks (useState/useEffect) with local storage for persistence.
- **Routing**: `react-router-dom` for Bingo boards and LoL-Beat search.
- **Visuals**: Bootstrap 5 for layout, `html-to-image` pet pictures, and custom CSS for the OSRS-inspired aesthetic.

---

## ⚙️ Backend Services (`services/api`)

The backend is a unified Python service that handles both synchronous web requests and asynchronous background tasks.

### 1. Main API (`server.py`)
- **Framework**: Flask with Blueprints.
- **Bingo Logic**: Handles board creation, authentication (Admin/General passwords), and 2D-array tile updates.
- **Image Processing**: Integrates `imgSizeReducer` to optimize user-uploaded images before saving to Mongo.
- **Rate Limiting**: Uses `flask-limiter` with a Redis backend to prevent API abuse.

### 2. League API & Crawler (`lol_server.py` + `crawler.py`)
- **Blueprint**: Modularized routes under `/lol/api`.
- **The "Beat Graph"**: Uses Redis to store a graph of player interactions. Keys like `match_link:{winner_puuid}` store a map of losers and the `match_id` they lost in.
- **Pathfinding**: Implements a Breadth-First Search (BFS) over the Redis-cached graph to find the shortest "beat chain" from any player to the #1 Challenger.

### 3. Background Worker (`RQ`)
- **Task**: Deep crawls of the Riot API take minutes to hours and cannot run in a request thread.
- **Flow**:
    1. User hits `/lol/api/crawl`.
    2. API enqueues a job in **Redis Queue (RQ)**.
    3. The `worker` container picks up the job and executes `crawler.crawl_user_graph`.
    4. Frontend polls `/lol/api/job/<id>` for the status.

---

## 💾 Data Persistence

### MongoDB (Bingo Boards)
Used for structured, permanent storage of bingo boards.
- **Collection**: `bingo.bingo`
- **Schema**:
    - `boardName`: Unique identifier (indexed).
    - `boardData`: 2D array of tile objects (title, image, points).
    - `team-X`: Objects containing team names, passwords, and their unique progress 2D-array.
    - **TTL**: Boards are set to expire automatically after ~3 years to prevent database bloat.

### Redis (Caching & Queuing)
Used for high-speed lookups and task management.
- **Rate Limiting**: Stores client IP request counts.
- **Player Cache**: Stores PUUIDs and usernames to minimize Riot API calls.
- **Match Links**: The core of the "Beat Chain" graph.

---

## 🚀 CI/CD & Deployment

- **Hosting**: AWS Lightsail (Ubuntu 24.04).
- **Containers**: Managed via Docker Compose (Mongo, Redis, API, Worker, Dozzle).
- **Proxy**: Nginx acts as the entry point, terminating SSL and serving static frontend files from `/var/www/frontend`.

---
*Last Updated: 2026-05-13*

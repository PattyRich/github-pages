# Architecture

Praynr is a full-stack monorepo serving two distinct products on the same backend: a collaborative OSRS Bingo board system and a League of Legends social graph explorer. This doc covers system design, data models, and the reasoning behind key technical decisions.

---

## Monorepo Layout

```
root/
├── apps/
│   └── frontend/           # React 19 + TypeScript SPA (Vite)
├── services/
│   └── api/                # Unified Flask API + RQ background worker
├── scripts/                # Backup automation, data ingestion utilities
├── nginx/                  # Production reverse proxy & SSL config
└── .github/workflows/      # CI/CD pipelines (frontend SCP / backend SSH)
```

---

## Frontend (`apps/frontend`)

A single-page React 19 application written in TypeScript and bundled with Vite.

**Routing** — `react-router-dom` manages two primary surfaces: the Bingo board editor/viewer and the LoL-Beat search interface.

**State** — React Hooks (`useState` / `useEffect`) with `localStorage` for lightweight persistence (e.g. active team selection). No global state library — the app's complexity doesn't warrant one.

**Type Safety** — TypeScript covers the main Bingo board flow, shared UI primitives, route shell, API helpers, and related tests. `npm run typecheck` runs `tsc --noEmit`, while `npm run verify` combines typecheck, lint, formatting checks, and Vitest.

**Polling** — The LoL-Beat crawler is a long-running background job. The frontend polls `/lol/api/job/<id>` at a fixed interval to surface job status without a WebSocket.

---

## Backend (`services/api`)

A unified Python service exposing both synchronous HTTP routes and a background job worker. The two product areas are split into Flask Blueprints but share infrastructure (Mongo, Redis, rate limiter).

### Flask API (`server.py`)

Handles all Bingo product logic:

- **Board CRUD** — Create, read, and update boards stored as documents in MongoDB. Each board uses lightweight Admin and General shared secrets for event access. These are intentionally casual board secrets, not user-account passwords.
- **Tile Updates** — Board state is a 2D array of tile objects (title, image URL, points). Team progress includes checked state, proof text, current points, and proof image references.
- **Proof Image Storage** — Uploaded Bingo proof images are compressed through `imgSizeReducer`, saved as files by `proof_images.py`, and stored in MongoDB as URL paths instead of base64 image blobs. Existing legacy base64 proof images are still returned so older board data remains readable.
- **Rate Limiting** — `flask-limiter` with a Redis backend enforces per-IP request limits across all endpoints to prevent abuse.

### League API & Crawler (`lol_server.py` + `crawler.py`)

Handles the LoL-Beat product:

- **Blueprint** — All routes live under `/lol/api` for clean separation from Bingo routes.

**The Beat Graph**

Player relationships are stored as a directed graph in Redis. The key structure is:

```
match_link:{winner_puuid}  →  { loser_puuid: match_id, ... }
```

Each key maps a winning player's PUUID to a hash of players they've defeated and the match IDs those wins occurred in. This structure lets us reconstruct proof-of-beat (a linkable match URL) for any edge in the graph.

**Pathfinding**

Beat chain discovery uses Breadth-First Search over the Redis graph, which guarantees the shortest path from any player to the #1 Challenger. BFS is appropriate here because edge weights are uniform (a win is a win) and the graph is sparse enough that it stays fast in practice.

**Why Redis for the graph?** Riot API match data is inherently ephemeral — ranked seasons reset, players change accounts. Redis's TTL support means stale graph data expires naturally. It also doubles as the rate limiter backend and job queue, consolidating infrastructure.

### Background Worker (`worker.py` via RQ)

Riot API crawls are latency-unpredictable (minutes to hours) and cannot run in a request thread. The worker decouples crawl execution from the HTTP lifecycle:

```
User → POST /lol/api/crawl
     → API enqueues job in Redis Queue
     → Worker container picks up job
     → Executes crawler.crawl_user_graph()
     → Frontend polls /lol/api/job/<id> for status
```

RQ was chosen over Celery for its simplicity — the task surface is small and a full distributed task framework would be overkill.

---

## Data Persistence

### MongoDB — Bingo Boards

```
Collection: bingo.bingo

Document shape:
{
  boardName:  string,          // unique identifier (indexed)
  boardData:  Tile[][],        // 2D array of { title, image, points }
  "team-1":   TeamState,       // { name, optional team secret, teamData: TeamTile[][] }
  "team-2":   TeamState,
  expiresAt:  Date             // TTL index, ~3 years from creation
}
```

The TTL index keeps the database self-pruning — abandoned boards expire without any manual cleanup job. The `boardName` index makes lookups O(log n) as the collection grows.

Team tiles store proof metadata, not proof image bytes:

```
TeamTile {
  checked:      bool,
  proof:        string,
  proofImages:  string[],      // /static/uploads/proofs/<uuid>.webp or legacy data URI
  currPoints:   number
}
```

### Local Filesystem — Bingo Proof Images

New proof uploads are stored on disk instead of inside MongoDB:

```
services/api/static/uploads/proofs/<uuid>.webp   # local dev bind mount
/app/static/uploads/proofs/<uuid>.webp           # path inside the API container
```

The public URL shape is:

```
/static/uploads/proofs/<uuid>.webp
```

`proof_images.py` normalizes these paths so MongoDB keeps portable relative paths, while API responses return absolute URLs such as `https://praynr.com/static/uploads/proofs/<uuid>.webp`. This matters because the production frontend may be served from GitHub Pages while the API and images are served from `praynr.com`.

### Redis — Cache, Graph, and Queue

Redis serves three distinct roles:

| Role | Key Pattern | Notes |
|---|---|---|
| Rate limiting | `flask-limiter:*` | Per-IP request counts, managed by flask-limiter |
| Player cache | `player:{puuid}` | Summoner name ↔ PUUID mapping; reduces Riot API calls |
| Beat graph | `match_link:{puuid}` | Hash of loser PUUIDs → match IDs |
| Job queue | RQ internal keys | Managed by RQ; not accessed directly |

Separating concerns across key namespaces keeps Redis operationally simple — you can flush the player cache without touching the graph or the queue.

---

## Infrastructure & Deployment

**Hosting** — AWS Lightsail (Ubuntu 24.04). Lightsail gives predictable billing on a low-traffic community app without the operational overhead of EC2 + ALB + RDS.

**Containers** — Docker Compose manages five services: `mongo`, `redis`, `api`, `worker`, `dozzle`. The API and worker share the same image but run different entry points — this avoids image drift between the two processes. Production also defines the named volume `proof_uploads`, mounted into the API container at `/app/static/uploads`, so uploaded proof images survive container rebuilds and restarts.

**Networking** — Nginx terminates SSL and acts as the single entry point. It proxies API requests to uWSGI and serves the React SPA's static files from `/var/www/frontend`. Proof images are currently served by Flask from `/static/uploads/proofs/...` with long cache headers; they could be moved behind a direct Nginx `alias` later if image traffic grows. Cloudflare sits in front for DDoS mitigation and CDN.

**CI/CD** — GitHub Actions runs on push to `main`. The frontend workflow typechecks, builds the Vite bundle, and SCPs the dist to the server. The backend workflow SSHes in and restarts only the `api` and `worker` containers — other services stay running. A weekly scheduled workflow prunes dangling images and updates base images.

**Monitoring** — Dozzle streams live container logs via a web UI at `dozzle.praynr.com`, authenticated via `dozzle/users.yml`. This means production debugging doesn't require SSH.

---

## Design Decisions & Trade-offs

**Monorepo** — Frontend and backend live together to simplify cross-cutting changes (e.g. updating an API contract and the consuming UI in one PR). The services are independently deployable despite sharing a repo.

**Unified API + Worker image** — A single Docker image for both the Flask API and the RQ worker means one Dockerfile to maintain. The trade-off is a slightly larger image than strictly necessary for each role.

**SSE for Bingo, polling for jobs** — Bingo board updates use Server-Sent Events backed by Redis pub/sub so open boards can refresh quickly after changes. LoL-Beat job status still uses simple HTTP polling because crawl jobs are long-running and low-frequency.

**Flask over FastAPI** — Flask's synchronous model is straightforward for this workload. The async work (crawling) is offloaded to RQ workers anyway, so async-native routing doesn't add meaningful value here.

---

*Last updated: 2026-06-12*

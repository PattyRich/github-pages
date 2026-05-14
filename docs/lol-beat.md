# LoL-Beat: Six Degrees to Challenger

LoL-Beat answers a simple question: **can you trace a chain of wins from your League of Legends account all the way up to the #1 Challenger player in NA?**

Given any two summoners, it finds the shortest sequence of players where each person has beaten the next in a real ranked game — a "beat chain." The system crawls match history from the Riot API, builds a directed graph of those relationships, and then runs BFS to find the path.

**Live:** [praynr.com/#/lol-beat](https://praynr.com/#/lol-beat)

---

## How It Works

### 1. Crawl — Build the Beat Graph

When a user submits their Riot ID, the API enqueues a background crawl job via **Redis Queue (RQ)**. The worker process picks it up and runs `crawler.crawl_user_graph()`.

The crawler does a breadth-first expansion of the player graph, starting from the submitted player:

```
Depth 0: process YOUR recent matches
Depth 1: process each opponent's recent matches
Depth 2: process their opponents' recent matches
...
```

For each match, every player on the winning team gets a directed edge to every player on the losing team. This cross-team recording (rather than just tracking one player's wins) makes the graph significantly denser and improves path-finding success rates.

Each edge is stored in Redis as two complementary keys:

```
beat:<winner_puuid>        → SADD <loser_puuid>        # who they beat (set)
match_link:<winner_puuid>  → HSET <loser_puuid> match_id  # proof of the win
```

The `match_link` key is what makes each step in the chain verifiable — the frontend links directly to the match on op.gg.

Already-processed matches are tracked via `match_processed:<match_id>` keys, so re-crawling a player is cheap and incremental.

### 2. Find — BFS Pathfinding

Once the crawl completes (or if the graph already has enough data from prior crawls), `GET /lol/api/chain?riot_id=...` runs BFS over the Redis graph:

```python
def find_path(r, start_puuid, goal_puuid):
    visited = {start}
    queue = deque([[start]])

    while queue:
        path = queue.popleft()
        current = path[-1]
        for neighbor in r.smembers(f"beat:{current}"):
            if neighbor not in visited:
                new_path = path + [neighbor]
                if neighbor == goal:
                    return new_path
                visited.add(neighbor)
                queue.append(new_path)
    return None
```

BFS guarantees the **shortest** beat chain. Edge weights are uniform (a win is a win), so Dijkstra or A* would add complexity without benefit.

The goal node is always the current #1 Challenger by LP, fetched fresh from the Riot API and cached in Redis with a 1-hour TTL.

### 3. Respond — Enrich and Return

The chain endpoint doesn't just return PUUIDs — it re-fetches each match to pull full participant data (champions, KDA, game type, timestamp) so the frontend can render a detailed, linkable breakdown of each step.

---

## Request Flow

```
User submits Riot ID
        │
        ▼
POST /lol/api/crawl
        │
        ├─► API enqueues job in Redis Queue
        │
        └─► Returns { job_id } immediately
                │
                ▼
        Worker container picks up job
                │
                ▼
        crawler.crawl_user_graph()
          ├─ resolve PUUID via Riot account-v1
          ├─ fetch recent match IDs
          ├─ for each new match: fetch detail, record beats
          └─ expand BFS frontier to opponents' opponents

Frontend polls GET /lol/api/job/<job_id>
        │
        ▼ (status: finished)
GET /lol/api/chain?riot_id=...
        │
        ▼
BFS over Redis graph → shortest path
        │
        ▼
Enrich each step with match details
        │
        ▼
Return chain JSON to frontend
```

---

## Redis Schema

| Key | Type | Value | Purpose |
|-----|------|-------|---------|
| `beat:<puuid>` | Set | `{loser_puuid, ...}` | Adjacency list (who this player beat) |
| `match_link:<puuid>` | Hash | `loser_puuid → match_id` | Proof of each win edge |
| `puuid:name:<puuid>` | String | `"GameName#Tag"` | Display name cache |
| `match_processed:<match_id>` | String | `"1"` | Dedup — skip already-seen matches |
| `top1:puuid` | String | `<puuid>` | Cached #1 Challenger, 1-hour TTL |
| `player:<puuid>` | String | JSON | Summoner metadata cache |

Redis was chosen for the graph (over a relational DB) for two reasons. First, its native set and hash types map directly onto the adjacency list structure — `SMEMBERS beat:<puuid>` is a single O(1) call to get all neighbors. Second, TTL support means stale graph data from old ranked seasons expires automatically without any cleanup job.

---

## Why These Design Choices?

**RQ over Celery** — The crawl is a single task type with no complex routing or scheduling needs. RQ's simplicity (one decorator, no config file) is a better fit than a full Celery + broker setup for a surface this small.

**BFS over DFS** — DFS could find *a* path faster, but not necessarily the *shortest* one. BFS is the right algorithm when all edges are equal weight and you want the minimum-hop result.

**Polling over WebSockets** — Crawls can take anywhere from 30 seconds to several minutes. Given the low concurrency this app targets, HTTP polling at a fixed interval is simpler to implement and operate than maintaining persistent WebSocket connections per user. If concurrency ever became a concern, the polling endpoint is already decoupled from the worker — switching to WebSocket push would only require a frontend change.

**Cross-team beat recording** — An earlier version only recorded wins from the submitted player's perspective. Recording all winning-team → losing-team edges at every match processed dramatically increases graph density, improving path-finding success without additional API calls.

---

## API Reference

### `POST /lol/api/crawl`

Enqueue a background graph crawl for a player.

```json
// Request body
{ "riot_id": "Praynr#NA1", "depth": 2 }

// Response
{ "message": "Crawl job queued!", "job_id": "abc-123" }
```

`depth` controls how many hops of opponents to crawl. Depth 2 typically visits several hundred players.

### `GET /lol/api/job/<job_id>`

Poll crawl job status.

```json
{
  "job_id": "abc-123",
  "status": "finished",   // queued | started | finished | failed
  "result": { "riot_id": "Praynr#NA1", "depth": 2, "players_visited": 312 },
  "error": null
}
```

### `GET /lol/api/chain?riot_id=GameName%23TagLine`

Search the existing graph for the shortest beat chain to #1.

```json
{
  "found": true,
  "chain": [
    {
      "step": 1,
      "winner": "Praynr#NA1",
      "loser": "SomePlayer#NA1",
      "match_id": "NA1_1234567890",
      "game_type": "Ranked Solo",
      "game_date": 1715000000000,
      "game_duration": 1842,
      "participants": [ ... ]
    }
  ]
}
```

### `GET /lol/api/queue`

Inspect the RQ job queue state.

```json
{ "queued": 0, "started": 1, "finished": 47, "failed": 2 }
```

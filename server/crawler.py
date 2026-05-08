"""
lol-beat-number-one
===================
Build a directed "beat graph" where edge A -> B means:
  "A beat B in at least one ranked solo/duo game we've seen"

Then find the shortest path from YOUR puuid to the #1 Challenger player.

Usage:
    python crawler.py --riot-id "Praynr#NA1" --depth 2

Configuration via .env file (see .env in this directory):
    RIOT_API_KEY   – your Riot Games API key
    REDIS_HOST     – defaults to localhost
    REDIS_PORT     – defaults to 6379
    REDIS_DB       – defaults to 0

Redis is used to persist the beat graph across runs so crawling can be
resumed and results are never lost.

Graph schema in Redis
---------------------
  beat:<winner_puuid>          SADD  <loser_puuid>       (winner beat loser)
  match_link:<winner_puuid>    HSET  <loser_puuid> match_id
  puuid:name:<puuid>           SET   "GameName#TagLine"
  match_processed:<match_id>   SET   "1"                 (already processed)
  top1:puuid                   SET   <puuid of #1 player>
"""

import os
import sys
import time
import argparse
import logging
from collections import deque

import requests
import redis
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Config / logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

RIOT_API_KEY = os.environ.get("RIOT_API_KEY", "")

HEADERS = {"X-Riot-Token": RIOT_API_KEY}

# Riot API base URLs
NA_PLATFORM = "https://na1.api.riotgames.com"
AMERICAS    = "https://americas.api.riotgames.com"

# Redis connection
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_DB   = int(os.environ.get("REDIS_DB", 0))

# How many recent matches to pull per player
MATCHES_PER_PLAYER = 20

# Seconds to sleep between API calls (dev key = 1.2 s to stay under 1 req/s)
RATE_SLEEP = 0


# ---------------------------------------------------------------------------
# Redis helpers
# ---------------------------------------------------------------------------

def get_redis() -> redis.Redis:
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)


def record_beat(r: redis.Redis, winner: str, loser: str, match_id: str):
    """winner beat loser in match_id."""
    r.sadd(f"beat:{winner}", loser)
    r.hset(f"match_link:{winner}", loser, match_id)


def get_beaten_by(r: redis.Redis, winner: str) -> set:
    """Return set of puuids that `winner` has beaten."""
    return r.smembers(f"beat:{winner}")


def set_name(r: redis.Redis, puuid: str, name: str):
    r.set(f"puuid:name:{puuid}", name)


def get_name(r: redis.Redis, puuid: str) -> str:
    return r.get(f"puuid:name:{puuid}") or puuid[:12] + "…"


def mark_match_processed(r: redis.Redis, match_id: str):
    r.set(f"match_processed:{match_id}", "1")


def is_match_processed(r: redis.Redis, match_id: str) -> bool:
    return bool(r.exists(f"match_processed:{match_id}"))


def set_top1(r: redis.Redis, puuid: str):
    r.set("top1:puuid", puuid, ex=3600)


def get_top1(r: redis.Redis) -> str | None:
    return r.get("top1:puuid")


# ---------------------------------------------------------------------------
# Riot API helpers
# ---------------------------------------------------------------------------

def _get(url: str, params: dict | None = None) -> dict | list | None:
    """GET with simple retry logic and rate-limit sleep."""
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", 5))
                log.warning("Rate limited – sleeping %ss", retry_after)
                time.sleep(retry_after)
                continue
            if resp.status_code == 404:
                log.debug("404 for %s", url)
                return None
            log.warning("HTTP %s for %s", resp.status_code, url)
            return None
        except requests.RequestException as exc:
            log.warning("Request error (%s): %s", attempt + 1, exc)
            time.sleep(2)
    return None


def get_riot_id_by_puuid(puuid: str) -> str | None:
    """Resolve a puuid to a Riot ID (GameName#TagLine) via account-v1."""
    url = f"{AMERICAS}/riot/account/v1/accounts/by-puuid/{puuid}"
    data = _get(url)
    time.sleep(RATE_SLEEP)
    if data:
        game_name = data.get("gameName", "")
        tag_line = data.get("tagLine", "")
        if game_name:
            return f"{game_name}#{tag_line}"
    return None


def get_challenger_top1(r: redis.Redis) -> tuple[str, str]:
    """
    Fetch NA Challenger ladder and return (puuid, name) of the
    highest-LP player. Caches puuid in Redis.
    """
    cached = get_top1(r)
    if cached:
        name = get_name(r, cached)
        log.info("Top-1 from cache: %s (%s…)", name, cached[:12])
        return cached, name

    log.info("Fetching Challenger ladder…")
    data = _get(f"{NA_PLATFORM}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5")

    if not data:
        raise RuntimeError("Failed to fetch Challenger ladder")

    entries = data.get("entries", [])
    top = max(entries, key=lambda e: e["leaguePoints"])
    puuid = top["puuid"]
    name = get_riot_id_by_puuid(puuid) or f"LP:{top['leaguePoints']}"

    set_top1(r, puuid)
    set_name(r, puuid, name)
    log.info("Top-1 player: %s LP=%s puuid=%s…", name, top["leaguePoints"], puuid[:12])
    return puuid, name


def get_puuid_by_riot_id(game_name: str, tag_line: str) -> str | None:
    """Resolve Riot ID (GameName#TagLine) -> puuid."""
    url = f"{AMERICAS}/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
    data = _get(url)
    time.sleep(RATE_SLEEP)
    if data:
        return data.get("puuid")
    return None


def get_match_ids(puuid: str, count: int = MATCHES_PER_PLAYER, queue: int | None = None) -> list[str]:
    """
    Get recent match IDs for a puuid.
    Pass queue=420 to restrict to ranked solo/duo, or None for all queues.
    """
    url = f"{AMERICAS}/lol/match/v5/matches/by-puuid/{puuid}/ids"
    params: dict = {"start": 0, "count": count}
    if queue is not None:
        params["queue"] = queue
    data = _get(url, params=params)
    time.sleep(RATE_SLEEP)
    return data or []


def get_match_detail(match_id: str) -> dict | None:
    """Fetch full match detail."""
    url = f"{AMERICAS}/lol/match/v5/matches/{match_id}"
    data = _get(url)
    time.sleep(RATE_SLEEP)
    return data


# ---------------------------------------------------------------------------
# Core: process one player's recent matches
# ---------------------------------------------------------------------------

def process_player(r: redis.Redis, puuid: str, queue: int | None = None) -> list[str]:
    """
    Pull recent matches for `puuid`, record wins/losses in Redis,
    and return list of enemy puuids encountered (for further crawling).
    Skips matches already recorded in match_processed:<match_id>.
    """
    log.info("Processing player %s (%s)…", get_name(r, puuid), puuid[:12])
    match_ids = get_match_ids(puuid, queue=queue)

    new_match_ids = [m for m in match_ids if not is_match_processed(r, m)]
    log.info("  Found %d total matches, %d new to process", len(match_ids), len(new_match_ids))

    if not new_match_ids:
        return []

    enemies_seen: list[str] = []

    for match_id in new_match_ids:
        detail = get_match_detail(match_id)
        if not detail:
            continue

        info = detail.get("info", {})
        participants = info.get("participants", [])

        by_puuid = {p["puuid"]: p for p in participants}

        if puuid not in by_puuid:
            continue

        my_team_id = by_puuid[puuid]["teamId"]

        my_team    = [p for p in participants if p["teamId"] == my_team_id]
        enemy_team = [p for p in participants if p["teamId"] != my_team_id]

        # Cache display names for everyone
        for p in participants:
            if not r.exists(f"puuid:name:{p['puuid']}"):
                riot_id = f"{p.get('riotIdGameName', '?')}#{p.get('riotIdTagline', '?')}"
                set_name(r, p["puuid"], riot_id)

        my_team_won = by_puuid[puuid]["win"]

        if my_team_won:
            winning_team = my_team
            losing_team  = enemy_team
        else:
            winning_team = enemy_team
            losing_team  = my_team

        # Record beats cross-team only, store the match_id for the chain display
        for winner in winning_team:
            for loser in losing_team:
                record_beat(r, winner["puuid"], loser["puuid"], match_id)

        # Only expand BFS through enemies, not teammates
        for p in enemy_team:
            enemies_seen.append(p["puuid"])

        mark_match_processed(r, match_id)

    log.info("  Done. Beat graph updated.")
    return list(set(enemies_seen))


# ---------------------------------------------------------------------------
# BFS path finder
# ---------------------------------------------------------------------------

def find_path(r: redis.Redis, start: str, goal: str) -> list[str] | None:
    """
    BFS over the beat graph. Returns list of puuids [start, ..., goal]
    where each consecutive pair means left beat right.
    Returns None if no path found.
    """
    if start == goal:
        return [start]

    visited = {start}
    queue: deque[list[str]] = deque([[start]])

    while queue:
        path = queue.popleft()
        current = path[-1]

        for nxt in get_beaten_by(r, current):
            if nxt in visited:
                continue
            new_path = path + [nxt]
            if nxt == goal:
                return new_path
            visited.add(nxt)
            queue.append(new_path)

    return None


def print_path(r: redis.Redis, path: list[str]):
    print("\n🏆  Beat chain found!\n")
    for i, puuid in enumerate(path):
        name = get_name(r, puuid)
        if i == 0:
            label = "YOU"
        elif i == len(path) - 1:
            label = "#1"
        else:
            label = f"step {i}"
        print(f"  [{label}] {name}")
        if i < len(path) - 1:
            print(f"        ↓ beat")
    print()


# ---------------------------------------------------------------------------
# RQ entrypoint – called by lol_server.py via q.enqueue()
# ---------------------------------------------------------------------------

def crawl_user_graph(riot_id: str, depth: int = 2, ranked_only: bool = False) -> dict:
    """
    Importable RQ job target. Crawls `riot_id`'s games up to `depth` hops
    and stores the beat graph in Redis.

    - Your own matches (depth 0) are always filtered to ranked solo/duo (queue 420).
    - Opponent matches (depth 1+) default to all queues so we don't miss games
      like an enemy beating #1 in a non-ranked queue. Pass ranked_only=True to
      restrict everything to ranked.

    Returns a summary dict that RQ stores as the job result.
    """
    if not RIOT_API_KEY:
        raise RuntimeError("RIOT_API_KEY not set in environment")

    r = get_redis()

    if "#" not in riot_id:
        raise ValueError(f"Riot ID must be GameName#TagLine, got: {riot_id}")

    game_name, tag_line = riot_id.split("#", 1)
    my_puuid = get_puuid_by_riot_id(game_name, tag_line)
    if not my_puuid:
        raise RuntimeError(f"Could not resolve Riot ID: {riot_id}")

    set_name(r, my_puuid, riot_id)
    log.info("crawl_user_graph: %s  puuid=%s…  depth=%d", riot_id, my_puuid[:12], depth)

    # Make sure #1 is cached so find_path works immediately after
    get_challenger_top1(r)

    opponent_queue = 420 if ranked_only else None

    frontier = [my_puuid]
    your_turn = True
    visited_this_run: set[str] = {my_puuid}

    for d in range(depth):
        log.info("=== Crawl depth %d/%d  (%d players in frontier) ===", d + 1, depth, len(frontier))
        next_frontier: list[str] = []

        for puuid in frontier:
            q_filter = 420 if your_turn else opponent_queue
            enemies = process_player(r, puuid, queue=q_filter)
            next_frontier.extend(enemies)

        your_turn = False

        # Deduplicate and skip anyone we've already queued this run
        frontier = []
        for p in set(next_frontier):
            if p not in visited_this_run:
                visited_this_run.add(p)
                frontier.append(p)

        log.info("Next frontier size: %d", len(frontier))
        if not frontier:
            log.info("Frontier exhausted early.")
            break

    log.info("crawl_user_graph: finished  players_visited=%d", len(visited_this_run))
    return {
        "riot_id": riot_id,
        "depth": depth,
        "players_visited": len(visited_this_run),
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description="LoL Beat #1 – find your chain to the top")
    p.add_argument("--riot-id", required=True,
                   help='Your Riot ID, e.g. "Praynr#NA1"')
    p.add_argument("--depth", type=int, default=2,
                   help="BFS crawl depth (default 2 – each hop fetches opponents' matches)")
    p.add_argument("--find-only", action="store_true",
                   help="Skip crawling, just search existing graph in Redis")
    p.add_argument("--ranked-only", action="store_true",
                   help="Only fetch ranked solo/duo matches (queue 420). "
                        "Your own matches always use this; opponents default to all queues.")
    return p.parse_args()


def main():
    args = parse_args()

    if not RIOT_API_KEY and not args.find_only:
        log.error("Set RIOT_API_KEY in your .env file")
        sys.exit(1)

    r = get_redis()

    try:
        r.ping()
        log.info("Redis connected ✓")
    except redis.ConnectionError as e:
        log.error("Cannot connect to Redis: %s", e)
        sys.exit(1)

    top1_puuid, top1_name = get_challenger_top1(r)

    if "#" not in args.riot_id:
        log.error("Riot ID must be in format GameName#TagLine")
        sys.exit(1)

    game_name, tag_line = args.riot_id.split("#", 1)
    my_puuid = get_puuid_by_riot_id(game_name, tag_line)
    if not my_puuid:
        log.error("Could not resolve Riot ID: %s", args.riot_id)
        sys.exit(1)

    set_name(r, my_puuid, args.riot_id)
    log.info("Your puuid: %s…", my_puuid[:12])

    if not args.find_only:
        crawl_user_graph(args.riot_id, depth=args.depth, ranked_only=args.ranked_only)

    log.info("Searching beat graph for path %s → %s…", args.riot_id, top1_name)
    path = find_path(r, my_puuid, top1_puuid)

    if path:
        print_path(r, path)
    else:
        print(f"\n❌  No beat-chain found yet from {args.riot_id} to #1 ({top1_name}).")
        print("    Try increasing --depth or run again later to crawl more games.\n")


if __name__ == "__main__":
    main()

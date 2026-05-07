from flask import Blueprint, request, jsonify
from rq import Queue
from rq.job import Job
import redis
import os
import crawler

# Create a Blueprint instead of a full Flask app
lol_api = Blueprint('lol_api', __name__)

# ---------------------------------------------------------------------------
# Redis + RQ Setup
# ---------------------------------------------------------------------------
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_DB   = int(os.environ.get("REDIS_DB", 0))

redis_conn = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
q = Queue(connection=redis_conn)

# ---------------------------------------------------------------------------
# Routes 
# ---------------------------------------------------------------------------

@lol_api.route("/chain", methods=["GET"])
def get_chain():
    """
    GET /lol/api/chain?riot_id=GameName%23TagLine
    Searches the existing Redis beat graph and returns the shortest path
    from the given player to the #1 Challenger. Does NOT crawl.
    """
    riot_id = request.args.get("riot_id", "").strip()
    if not riot_id:
        return jsonify({"error": "riot_id query param required"}), 400
    if "#" not in riot_id:
        return jsonify({"error": "Riot ID must be in format GameName#TagLine"}), 400

    r = crawler.get_redis()
    game_name, tag_line = riot_id.split("#", 1)
    
    my_puuid = crawler.get_puuid_by_riot_id(game_name, tag_line)
    if not my_puuid:
        return jsonify({"error": f"Could not resolve Riot ID: {riot_id}"}), 404

    top1_puuid, top1_name = crawler.get_challenger_top1(r)
    path = crawler.find_path(r, my_puuid, top1_puuid)

    if not path:
        return jsonify({"found": False, "chain": []})

    chain_data = []
    for i in range(len(path) - 1):
        winner_puuid = path[i]
        loser_puuid  = path[i + 1]
        match_id = r.hget(f"match_link:{winner_puuid}", loser_puuid)
        chain_data.append({
            "step":     i + 1,
            "winner":   crawler.get_name(r, winner_puuid),
            "loser":    crawler.get_name(r, loser_puuid),
            "match_id": match_id,
        })

    return jsonify({"found": True, "chain": chain_data})


@lol_api.route("/crawl", methods=["POST"])
def enqueue_crawl():
    """
    POST /lol/api/crawl
    Body: { "riot_id": "GameName#TagLine", "depth": 2 }
    Enqueues a background crawl job via RQ. Returns the job ID immediately.
    """
    body    = request.get_json(force=True, silent=True) or {}
    riot_id = body.get("riot_id", "").strip()
    depth   = int(body.get("depth", 2))

    if not riot_id:
        return jsonify({"error": "riot_id is required"}), 400
    if "#" not in riot_id:
        return jsonify({"error": "Riot ID must be in format GameName#TagLine"}), 400

    # crawl_user_graph is the importable entrypoint in crawler.py
    job = q.enqueue(
        crawler.crawl_user_graph,
        riot_id,
        depth,
        job_timeout=3600,   # 1 hour max – deep crawls can take a while
    )

    return jsonify({"message": "Crawl job queued!", "job_id": job.id})


@lol_api.route("/job/<job_id>", methods=["GET"])
def job_status(job_id):
    """
    GET /lol/api/job/<job_id>
    Returns current status of a crawl job: queued / started / finished / failed.
    """
    try:
        job = Job.fetch(job_id, connection=redis_conn)
        return jsonify({
            "job_id":  job.id,
            "status":  job.get_status(),
            "result":  job.result,
            "error":   str(job.exc_info) if job.exc_info else None,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404


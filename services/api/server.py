from gevent import monkey
monkey.patch_all()
from gevent.queue import Empty as GeventQueueEmpty

from flask import Flask, jsonify, request, has_request_context, Response, stream_with_context
from flask import g
from flask_cors import CORS
import json
import datetime
import math
import time
import copy
import requests
import pymongo
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from imgSizeReducer import reduce_image_size
from imageManager import proof_images, board_images
from showcase import load_showcase_filenames, serve_showcase_image
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.exceptions import RequestEntityTooLarge
import os
from urllib.parse import quote
from dotenv import load_dotenv
load_dotenv()

from rq import Worker
from logger import get_logger
from lol_server import lol_api
from redis_events import BROKER_DISCONNECTED, RedisEventBroker
from utils import postToDiscord
import analytics

log = get_logger(__name__)

_START_TIME = time.time()

app = Flask(__name__, static_folder='build')
app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get("API_MAX_CONTENT_LENGTH", 16 * 1024 * 1024))
CORS(app)

# Register the League of Legends API routes
app.register_blueprint(lol_api, url_prefix='/lol/api')

redis_host = os.environ.get("REDIS_HOST", "localhost")
redis_port = os.environ.get("REDIS_PORT", "6379")
redis_db = os.environ.get("REDIS_DB", "0")
redis_url = f"redis://{redis_host}:{redis_port}/{redis_db}"


# Apply ProxyFix to trust the headers Nginx is sending
app.wsgi_app = ProxyFix(
    app.wsgi_app, 
    x_for=1,      # Trusts the X-Forwarded-For header from Nginx
    x_proto=1,    # Trusts the X-Forwarded-Proto header from Nginx
    x_host=1      # Trusts the Host header from Nginx,
)

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    storage_uri=redis_url,
    default_limits=["10000 per hour"]
)

import redis as redis_lib
from redis.backoff import NoBackoff
from redis.retry import Retry

redis_command_pool_size = max(1, int(os.environ.get("REDIS_COMMAND_POOL_SIZE", 64)))
redis_event_pool_size = max(1, int(os.environ.get("REDIS_EVENT_POOL_SIZE", 4)))

_redis_pool = redis_lib.BlockingConnectionPool.from_url(
    redis_url,
    max_connections=redis_command_pool_size,
    timeout=2,
    decode_responses=True,
)
_redis = redis_lib.Redis(connection_pool=_redis_pool)

_event_redis_pool = redis_lib.ConnectionPool.from_url(
    redis_url,
    max_connections=redis_event_pool_size,
    # Pub/Sub delivery is not durable, so the broker must observe every
    # disconnect and force clients to resync after its own reconnect loop.
    retry=Retry(NoBackoff(), 0),
    decode_responses=True,
)
_event_redis = redis_lib.Redis(connection_pool=_event_redis_pool)
_board_event_broker = RedisEventBroker(_event_redis, log)

mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
myclient = pymongo.MongoClient(mongo_uri)
db = myclient["bingo"]
mycol = db['bingo']

allowedAuthTypes = ['admin', 'general']
allowedBoardTypes = ['osrs', 'generic']
adminTileKeys = ['description', 'image', 'points', 'title', 'rowBingo', 'colBingo']
generalTileKeys = ['proof', 'checked', 'currPoints', 'proofImages']
boardCreationKeys = ['adminPassword', 'generalPassword', 'boardName', 'boardData', 'teams', 'rows', 'columns', 'visibleRows', 'boardType']
disallowedRouteChars = ['?', '#', '/', '\\']
testBoardPrefix = os.environ.get("PLAYWRIGHT_E2E_BOARD_PREFIX", os.environ.get("SELENIUM_E2E_BOARD_PREFIX", "__playwright_e2e__"))
maxProofImages = int(os.environ.get("MAX_PROOF_IMAGES_PER_TILE", 10))
healthAnalyticsCacheSeconds = max(0, int(os.environ.get("HEALTH_ANALYTICS_CACHE_SECONDS", 60)))
defaultTeamObj = {
  'checked': False,
  'proof': '',
  'proofImages': [],
  'currPoints': 0,
  'revision': 0,
}
defaultBoardObj = {
  'points': 0,
  'title': '',
  'description': '',
  'image': None,
  'rowBingo': 0,
  'colBingo': 0,
  'revision': 0,
}

def setup_indexes(collection):
    try:
        collection.create_index([("boardName", 1)])
        collection.create_index([("date", 1)], expireAfterSeconds=100000000)
        log.info("MongoDB indexes created/verified successfully")
    except Exception as e:
        log.error("Failed to set up MongoDB indexes: %s", e)

setup_indexes(mycol)


# ---------------------------------------------------------------------------
# Request / response logging middleware
# ---------------------------------------------------------------------------

_SLOW_REQUEST_THRESHOLD_MS = 250

@app.before_request
def log_request():
    g.request_start_time = time.perf_counter()
    origin = request.headers.get('Origin', request.host)
    log.info("--> %s %s  ip=%s  origin=%s", request.method, request.url, request.remote_addr, origin)

@app.after_request
def log_response(response):
    duration_ms = (time.perf_counter() - g.request_start_time) * 1000
    log_method = log.warning if duration_ms >= _SLOW_REQUEST_THRESHOLD_MS else log.info
    log_method(
        "<-- %s %s  status=%d  duration_ms=%.2f",
        request.method,
        request.url,
        response.status_code,
        duration_ms,
    )
    return response

@app.errorhandler(429)
def rate_limit_handler(e):
    log.warning("Rate limit exceeded  ip=%s  path=%s", request.remote_addr, request.path)
    return jsonify(error="Rate limit exceeded", message=str(e.description)), 429

@app.errorhandler(RequestEntityTooLarge)
def request_too_large_handler(e):
    log.warning("Request too large  ip=%s  path=%s", request.remote_addr, request.path)
    return jsonify(error="Request too large", message="Uploaded data is too large."), 413


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def initEmptyTeamData(row, col):
  teamData = []
  for i in range(row):
    teamData.append([])
    for j in range(col):
      teamData[i].append({ **defaultTeamObj, 'proofImages': [] })
  return teamData


def bad_request(message):
  response = jsonify({'message': message})
  response.status_code = 400
  return response

def request_ip():
  return request.remote_addr if has_request_context() else None

def auth(boardName, password, pwtype, mustBeAdmin = False):
  if (pwtype not in allowedAuthTypes):
    log.warning("Auth failed - invalid auth type '%s'  board=%s", pwtype, boardName)
    return [None, bad_request('Invalid auth type.')]
  if (pwtype == 'admin'):
    pwtype = 'adminPassword'
  if (mustBeAdmin):
    if (pwtype != 'adminPassword'):
      log.warning("Auth failed - non-admin attempted admin action  board=%s", boardName)
      return [None, bad_request('Must be an admin to make this call.')]
  if (pwtype == 'general'):
    pwtype = 'generalPassword'
  cache = mycol.find_one({'boardName': boardName})
  if (not cache):
    log.warning("Auth failed - board not found  board=%s  ip=%s", boardName, request_ip())
    return [None, bad_request('Board with that name does not exist.')]
  ##admins can do general and admin actions, so we accept a match on either
  if (pwtype == 'generalPassword'):
    if (password != cache['adminPassword'] and password != cache['generalPassword']):
      log.warning("Auth failed - wrong password  board=%s  type=general  ip=%s", boardName, request_ip())
      return [None, bad_request('Your password was incorrect.')]
  else:
    if (password != cache[pwtype]):
      log.warning("Auth failed - wrong password  board=%s  type=admin  ip=%s", boardName, request_ip())
      return [None, bad_request('Your password was incorrect.')]
  return [cache, None]

def clearBadData(data, acceptableKeys):
  for key in list(data):
    if key not in acceptableKeys:
      data.pop(key, None)
  return data

def validate_curr_points(info, board_tile):
  """Keep team claims numeric and within the configured value of their tile."""
  if 'currPoints' not in info:
    return None

  raw_curr_points = info['currPoints']
  raw_tile_points = board_tile.get('points', 0)
  if raw_curr_points is None or raw_curr_points == '':
    raw_curr_points = 0
  if raw_tile_points is None or raw_tile_points == '':
    raw_tile_points = 0

  try:
    curr_points = float(raw_curr_points)
    tile_points = float(raw_tile_points)
  except (TypeError, ValueError):
    return 'Current points must be a number.'

  if not math.isfinite(curr_points) or not math.isfinite(tile_points):
    return 'Current points must be a finite number.'
  if curr_points < 0:
    return 'Current points cannot be negative.'
  if curr_points > tile_points:
    return 'Current points cannot exceed the tile value.'

  info['currPoints'] = int(curr_points) if curr_points.is_integer() else curr_points
  return None

def clamp_visible_rows(value, rows):
  try:
    visible_rows = int(value)
  except (TypeError, ValueError):
    visible_rows = rows
  return max(1, min(visible_rows, rows))

def public_board_image(image):
  if not isinstance(image, dict):
    return image
  image_url = image.get('url')
  if not image_url:
    return None
  return { **image, 'url': board_images.public_url(image_url) }

def strip_image_opacity(image):
  if not isinstance(image, dict):
    return image
  image = { **image }
  image.pop('opacity', None)
  return image

def board_visual_rows(cache):
  if cache.get('columns'):
    return int(cache['columns'])
  board_data = cache.get('boardData', [])
  return len(board_data) if board_data else 1

def board_visible_rows(cache):
  return clamp_visible_rows(cache.get('visibleRows'), board_visual_rows(cache))

def slice_board_rows(board_data, visible_rows):
  return board_data[:visible_rows]

def normalize_board_type(value):
  return 'generic' if value in ['generic', 'plain'] else 'osrs'

def board_type(cache):
  return normalize_board_type(cache.get('boardType'))

def is_test_board(board_name):
  return isinstance(board_name, str) and board_name.startswith(testBoardPrefix)

def has_disallowed_route_chars(value):
  return any(char in value for char in disallowedRouteChars)

def validate_board_creation(data):
  for key in ['boardName', 'adminPassword', 'generalPassword']:
    if not isinstance(data.get(key), str) or not data[key].strip():
      return 'Please fill out all fields.'
    data[key] = data[key].strip()
    if has_disallowed_route_chars(data[key]):
      return 'Passwords and boardname cannot have these characters : ' + ' '.join(disallowedRouteChars)

  if data['boardName'].lower() in ['join', 'create']:
    return "Name can't be join or create for routing purposes."

  data['boardType'] = normalize_board_type(data.get('boardType'))

  return None

def bingo_board_url(board_name, password):
  encoded_board_name = quote(str(board_name), safe='')
  encoded_password = quote(str(password), safe='')
  return f'https://praynr.com/#/bingo/{encoded_board_name}?password={encoded_password}'

def escape_discord_link_text(value):
  return str(value).replace('\\', '\\\\').replace('[', '\\[').replace(']', '\\]')

def is_test_board_request():
  try:
    data = request.get_json(silent=True) or {}
  except Exception:
    return False
  return is_test_board(data.get('boardName'))

def publish_board_update(board_name):
  try:
    _redis.publish(f"board:{board_name}", "refresh")
  except Exception as e:
    log.warning("publish_board_update failed  board=%s  error=%s", board_name, e)

def normalize_proof_images(images, staged_images=None):
  if images is None:
    return []
  if not isinstance(images, list):
    raise ValueError("Proof images must be a list.")
  if len(images) > maxProofImages:
    raise ValueError(f"Proof images are limited to {maxProofImages} per tile.")

  saved_images = []
  for img_uri in images:
    if not isinstance(img_uri, str):
      raise ValueError("Proof images must be image URLs or uploads.")
    if img_uri.startswith('data:'):
      saved_image = proof_images.save(img_uri)
      saved_images.append(saved_image)
      if staged_images is not None:
        staged_images.append(saved_image)
      continue
    storage_url = proof_images.storage_url(img_uri)
    if not isinstance(storage_url, str) or not storage_url.startswith(proof_images.url_prefix + "/"):
      raise ValueError("Proof images must be uploaded through this board.")
    saved_images.append(storage_url)
  return saved_images


class BoardConflict(Exception):
  """Raised when a board write loses its compare-and-set race."""


def conflict_response(message='This board changed while you were editing. Refresh and try again.'):
  response = jsonify({
    'error': 'conflict',
    'message': message,
  })
  response.status_code = 409
  return response


def revision_value(value):
  """Return a non-negative integer revision, treating legacy data as zero."""
  if isinstance(value, bool):
    return 0
  try:
    parsed = int(value)
  except (TypeError, ValueError):
    return 0
  return parsed if parsed >= 0 else 0


def required_revision(data, field):
  """Read a required client revision or raise a refresh-required conflict."""
  if field not in data or isinstance(data[field], bool):
    raise BoardConflict()
  try:
    parsed = int(data[field])
  except (TypeError, ValueError):
    raise BoardConflict()
  if parsed < 0 or parsed != data[field]:
    raise BoardConflict()
  return parsed


def compatible_revision(data, field, current_value):
  """Use server-side CAS for pre-revision clients during the rollout window."""
  if field not in data:
    return revision_value(current_value)
  return required_revision(data, field)


def legacy_revision_clause(field, expected):
  if expected == 0:
    return {'$or': [{field: 0}, {field: {'$exists': False}}]}
  return {field: expected}


def board_revision_query(board_name, revisions, identity):
  # The authenticated document identity is part of every CAS predicate.  The
  # board name remains useful for readability, but is never the identity
  # fallback when a malformed document lacks `_id`.
  query = {'boardName': board_name, '_id': identity}
  clauses = [legacy_revision_clause(field, revision) for field, revision in revisions.items()]
  if clauses:
    query['$and'] = clauses
  return query


def update_matched(update_result):
  """Treat Mongo's matched_count as the compare-and-set result."""
  matched_count = getattr(update_result, 'matched_count', None)
  return isinstance(matched_count, int) and matched_count == 1


def board_tile_at(cache, row, col):
  board_data = cache.get('boardData') or []
  if not isinstance(row, int) or isinstance(row, bool) or not isinstance(col, int) or isinstance(col, bool):
    raise ValueError('Tile coordinates must be integers.')
  if row < 0 or row >= len(board_data):
    raise ValueError('That tile does not exist.')
  if not isinstance(board_data[row], list) or col < 0 or col >= len(board_data[row]):
    raise ValueError('That tile does not exist.')
  return board_data[row][col]


def team_tile_at(team, row, col):
  team_data = team.get('teamData') if isinstance(team, dict) else None
  if not isinstance(team_data, list) or row < 0 or row >= len(team_data):
    raise ValueError('That tile does not exist.')
  if not isinstance(team_data[row], list) or col < 0 or col >= len(team_data[row]):
    raise ValueError('That tile does not exist.')
  return team_data[row][col]


def tile_revision_path(root, row, col):
  return f'{root}.{row}.{col}.revision'


def tile_field_updates(root, row, col, info):
  return {f'{root}.{row}.{col}.{key}': value for key, value in info.items()}


def cleanup_staged_images(store, staged_images):
  for image in staged_images:
    store.delete(image)


def resize_grid(grid, columns, rows, default_tile):
  """Resize the column-major grid without changing its storage orientation."""
  source = grid if isinstance(grid, list) else []
  resized = []
  for column in range(columns):
    existing = source[column] if column < len(source) and isinstance(source[column], list) else []
    next_column = copy.deepcopy(existing[:rows])
    while len(next_column) < rows:
      next_column.append(copy.deepcopy(default_tile))
    resized.append(next_column)
  return resized


def board_dimensions(cache):
  board_data = cache.get('boardData') if isinstance(cache, dict) else None
  columns = len(board_data) if isinstance(board_data, list) else 0
  rows = len(board_data[0]) if columns and isinstance(board_data[0], list) else 0
  return rows, columns


def team_payload_entry(entry):
  if not isinstance(entry, dict) or not isinstance(entry.get('data'), dict):
    raise ValueError('Each team must include its metadata.')
  team = entry['data']
  name = team.get('name')
  if not isinstance(name, str) or not name.strip():
    raise ValueError('Team names cannot be empty.')
  return {
    'name': name,
    'password': team.get('password', ''),
  }

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route(f'{proof_images.url_prefix}/<path:filename>', methods=['GET'])
@limiter.exempt
def uploaded_proof_image(filename):
  return proof_images.serve(filename)

@app.route(f'{board_images.url_prefix}/<path:filename>', methods=['GET'])
@limiter.exempt
def uploaded_board_image(filename):
  return board_images.serve(filename)

@app.route('/static/uploads/showcase/<path:filename>', methods=['GET'])
@limiter.exempt
def uploaded_showcase_image(filename):
  return serve_showcase_image(filename)

@app.route('/showcase', methods=['GET'])
@limiter.limit("120 per minute")
def get_showcase():
  try:
    filenames = load_showcase_filenames()
  except ValueError as exc:
    log.warning("showcase manifest load failed  error=%s", exc)
    filenames = []

  base_url = request.host_url.rstrip('/')
  response = jsonify({
    'images': [
      f"{base_url}/static/uploads/showcase/{quote(filename, safe='')}"
      for filename in filenames
    ]
  })
  response.headers['Cache-Control'] = 'public, max-age=60'
  return response


@app.route('/health', methods=['GET'])
@limiter.limit("120 per minute")
def health():
  result = {}
  all_ok = True

  # --- MongoDB ---
  try:
    t0 = time.time()
    myclient.admin.command('ping')
    mongo_ms = round((time.time() - t0) * 1000)
    boards_count = mycol.count_documents({})
    result['mongo'] = {'status': 'ok', 'latency_ms': mongo_ms, 'boards_count': boards_count}
    try:
      result['mongo']['analytics'] = analytics.get_board_analytics(mycol, healthAnalyticsCacheSeconds)
    except Exception as e:
      log.warning("health - mongo analytics query failed: %s", e)
      result['mongo']['analytics'] = {'status': 'unavailable'}
  except Exception as e:
    log.error("health - mongo check failed: %s", e)
    result['mongo'] = {'status': 'error', 'error': str(e)}
    all_ok = False

  # --- Redis ---
  try:
    t0 = time.time()
    _redis.ping()
    redis_ms = round((time.time() - t0) * 1000)
    result['redis'] = {
      'status': 'ok',
      'latency_ms': redis_ms,
      'sse_subscribers_local': _board_event_broker.subscriber_count(),
    }
  except Exception as e:
    log.error("health - redis check failed: %s", e)
    result['redis'] = {'status': 'error', 'error': str(e)}
    all_ok = False

  # --- RQ workers + queue ---
  try:
    from rq.registry import StartedJobRegistry, FailedJobRegistry
    from rq import Queue as RQueue
    rq_conn = _redis
    q = RQueue(connection=rq_conn)
    workers = Worker.all(connection=rq_conn)
    failed_count = FailedJobRegistry(queue=q).count
    result['rq'] = {
      'status': 'ok' if workers else 'degraded',
      'workers': len(workers),
      'queued': len(q),
      'started': StartedJobRegistry(queue=q).count,
      'failed': failed_count,
    }
    if not workers:
      all_ok = False
  except Exception as e:
    log.error("health - rq check failed: %s", e)
    result['rq'] = {'status': 'error', 'error': str(e)}
    all_ok = False

  result['uptime_seconds'] = round(time.time() - _START_TIME)
  result['status'] = 'ok' if all_ok else 'degraded'

  status_code = 200 if all_ok else 503
  log.info("health - status=%s  mongo=%s  redis=%s", result['status'], result['mongo']['status'], result['redis']['status'])
  return jsonify(result), status_code


@app.route('/createBoard', methods=['POST'])
@limiter.limit("10 per hour", exempt_when=is_test_board_request)
def createBoard():
  data = json.loads(request.data.decode(), parse_float=float)
  data = clearBadData(data, boardCreationKeys)
  validation_error = validate_board_creation(data)
  if validation_error:
    return bad_request(validation_error)

  cache = mycol.find_one({'boardName': data['boardName']})
  if (cache):
    log.warning("createBoard - name already taken  board=%s  ip=%s", data['boardName'], request.remote_addr)
    return bad_request('Board Name Already Taken!!')

  data['visibleRows'] = clamp_visible_rows(data.get('visibleRows'), int(data['columns']))

  boardData = []
  for i in range(data['columns']):
    boardData.append([])
    for j in range(data['rows']):
      boardData[i].append(defaultBoardObj.copy())
      if data.get('boardType') == 'osrs' and i == 0 and j == 0:
        boardData[i][0]['title'] = 'Example Tile'
        boardData[i][0]['image'] = {'url': 'https://oldschool.runescape.wiki/images/thumb/Twisted_bow_detail.png/180px-Twisted_bow_detail.png'}
  
  data['boardData'] = boardData

  for i in range(data['teams']):
    team = 'team-' + str(i)
    teamData = initEmptyTeamData(len(data['boardData']), len(data['boardData'][0]))
    data[team] = {
      'name': team,
      'teamData': teamData
    }

  ts = time.time()
  isodate = datetime.datetime.fromtimestamp(ts, None)
  data['date'] = isodate
  data['boardMutationRevision'] = 0
  data['boardSettingsRevision'] = 0
  insert = mycol.insert_one(data)
  if (not insert):
    log.error("createBoard - MongoDB insert failed  board=%s", data['boardName'])
    return bad_request('Failed to create bingo board in Mongo.')

  log.info("createBoard - success  board=%s  teams=%d  ip=%s", data['boardName'], data['teams'], request.remote_addr)

  if not is_test_board(data["boardName"]) and os.environ.get('CREATION_WEBHOOK', '').strip():
    board_url = bingo_board_url(data["boardName"], data.get('generalPassword', ''))
    board_label = escape_discord_link_text(data["boardName"])
    discord_message = 'New bingo board created: **[{}]({})**'.format(board_label, board_url)
    postToDiscord(discord_message, 'CREATION_WEBHOOK')
  elif is_test_board(data["boardName"]):
    log.info("createBoard - creation webhook skipped for test board  board=%s", data['boardName'])

  return jsonify(success=True)

@app.route('/getBoard/<boardName>/<password>/<pwtype>', methods=['GET'])
@limiter.limit("5000 per hour")
def getBoard(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err

  boardData = copy.deepcopy(cache['boardData'])
  visibleRows = board_visible_rows(cache)
  for row in boardData:
    for tile in row:
      tile['revision'] = revision_value(tile.get('revision'))
      tile['image'] = public_board_image(tile.get('image'))
  if pwtype == 'general':
    boardData = slice_board_rows(boardData, visibleRows)
  teamData = []
  generalPassword = cache['generalPassword']
  passwordRequired = cache.get('requirePassword', False)
  cacheBoardType = board_type(cache)

  for i in range(cache['teams']):
    team = 'team-' + str(i)
    team_cache = copy.deepcopy(cache[team])
    if (pwtype != 'admin' and 'password' in team_cache):
      del team_cache['password']

    for row in team_cache.get('teamData', []):
      for tile in row:
        tile['revision'] = revision_value(tile.get('revision'))
        if 'proofImages' in tile:
          tile['proofImages'] = [proof_images.public_url(image) for image in tile['proofImages']]
          
    teamData.append({
      'team': i,
      'data': team_cache
    })

  log.info("getBoard - success  board=%s  pwtype=%s", boardName, pwtype)
  return jsonify(
    boardData=boardData,
    teamData=teamData,
    generalPassword=generalPassword,
    teamPasswordsRequired=passwordRequired,
    visibleRows=visibleRows,
    boardType=cacheBoardType,
    boardMutationRevision=revision_value(cache.get('boardMutationRevision')),
    boardSettingsRevision=revision_value(cache.get('boardSettingsRevision')),
  )

@app.route('/events/<boardName>/<password>/<pwtype>')
@limiter.limit("2000 per hour")
def board_events(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err

  def event_stream():
    channel = f"board:{boardName}"
    subscription = _board_event_broker.subscribe(channel)
    log.info("SSE open  board=%s  pwtype=%s  ip=%s", boardName, pwtype, request.remote_addr)
    try:
      yield "retry: 3000\n\n"
      while True:
        try:
          message = subscription.get(timeout=25)
        except GeventQueueEmpty:
          message = None

        if message is BROKER_DISCONNECTED:
          return
        if message is not None:
          yield "data: refresh\n\n"
        else:
          yield ": heartbeat\n\n"
    finally:
      _board_event_broker.unsubscribe(channel, subscription)
      log.info("SSE closed  board=%s", boardName)

  return Response(
    stream_with_context(event_stream()),
    mimetype='text/event-stream',
    headers={
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      'Connection': 'keep-alive',
    }
  )

@app.route('/updateBoard/<boardName>/<password>/<pwtype>', defaults={'teampw': ''}, methods=['PUT'])
@app.route('/updateBoard/<boardName>/<password>/<pwtype>/<teampw>', methods=['PUT'])
@limiter.limit("300 per hour")
def updateBoard(boardName, password, pwtype, teampw):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err
  data = request.get_json(silent=True)
  if not isinstance(data, dict) or not isinstance(data.get('info'), dict):
    return bad_request('A tile update is required.')

  try:
    row = data['row']
    col = data['col']
    if isinstance(row, bool) or isinstance(col, bool) or int(row) != row or int(col) != col:
      raise ValueError('Tile coordinates must be integers.')
    row = int(row)
    col = int(col)
    expected_settings = compatible_revision(
      data,
      'expectedSettingsRevision',
      cache.get('boardSettingsRevision'),
    )
  except (KeyError, TypeError, ValueError):
    return bad_request('Tile coordinates and revisions are required.')
  except BoardConflict:
    return conflict_response()

  if expected_settings != revision_value(cache.get('boardSettingsRevision')):
    return conflict_response()

  try:
    board_tile = board_tile_at(cache, row, col)
  except ValueError as exc:
    return bad_request(str(exc))
  if not isinstance(board_tile, dict):
    return bad_request('That tile does not exist.')

  if pwtype == 'admin':
    try:
      expected_revision = compatible_revision(data, 'expectedRevision', board_tile.get('revision'))
    except BoardConflict:
      return conflict_response()
    if expected_revision != revision_value(board_tile.get('revision')):
      return conflict_response()
    info = clearBadData(data['info'], adminTileKeys)
    if 'image' in info:
      info['image'] = strip_image_opacity(info['image'])

    image = info.get('image')
    image_url = image.get('url', '') if isinstance(image, dict) else ''
    staged_image = []
    if isinstance(image_url, str) and image_url.startswith('data:'):
      try:
        saved_url = board_images.save(image_url)
        staged_image.append(saved_url)
        info['image'] = {**image, 'url': saved_url}
      except ValueError as exc:
        log.warning("updateBoard - board image rejected  board=%s  error=%s", boardName, exc)
        return bad_request(str(exc))
      except Exception as exc:
        log.error("updateBoard - board image save failed  board=%s  error=%s", boardName, exc)
        return bad_request('Failed to save tile image.')

    tile_path = tile_revision_path('boardData', row, col)
    update_document = {
      '$set': tile_field_updates('boardData', row, col, info),
      '$inc': {tile_path: 1, 'boardMutationRevision': 1},
    }
    query = board_revision_query(boardName, {
      tile_path: expected_revision,
      'boardSettingsRevision': expected_settings,
    }, cache.get('_id'))
    try:
      update = mycol.update_one(query, update_document)
    except Exception as exc:
      # Mongo outcome is unknown. Keep both the newly staged image and any
      # previous reference until a later reconciliation can inspect the board.
      log.error("updateBoard - admin tile write failed  board=%s  error=%s", boardName, exc)
      return bad_request('Failed to save board tile.')
    if not update_matched(update):
      cleanup_staged_images(board_images, staged_image)
      return conflict_response()
    # Retired files are pruned by the reference-aware upload maintenance job.
    # They cannot be deleted here because another board may share the URL.
    log.info("updateBoard - admin tile update  board=%s  row=%s  col=%s", boardName, row, col)
    publish_board_update(boardName)
    return jsonify(success=True, revision=expected_revision + 1, boardSettingsRevision=expected_settings)

  if pwtype == 'general':
    if row >= board_visible_rows(cache):
      log.warning("updateBoard - hidden row update rejected  board=%s  row=%s  ip=%s", boardName, row, request.remote_addr)
      return bad_request('That row has not been revealed yet.')

    info = data['info']
    team_id = info.get('teamId')
    if isinstance(team_id, bool):
      return bad_request('Team does not exist.')
    try:
      team_id = int(team_id)
    except (TypeError, ValueError):
      return bad_request('Team does not exist.')
    if team_id < 0 or team_id >= revision_value(cache.get('teams')):
      log.warning("updateBoard - team not found  board=%s  team=%s  ip=%s", boardName, team_id, request.remote_addr)
      return bad_request('Team does not exist.')

    team_key = 'team-' + str(team_id)
    team_data = cache.get(team_key)
    if not isinstance(team_data, dict):
      return bad_request('Team does not exist.')
    try:
      existing_tile = team_tile_at(team_data, row, col)
    except ValueError as exc:
      return bad_request(str(exc))
    if not isinstance(existing_tile, dict):
      return bad_request('That tile does not exist.')
    try:
      expected_revision = compatible_revision(data, 'expectedRevision', existing_tile.get('revision'))
      expected_board_revision = compatible_revision(
        data,
        'expectedBoardTileRevision',
        board_tile.get('revision'),
      )
    except BoardConflict:
      return conflict_response()
    if expected_revision != revision_value(existing_tile.get('revision')):
      return conflict_response()
    if expected_board_revision != revision_value(board_tile.get('revision')):
      return conflict_response()

    if cache.get('requirePassword', False) and teampw != team_data.get('password', ''):
      log.warning("updateBoard - wrong team password  board=%s  team=%s  ip=%s", boardName, team_key, request.remote_addr)
      return bad_request('Your team password was incorrect.')

    info = clearBadData(info, generalTileKeys)
    points_error = validate_curr_points(info, board_tile)
    if points_error:
      log.warning("updateBoard - invalid current points  board=%s  team=%s  row=%s  col=%s", boardName, team_key, row, col)
      return bad_request(points_error)

    staged_images = []
    if 'proofImages' in info:
      try:
        info['proofImages'] = normalize_proof_images(info.get('proofImages', []), staged_images)
      except ValueError as exc:
        cleanup_staged_images(proof_images, staged_images)
        log.warning("updateBoard - proof image rejected  board=%s  error=%s", boardName, exc)
        return bad_request(str(exc))
      except Exception as exc:
        cleanup_staged_images(proof_images, staged_images)
        log.error("updateBoard - proof image save failed  board=%s  error=%s", boardName, exc)
        return bad_request('Failed to save proof image.')

    tile_path = tile_revision_path(team_key + '.teamData', row, col)
    update_document = {
      '$set': tile_field_updates(team_key + '.teamData', row, col, info),
      '$inc': {tile_path: 1, 'boardMutationRevision': 1},
    }
    query = board_revision_query(boardName, {
      tile_path: expected_revision,
      'boardSettingsRevision': expected_settings,
      tile_revision_path('boardData', row, col): expected_board_revision,
    }, cache.get('_id'))
    try:
      update = mycol.update_one(query, update_document)
    except Exception as exc:
      log.error("updateBoard - general tile write failed  board=%s  error=%s", boardName, exc)
      return bad_request('Failed to save board tile.')
    if not update_matched(update):
      cleanup_staged_images(proof_images, staged_images)
      return conflict_response()
    # Retired proof files are pruned by the reference-aware upload maintenance
    # job after its race-safety grace period.
    log.info("updateBoard - general tile update  board=%s  team=%s  row=%s  col=%s", boardName, team_key, row, col)
    publish_board_update(boardName)
    return jsonify(
      success=True,
      revision=expected_revision + 1,
      boardTileRevision=expected_board_revision,
      boardSettingsRevision=expected_settings,
    )

  return bad_request('Invalid auth type.')

@app.route('/updateTeams/<boardName>/<password>/<pwtype>', methods=['PUT'])
@limiter.limit("1000 per hour")
def updateTeams(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype, True)
  if err:
    return err

  data = request.get_json(silent=True)
  if not isinstance(data, dict) or not isinstance(data.get('dataToSend'), dict):
    return bad_request('Team settings are required.')
  payload = data['dataToSend']
  try:
    expected_settings = compatible_revision(
      payload,
      'expectedSettingsRevision',
      cache.get('boardSettingsRevision'),
    )
  except BoardConflict:
    return conflict_response()
  if expected_settings != revision_value(cache.get('boardSettingsRevision')):
    return conflict_response()

  try:
    rows = payload['rows']
    cols = payload['columns']
    if isinstance(rows, bool) or isinstance(cols, bool) or int(rows) != rows or int(cols) != cols:
      raise ValueError('Board dimensions must be integers.')
    rows = int(rows)
    cols = int(cols)
    if rows < 1 or cols < 1:
      raise ValueError('Board dimensions must be positive.')
    submitted_teams = payload['teamData']
    if not isinstance(submitted_teams, list) or not submitted_teams:
      raise ValueError('At least one team is required.')
    team_metadata_list = [team_payload_entry(entry) for entry in submitted_teams]
  except (KeyError, TypeError, ValueError) as exc:
    return bad_request(str(exc))

  require_password = bool(payload.get('passwordRequired', False))
  visible_rows = clamp_visible_rows(payload.get('visibleRows'), cols)
  current_rows, current_cols = board_dimensions(cache)
  current_team_count = revision_value(cache.get('teams'))
  dimensions_changed = rows != current_rows or cols != current_cols
  roster_changed = len(team_metadata_list) != current_team_count
  structural_change = dimensions_changed or roster_changed

  if structural_change:
    try:
      update_document = build_structure_update(
        cache,
        rows,
        cols,
        team_metadata_list,
        require_password,
        visible_rows,
      )
      query = board_revision_query(boardName, {
        'boardMutationRevision': revision_value(cache.get('boardMutationRevision')),
        'boardSettingsRevision': expected_settings,
      }, cache.get('_id'))
      update = mycol.update_one(query, update_document)
    except BoardConflict:
      return conflict_response()
    except Exception as exc:
      log.error("updateTeams - structural write failed  board=%s  error=%s", boardName, exc)
      return bad_request('Failed to save board settings.')
    if not update_matched(update):
      return conflict_response()
    log.info("updateTeams - structural update  board=%s  rows=%d  cols=%d  teams=%d", boardName, rows, cols, len(team_metadata_list))
  else:
    set_updates = {
      'requirePassword': require_password,
      'visibleRows': visible_rows,
    }
    for index, metadata in enumerate(team_metadata_list):
      team_key = 'team-' + str(index)
      set_updates[f'{team_key}.name'] = metadata['name']
      set_updates[f'{team_key}.password'] = metadata['password']
    update_document = {
      '$set': set_updates,
      '$inc': {'boardMutationRevision': 1, 'boardSettingsRevision': 1},
    }
    query = board_revision_query(boardName, {
      'boardSettingsRevision': expected_settings,
    }, cache.get('_id'))
    try:
      update = mycol.update_one(query, update_document)
    except Exception as exc:
      log.error("updateTeams - settings write failed  board=%s  error=%s", boardName, exc)
      return bad_request('Failed to save board settings.')
    if not update_matched(update):
      return conflict_response()
    log.info("updateTeams - settings update  board=%s  teams=%d", boardName, len(team_metadata_list))

  publish_board_update(boardName)
  return jsonify(
    success=True,
    boardSettingsRevision=expected_settings + 1,
  )

def build_structure_update(cache, rows, cols, team_metadata_list, require_password, visible_rows):
  """Build one CAS update for a resize or roster mutation."""
  current_team_count = revision_value(cache.get('teams'))
  _current_rows, current_cols = board_dimensions(cache)
  dimensions_changed = rows != _current_rows or cols != current_cols
  set_updates = {
    'rows': rows,
    'columns': cols,
    'teams': len(team_metadata_list),
    'requirePassword': require_password,
    'visibleRows': visible_rows,
  }
  unset_updates = {}

  if dimensions_changed:
    set_updates['boardData'] = resize_grid(cache.get('boardData'), cols, rows, defaultBoardObj)

  for index, metadata in enumerate(team_metadata_list):
    team_key = 'team-' + str(index)
    if index < current_team_count and isinstance(cache.get(team_key), dict):
      existing_team = cache[team_key]
      if dimensions_changed:
        updated_team = copy.deepcopy(existing_team)
        updated_team['name'] = metadata['name']
        updated_team['password'] = metadata['password']
        updated_team['teamData'] = resize_grid(existing_team.get('teamData'), cols, rows, defaultTeamObj)
        set_updates[team_key] = updated_team
      else:
        set_updates[f'{team_key}.name'] = metadata['name']
        set_updates[f'{team_key}.password'] = metadata['password']
    else:
      set_updates[team_key] = {
        'name': metadata['name'],
        'password': metadata['password'],
        'teamData': initEmptyTeamData(cols, rows),
      }

  for index in range(len(team_metadata_list), current_team_count):
    unset_updates['team-' + str(index)] = ''

  update_document = {
    '$set': set_updates,
    '$inc': {'boardMutationRevision': 1, 'boardSettingsRevision': 1},
  }
  if unset_updates:
    update_document['$unset'] = unset_updates
  return update_document


@app.route('/feedback', methods=['POST'])
@limiter.limit("10 per hour")
def postFeedbackToDiscord():
  data = json.loads(request.data.decode(), parse_float=float)
  message = data.get('message')
  board_name = data.get('boardName')
  if isinstance(board_name, str) and board_name.strip():
    message = f"Board: {board_name.strip()}\n\n{message}"

  result = postToDiscord(message, 'FEEDBACK_WEBHOOK')
  if not result:
    log.error("postFeedbackToDiscord - failed to post  ip=%s", request.remote_addr)
    return bad_request('Failed to post message to Discord.')

  log.info("postFeedbackToDiscord - success  ip=%s", request.remote_addr)
  return jsonify(success=True)


@app.route('/auth/<boardName>/<password>/<pwtype>', methods=['GET'])
@limiter.limit("1000 per hour")
def authMethod(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err
  log.info("auth - success  board=%s  pwtype=%s", boardName, pwtype)
  return jsonify(success=True)


if __name__ == "__main__":
  log.info("Starting Flask server on 0.0.0.0:8000")
  app.run(host='0.0.0.0', port=8000, debug=True)

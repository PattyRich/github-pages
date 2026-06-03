from gevent import monkey
monkey.patch_all()

from flask import Flask, jsonify, request, has_request_context, Response, stream_with_context
from flask_cors import CORS
import json, datetime
import time, requests
import pymongo
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from imgSizeReducer import reduce_image_size
from imageManager import proof_images, board_images
from werkzeug.middleware.proxy_fix import ProxyFix
import os
from dotenv import load_dotenv
load_dotenv()

from logger import get_logger
from lol_server import lol_api
from rq import Worker

log = get_logger(__name__)

_START_TIME = time.time()

app = Flask(__name__, static_folder='build')
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
_redis = redis_lib.from_url(redis_url, decode_responses=True)

mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
myclient = pymongo.MongoClient(mongo_uri)
db = myclient["bingo"]
mycol = db['bingo']

allowedAuthTypes = ['admin', 'general']
adminTileKeys = ['description', 'image', 'points', 'title', 'rowBingo', 'colBingo']
generalTileKeys = ['proof', 'checked', 'currPoints', 'proofImages']
boardCreationKeys = ['adminPassword', 'generalPassword', 'boardName', 'boardData', 'teams', 'rows', 'columns', 'visibleRows']
testBoardPrefix = os.environ.get("PLAYWRIGHT_E2E_BOARD_PREFIX", os.environ.get("SELENIUM_E2E_BOARD_PREFIX", "__playwright_e2e__"))
defaultTeamObj = {
  'checked': False,
  'proof': '',
  'proofImages': [],
  'currPoints': 0
}
defaultBoardObj = {
  'points': 0,
  'title': '',
  'description': '',
  'image': None,
  'rowBingo': 0,
  'colBingo': 0
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

@app.before_request
def log_request():
    origin = request.headers.get('Origin', request.host)
    log.info("--> %s %s  ip=%s  origin=%s", request.method, request.path, request.remote_addr, origin)

@app.after_request
def log_response(response):
    log.info("<-- %s %s  status=%d", request.method, request.path, response.status_code)
    return response

@app.errorhandler(429)
def rate_limit_handler(e):
    log.warning("Rate limit exceeded  ip=%s  path=%s", request.remote_addr, request.path)
    return jsonify(error="Rate limit exceeded", message=str(e.description)), 429


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

def board_visual_rows(cache):
  if cache.get('columns'):
    return int(cache['columns'])
  board_data = cache.get('boardData', [])
  return len(board_data) if board_data else 1

def board_visible_rows(cache):
  return clamp_visible_rows(cache.get('visibleRows'), board_visual_rows(cache))

def slice_board_rows(board_data, visible_rows):
  return board_data[:visible_rows]

def is_test_board(board_name):
  return isinstance(board_name, str) and board_name.startswith(testBoardPrefix)

def is_test_board_request():
  try:
    data = request.get_json(silent=True) or {}
  except Exception:
    return False
  return is_test_board(data.get('boardName'))

def postToDiscord(message, webhook_env_var):
  webhook_url = os.getenv(webhook_env_var)
  payload = {
    "content": message
  }
  try:
    requests.post(webhook_url, json=payload)
    return True
  except Exception as e:
    log.error("Failed to post to Discord  webhook=%s  error=%s", webhook_env_var, e)
    return False

def publish_board_update(board_name):
  try:
    _redis.publish(f"board:{board_name}", "refresh")
  except Exception as e:
    log.warning("publish_board_update failed  board=%s  error=%s", board_name, e)

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
  except Exception as e:
    log.error("health - mongo check failed: %s", e)
    result['mongo'] = {'status': 'error', 'error': str(e)}
    all_ok = False

  # --- Redis ---
  try:
    t0 = time.time()
    _redis.ping()
    redis_ms = round((time.time() - t0) * 1000)
    result['redis'] = {'status': 'ok', 'latency_ms': redis_ms}
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
  cache = mycol.find_one({'boardName': data['boardName']})
  if (cache):
    log.warning("createBoard - name already taken  board=%s  ip=%s", data['boardName'], request.remote_addr)
    return bad_request('Board Name Already Taken!!')

  data = clearBadData(data, boardCreationKeys)
  data['visibleRows'] = clamp_visible_rows(data.get('visibleRows'), int(data['columns']))

  boardData = []
  for i in range(data['columns']):
    boardData.append([])
    for j in range(data['rows']):
      boardData[i].append(defaultBoardObj.copy())
      if i == 0 and j == 0:
        boardData[i][0]['title'] = 'Example Tile'
        boardData[i][0]['image'] = {'url': 'https://oldschool.runescape.wiki/images/thumb/Twisted_bow_detail.png/180px-Twisted_bow_detail.png', 'opacity': 100}
  
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
  insert = mycol.insert_one(data)
  if (not insert):
    log.error("createBoard - MongoDB insert failed  board=%s", data['boardName'])
    return bad_request('Failed to create bingo board in Mongo.')

  log.info("createBoard - success  board=%s  teams=%d  ip=%s", data['boardName'], data['teams'], request.remote_addr)

  if not is_test_board(data["boardName"]):
    board_url = 'https://pattyrich.github.io/github-pages/#/bingo/{}?password={}'.format(data["boardName"].replace(' ', '%20'), data.get('generalPassword', ''))
    discord_message = 'New bingo board created: **[{}]({})**'.format(data["boardName"], board_url)
    postToDiscord(discord_message, 'CREATION_WEBHOOK')
  else:
    log.info("createBoard - creation webhook skipped for test board  board=%s", data['boardName'])

  return jsonify(success=True)

@app.route('/getBoard/<boardName>/<password>/<pwtype>', methods=['GET'])
@limiter.limit("5000 per hour")
def getBoard(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err

  boardData = cache['boardData']
  visibleRows = board_visible_rows(cache)
  for row in boardData:
    for tile in row:
      tile['image'] = public_board_image(tile.get('image'))
  if pwtype == 'general':
    boardData = slice_board_rows(boardData, visibleRows)
  teamData = []
  generalPassword = cache['generalPassword']
  passwordRequired = cache.get('requirePassword', False)

  for i in range(cache['teams']):
    team = 'team-' + str(i)
    if (pwtype != 'admin' and 'password' in cache[team]):
      del cache[team]['password']

    for row in cache[team]['teamData']:
      for tile in row:
        if 'proofImages' in tile:
          tile['proofImages'] = [proof_images.public_url(image) for image in tile['proofImages']]
          
    teamData.append({
      'team': i,
      'data': cache[team]
    })

  log.info("getBoard - success  board=%s  pwtype=%s", boardName, pwtype)
  return jsonify(boardData=boardData, teamData=teamData, generalPassword=generalPassword, teamPasswordsRequired=passwordRequired, visibleRows=visibleRows)

@app.route('/events/<boardName>/<password>/<pwtype>')
@limiter.limit("2000 per hour")
def board_events(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err

  def event_stream():
    pubsub = _redis.pubsub()
    pubsub.subscribe(f"board:{boardName}")
    log.info("SSE open  board=%s  pwtype=%s  ip=%s", boardName, pwtype, request.remote_addr)
    try:
      last_heartbeat = time.time()
      while True:
        message = pubsub.get_message(timeout=25)
        if message and message['type'] == 'message':
          yield "data: refresh\n\n"
        now = time.time()
        if now - last_heartbeat > 25:
          yield ": heartbeat\n\n"
          last_heartbeat = now
    finally:
      pubsub.unsubscribe()
      pubsub.close()
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
def updateBoard(boardName, password, pwtype, teampw):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err
  data = json.loads(request.data.decode(), parse_float=float)
  if (pwtype == 'admin'):
    data['info'] = clearBadData(data['info'], adminTileKeys)

    boardData = cache['boardData']
    boardData[data['row']][data['col']] = { **boardData[data['row']][data['col']], **data['info']}

    image = data.get('info', {}).get('image') if isinstance(data.get('info'), dict) else None
    image_url = image.get('url', '') if isinstance(image, dict) else ''
    if image and isinstance(image_url, str) and image_url[0:5] == 'data:':
      try:
        saved_url = board_images.save(image_url)
        previous_image_url = cache['boardData'][data['row']][data['col']].get('image', {}) or {}
        previous_image_url = previous_image_url.get('url', '') if isinstance(previous_image_url, dict) else ''
        boardData[data['row']][data['col']]['image']['url'] = saved_url
        board_images.delete(previous_image_url)
      except Exception as e:
        log.error("updateBoard - board image save failed  board=%s  error=%s", boardName, e)
        pass

    newvalue = { "$set": {'boardData': boardData}}
    mycol.update_one({"boardName": boardName}, newvalue)
    log.info("updateBoard - admin tile update  board=%s  row=%s  col=%s", boardName, data.get('row'), data.get('col'))

  if (pwtype == 'general'):
    if int(data['row']) >= board_visible_rows(cache):
      log.warning("updateBoard - hidden row update rejected  board=%s  row=%s  ip=%s", boardName, data.get('row'), request.remote_addr)
      return bad_request('That row has not been revealed yet.')

    teamKey = 'team-' + str(data['info']['teamId'])
    data['info'] = clearBadData(data['info'], generalTileKeys)

    if cache.get('requirePassword', False): 
      if (teampw != cache[teamKey]['password']):
        log.warning("updateBoard - wrong team password  board=%s  team=%s  ip=%s", boardName, teamKey, request.remote_addr)
        return bad_request('Your team password was incorrect.')
    
    teamData = cache[teamKey]
    existing_tile = teamData['teamData'][data['row']][data['col']]
    previous_proof_images = existing_tile.get('proofImages', [])

    # Save newly uploaded proof images to disk and keep MongoDB lightweight.
    incoming_proof_images = data['info'].get('proofImages', [])
    if incoming_proof_images:
      saved_images = []
      for img_uri in incoming_proof_images:
        if isinstance(img_uri, str) and img_uri.startswith('data:'):
          try:
            saved_images.append(proof_images.save(img_uri))
          except Exception as e:
            log.error("updateBoard - proof image save failed  board=%s  error=%s", boardName, e)
            saved_images.append(img_uri)
        else:
          saved_images.append(proof_images.storage_url(img_uri))
      data['info']['proofImages'] = saved_images

    teamData['teamData'][data['row']][data['col']] = { **teamData['teamData'][data['row']][data['col']], **data['info']}
    
    newvalue = { "$set": {teamKey: teamData}}
    update = mycol.update_one({"boardName": boardName}, newvalue)
    if 'proofImages' in data['info']:
      proof_images.cleanup_removed(previous_proof_images, data['info']['proofImages'])
    log.info("updateBoard - general tile update  board=%s  team=%s  row=%s  col=%s", boardName, teamKey, data.get('row'), data.get('col'))

  publish_board_update(boardName)
  return jsonify(success=True)

@app.route('/updateTeams/<boardName>/<password>/<pwtype>', methods=['PUT'])
@limiter.limit("1000 per hour")
def updateTeams(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype, True)
  if err:
    return err

  data = json.loads(request.data.decode(), parse_float=float)
  requirePassword = data['dataToSend']['passwordRequired']
  rows = int(data['dataToSend']['rows'])
  cols = int(data['dataToSend']['columns'])
  visibleRows = clamp_visible_rows(data['dataToSend'].get('visibleRows'), cols)
  data = data['dataToSend']['teamData']
  size = len(data)

  changed = changeBoardSize(data, rows, cols, cache, boardName)
  if changed:
    log.info("updateTeams - board resized  board=%s  rows=%d  cols=%d", boardName, rows, cols)
    cache = auth(boardName, password, pwtype)[0]

  updateOlderTeams = data[:cache['teams']]
  ## adding a team // init an empty one here and we overwrite it with relevant data at end
  if (size) > cache['teams']:
    added = size - cache['teams']
    log.info("updateTeams - adding %d team(s)  board=%s", added, boardName)
    for i in range(added):
      teamKey = 'team-' + str(cache['teams'] + i)
      teamData = initEmptyTeamData(cols, rows)
      teamData = {
        'name': data[cache['teams'] + i]['data']['name'],
        'teamData': teamData
      }
      newvalue = { "$set": {teamKey: teamData}}
      update = mycol.update_one({"boardName": boardName}, newvalue)
  ## removing a team
  elif size < cache['teams']:
    removed = cache['teams'] - size
    log.info("updateTeams - removing %d team(s)  board=%s", removed, boardName)
    for i in range(removed):
      teamKey = 'team-' + str(cache['teams'] -1 -i)
      newvalue = { "$unset": {teamKey: ''}}
      update = mycol.update_one({"boardName": boardName}, newvalue)

  ## is where we apply actual changes made other than adds + deletes
  overWrite = {}
  for i in range(len(updateOlderTeams)):
    teamKey = 'team-' + str(i)
    password = ''
    if 'password' in updateOlderTeams[i]['data']:
      password = updateOlderTeams[i]['data']['password']

    # some nasty logic here. We need cache for teamData, its not actually going to be changing
    # from this call but we need it for the mongo obj, name and password could actually change though
    # teamData might change due to board size changes, but not in the same way as direct changes from users for pw / name
    overWrite[teamKey] = {
      'name': updateOlderTeams[i]['data']['name'],
      'teamData': cache[teamKey]['teamData'],
      'password': password
    }
    ## spread object for all sets since it won't take a dict
    newvalue = { "$set": { **overWrite, 'teams': size }}
    update = mycol.update_one({"boardName": boardName}, newvalue)
    
    ## a passwords requirement for teams to submit proof has been set (backwards compatible)
    if ('requirePassword' in cache and requirePassword != cache['requirePassword']):
      newvalue = { "$set": {'requirePassword': requirePassword}}
      update = mycol.update_one({"boardName": boardName}, newvalue)
    elif ('requirePassword' not in cache):
      newvalue = { "$set": {'requirePassword': requirePassword}}
      update = mycol.update_one({"boardName": boardName}, newvalue)

  mycol.update_one({"boardName": boardName}, { "$set": {'requirePassword': requirePassword, 'visibleRows': visibleRows}})

  log.info("updateTeams - complete  board=%s  teams=%d", boardName, size)
  publish_board_update(boardName)
  return jsonify(success=True)

def changeBoardSize(teamData, rows, cols, cache, boardName):
  currCols = len(cache['boardData'])
  currRows = len(cache['boardData'][0])
  if(currCols != cols or currRows != rows):

    lessRows = False
    moreRows = False
    lessCols = False
    moreCols = False
    overWrite = {}
    
    if rows < currRows:
      lessRows = True
    elif rows > currRows:
      moreRows = True
    
    if cols < currCols:
      lessCols = True 
    elif cols > currCols:
      moreCols = True

    # team changes
    for i in range(cache['teams']):
      teamKey = 'team-' + str(i)
      teamData = cache[teamKey]['teamData']

      overWrite[teamKey] = {
        'name': cache[teamKey]['name'],
        'password': cache[teamKey].get('password', '')
      }

      if lessRows:
        for j in range(len(teamData)):
          teamData[j] = teamData[j][:rows]
      elif moreRows:
        for j in range(len(teamData)):
          for k in range(rows - currRows):
            teamData[j].append(defaultTeamObj.copy())

      if lessCols:
        teamData = teamData[:cols]
      elif moreCols:
        for j in range(cols - currCols):
          teamData.append([])
          for k in range(rows):
            teamData[len(teamData) -1].append(defaultTeamObj.copy())
      
      overWrite[teamKey]['teamData'] = teamData

    overWrite['rows'] = rows
    overWrite['columns'] = cols 

    # board data changes
    if lessRows:
      boardData = cache['boardData']
      for i in range(len(boardData)):
        boardData[i] = boardData[i][:rows]
      overWrite['boardData'] = boardData
    elif moreRows:
      boardData = cache['boardData']
      for i in range(len(boardData)):
        for j in range(rows - currRows):
          boardData[i].append(defaultBoardObj.copy())
      overWrite['boardData'] = boardData
      
    if lessCols:
      boardData = cache['boardData'][:cols]
      overWrite['boardData'] = boardData
    elif moreCols:
      boardData = cache['boardData']
      for i in range(cols - currCols):
        boardData.append([])
        for j in range(rows):
          boardData[len(boardData) -1].append(defaultBoardObj.copy())
      overWrite['boardData'] = boardData
    
    newvalue = { "$set": { **overWrite }}
    update = mycol.update_one({"boardName": boardName}, newvalue)

    return True
  else:
    return False

@app.route('/feedback', methods=['POST'])
@limiter.limit("10 per hour")
def postFeedbackToDiscord():
  data = json.loads(request.data.decode(), parse_float=float)
  message = data.get('message')

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

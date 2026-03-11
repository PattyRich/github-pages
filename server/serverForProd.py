from flask import Flask, jsonify, Response, request, abort
from flask_cors import CORS, cross_origin
import json, datetime
import time, requests
import pymongo
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from server import app

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["10000 per hour"]
)

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
db = myclient["bingo"]
mycol = db['bingo']

adminTileKeys = ['description', 'image', 'points', 'title', 'rowBingo', 'colBingo']
generalTileKeys = ['proof', 'checked', 'currPoints']
boardCreationKeys = ['adminPassword', 'generalPassword', 'boardName', 'boardData', 'teams', 'rows', 'columns']
defaultTeamObj = {
  'checked': False,
  'proof': '',
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
indexes = mycol.index_information()

if(len(indexes) != 1):
  mycol.create_index([("boardName", 1)])
  ## ttl of 1.1 years
  mycol.create_index([("date", 1)], expireAfterSeconds=34712647)

def initEmptyTeamData(row, col):
  teamData = []
  for i in range(row):
    teamData.append([])
    for j in range(col):
      teamData[i].append(defaultTeamObj.copy())
  return teamData


def bad_request(message):
  response = jsonify({'message': message})
  response.status_code = 400
  return response

def auth(boardName, password, pwtype, mustBeAdmin = False):
  if (pwtype == 'admin'):
    pwtype = 'adminPassword'
  if (mustBeAdmin):
    if (pwtype != 'adminPassword'):
      return [None, bad_request('Must be an admin to make this call.')]  
  if (pwtype == 'general'):
    pwtype = 'generalPassword'
  cache = mycol.find_one({'boardName': boardName})
  if (not cache):
    return [None, bad_request('Board with that name does not exist.')]
  ##admins can do general and admin actions, so we accept a match on either
  if (pwtype == 'generalPassword'):
    if (password != cache['adminPassword'] and password != cache['generalPassword']):
      return [None, bad_request('Your password was incorrect.')]
  else:
    if (password != cache[pwtype]):
      return [None, bad_request('Your password was incorrect.')]
  return [cache, None]

def clearBadData(data, acceptableKeys):
  for key in list(data):
    if key not in acceptableKeys:
      data.pop(key, None)
  return data

@app.route('/createBoard', methods=['POST'])
@limiter.limit("5 per hour")
def createBoard():
  data = json.loads(request.data.decode(), parse_float=float)
  cache = mycol.find_one({'boardName': data['boardName']})
  if (cache):
    return bad_request('Board Name Already Taken!!')

  data = clearBadData(data, boardCreationKeys)

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
    return bad_request('Failed to create bingo board in Mongo.')

  return jsonify(success=True)

@app.route('/getBoard/<boardName>/<password>/<pwtype>', methods=['GET'])
@limiter.limit("1000 per hour")
def getBoard(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err

  boardData = cache['boardData']
  teamData = []
  generalPassword = cache['generalPassword']
  passwordRequired = cache.get('requirePassword', False)

  for i in range(cache['teams']):
    team = 'team-' + str(i)
    if (pwtype != 'admin' and 'password' in cache[team]):
      del cache[team]['password']
    teamData.append({
      'team': i,
      'data': cache[team]
    })

  return jsonify(boardData=boardData, teamData=teamData, generalPassword=generalPassword, teamPasswordsRequired=passwordRequired)

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

    newvalue = { "$set": {'boardData': boardData}}
    mycol.update_one({"boardName": boardName}, newvalue)

  if (pwtype == 'general'):
    teamKey = 'team-' + str(data['info']['teamId'])
    data['info'] = clearBadData(data['info'], generalTileKeys)

    if cache.get('requirePassword', False): 
      if (teampw != cache[teamKey]['password']):
        return bad_request('Your team password was incorrect.')
    
    teamData = cache[teamKey]
    teamData['teamData'][data['row']][data['col']] = { **teamData['teamData'][data['row']][data['col']], **data['info']}
    
    newvalue = { "$set": {teamKey: teamData}}
    update = mycol.update_one({"boardName": boardName}, newvalue)

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
  data = data['dataToSend']['teamData']
  size = len(data)

  changed = changeBoardSize(data, rows, cols, cache, boardName)
  if changed:
    cache = auth(boardName, password, pwtype)[0]

  updateOlderTeams = data[:cache['teams']]
  ## adding a team // init an empty one here and we overwrite it with relevant data at end
  if (size) > cache['teams']:
    for i in range(size - cache['teams']):
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
    for i in range(cache['teams'] - size):
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
def postToDiscord():
  data = json.loads(request.data.decode(), parse_float=float)
  message = data.get('message')

  webhook_url = "Webhook URL here"
  payload = {
    "content": message
  }

  response = requests.post(webhook_url, json=payload)
  if response.status_code != 204:
    return bad_request('Failed to post message to Discord.')

  return jsonify(success=True)
  

@app.route('/auth/<boardName>/<password>/<pwtype>', methods=['GET'])
@limiter.limit("200 per hour")
def authMethod(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err
  return jsonify(success=True)

from flask import Flask, jsonify, Response, request, abort
from flask_cors import CORS, cross_origin
import json, datetime
import time, requests
import pymongo
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__, static_folder='build')
CORS(app)

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
boardCreationKeys = ['adminPassword', 'generalPassword', 'boardName', 'boardData', 'teams']

indexes = mycol.index_information()

if(len(indexes) != 1):
  mycol.create_index([("boardName", 1)])
  ## ttl of 2 months
  mycol.create_index([("date", 1)], expireAfterSeconds=5260000)

def initEmptyTeamData(row, col):
  teamData = []
  for i in range(row):
    teamData.append([])
    for j in range(col):
      teamObj = {
        'checked': False,
        'proof': '',
        'currPoints': 0
      }
      teamData[i].append(teamObj)
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
  data = json.loads(request.data)
  cache = mycol.find_one({'boardName': data['boardName']})
  if (cache):
    return bad_request('Board Name Already Taken!!')

  data = clearBadData(data, boardCreationKeys)

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

  for i in range(cache['teams']):
    team = 'team-' + str(i)
    teamData.append({
      'team': i,
      'data': cache[team]
    })

  return jsonify(boardData=boardData, teamData=teamData, generalPassword=generalPassword)

@app.route('/updateBoard/<boardName>/<password>/<pwtype>', methods=['PUT'])
def updateBoard(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err
  data = json.loads(request.data)
  if (pwtype == 'admin'):
    data['info'] = clearBadData(data['info'], adminTileKeys)

    boardData = cache['boardData']
    boardData[data['row']][data['col']] = { **boardData[data['row']][data['col']], **data['info']}

    newvalue = { "$set": {'boardData': boardData}}
    mycol.update_one({"boardName": boardName}, newvalue)

  if (pwtype == 'general'):
    teamKey = 'team-' + str(data['info']['teamId'])
    data['info'] = clearBadData(data['info'], generalTileKeys)
    
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

  data = json.loads(request.data)
  data = data['info']
  size = len(data)

  updateOlderTeams = data[:cache['teams']]
  ## adding a team // init an empty one here and we overwrite it with relevant data at end
  if (size) > cache['teams']:
    for i in range(size - cache['teams']):
      teamKey = 'team-' + str(cache['teams'] + i)
      teamData = initEmptyTeamData(len(cache['boardData']), len(cache['boardData'][0]))
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
    overWrite[teamKey] = {
      'name': updateOlderTeams[i]['data']['name'],
      'teamData': updateOlderTeams[i]['data']['teamData']
    }
    ##spread object for all sets since it won't take a dict
    newvalue = { "$set": { **overWrite, 'teams': size }}
    update = mycol.update_one({"boardName": boardName}, newvalue)

  return jsonify(success=True)
  

@app.route('/auth/<boardName>/<password>/<pwtype>', methods=['GET'])
@limiter.limit("200 per hour")
def authMethod(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err
  return jsonify(success=True)

if __name__ == "__main__":
  app.run(host='0.0.0.0',port=5001, debug=True)

from flask import Flask, jsonify, Response, send_from_directory, request, abort
from flask_cors import CORS, cross_origin
import requests, sys, json, os, threading, datetime
import time
import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
db = myclient["bingo"]
mycol = db['bingo']

adminTileKeys = ['description', 'image', 'points', 'title']
boardCreationKeys = ['adminPassword', 'generalPassword', 'boardName', 'boardData', 'teams']


def bad_request(message):
  response = jsonify({'message': message})
  response.status_code = 400
  return response

def auth(boardName, password, pwtype):
  if (pwtype == 'admin'):
    pwtype = 'adminPassword'
  if (pwtype == 'general'):
    pwtype = 'generalPassword'
  cache = mycol.find_one({'boardName': boardName})
  if (not cache):
    return [None, bad_request('Board with that name does not exist.')]
  if (password != cache[pwtype]):
    return [None, bad_request('Your password was incorrect.')]
  return [cache, None]

def clearBadData(data, acceptableKeys):
  for key in list(data):
    if key not in acceptableKeys:
      data.pop(key, None)
  return data


app = Flask(__name__, static_folder='build')
CORS(app)

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
  if path != "" and os.path.exists("build/" + path):
    return send_from_directory('build', path)
  else:
    return send_from_directory('build', 'index.html')

@app.route('/Hello', methods=['GET'])
def Hello():
    return 'Hello'

@app.route('/test', methods=['GET'])
def test():
  mycol.drop()
  return 'dropped'
  # mycol = db['test']
  # x = mycol.find_one({"test": True})
  # print(x)
  # return jsonify(x)

@app.route('/createBoard', methods=['POST'])
def createBoard():
  data = json.loads(request.data)
  cache = mycol.find_one({'boardName': data['boardName']})
  if (cache):
    return bad_request('Board Name Already Taken!!')

  data = clearBadData(data, boardCreationKeys)

  for i in range(data['teams']):
    team = 'team-' + str(i)
    teamData = []
    for i in range(len(data['boardData'])):
      teamData.append([])
      for j in range(len(data['boardData'][i])):
        teamObj = {
          'checked': False,
          'proof': []
        }
        teamData[i].append(teamObj)
    data[team] = teamData

  insert = mycol.insert_one(data)
  if (not insert):
    return bad_request('Failed to create bingo board in Mongo.')

  return jsonify(success=True)

@app.route('/getBoard/<boardName>/<password>/<pwtype>', methods=['GET'])
def getBoard(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err

  boardData = cache['boardData']
  teamData = []

  for i in range(cache['teams']):
    team = 'team-' + str(i)
    teamData.append({
      'team': i,
      'data': cache[team]
    })

  return jsonify(boardData=boardData, teamData=teamData)

@app.route('/updateBoard/<boardName>/<password>/<pwtype>', methods=['PUT'])
def updateBoard(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err
  data = json.loads(request.data)
  if (pwtype == 'admin'):
    data['info'] = clearBadData(data['info'], adminTileKeys)
    print(data)
    boardData = cache['boardData']
    boardData[data['row']][data['col']] = { **boardData[data['row']][data['col']], **data['info']}

    newvalue = { "$set": {'boardData': boardData}}
    mycol.update_one({"boardName": boardName}, newvalue)

  return jsonify(success=True)

@app.route('/auth/<boardName>/<password>/<pwtype>', methods=['GET'])
def authMethod(boardName, password, pwtype):
  cache, err = auth(boardName, password, pwtype)
  if err:
    return err
  return jsonify(success=True)

# @app.route('/lol/api/v1.0/sumInfo/<leagueName>/<region>', methods=['GET'])
# def getSummonerInfo(leagueName,region, rankGather=False):


if __name__ == "__main__":
  app.run(host='0.0.0.0',port=5001, debug=True)

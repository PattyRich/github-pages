from osrsbox import items_api
import sys
import base64
import json

with open('itemsToGet.json', 'r') as f:
  data = json.load(f)
  for i in range(len(data)): 
    items = items_api.load()
    for item in items:
      if (item.name == data[i] and item.noted == False):
        with open('public/assets/' + item.name + '.png', 'wb') as f:
          print('Getting image : ' + data[i], flush=True)
          f.write(base64.b64decode(item.icon))
          break
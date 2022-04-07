#from osrsbox import items_api
import sys
import base64
import json
import requests
import urllib.parse


with open('itemsToGet.json', 'r') as f:
  data = json.load(f)
  for i in range(len(data)): 
    urlName = data[i].replace(" ", "_")
    url = 'https://oldschool.runescape.wiki/images/' + urllib.parse.quote(urlName) + '.png'
    response = requests.get(url)
    with open('public/assets/' + data[i] + '.png', 'wb') as f:
      f.write(response.content)


    # items = items_api.load()
    # for item in items:
    #   if (item.name == data[i] and item.noted == False):
    #     with open('public/assets/' + item.name + '.png', 'wb') as f:
    #       print('Getting image : ' + data[i], flush=True)
    #       f.write(base64.b64decode(item.icon))
    #       break
    # print(data[i] + ' was not found')
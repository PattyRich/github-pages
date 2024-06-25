#from osrsbox import items_api
import sys
import base64
import json
import requests
import urllib.parse
import string
import os

def tryToGetPet(name, urlBase):
  name = name.replace(" ", "_")
  name = urllib.parse.quote(name)
  url = urlBase + name + '.png'
  response = requests.get(url)
  print(response.status_code, url)
  if (response.status_code == 200):
    with open('public/assets/pets_pixel/' + data[i] + '.png', 'wb') as f:
      f.write(response.content)
      return True
  return False


with open('itemsToGet.json', 'r') as f:
  data = json.load(f)
  for i in range(len(data)): 
    if (os.path.isfile('public/assets/pets_pixel/' + data[i] + '.png')):
      continue
    
    tryToGetPet(data[i], 'https://oldschool.runescape.wiki/images/')
    print(data[i])

# def tryToGetPet(name, urlBase):
#   name = name.replace(" ", "_")
#   name = urllib.parse.quote(name)
#   url = urlBase + name + '.png/560px-' + name + '.png'
#   response = requests.get(url)
#   print(response.status_code, url)
#   if (response.status_code == 200):
#     with open('public/assets/detailed_pets/' + data[i] + '.png', 'wb') as f:
#       f.write(response.content)
#       return True
#   return False


# with open('itemsToGet.json', 'r') as f:
#   data = json.load(f)
#   for i in range(len(data)): 
#     if (os.path.isfile('public/assets/detailed_pets/' + data[i] + '.png')):
#       continue

#     print(data[i])

    # if (tryToGetPet(data[i], 'https://oldschool.runescape.wiki/images/thumb/')):
    #   continue
    # if (tryToGetPet(string.capwords(data[i]), 'https://oldschool.runescape.wiki/images/thumb/')):
    #   continue
    # if (tryToGetPet(data[i]+'_(follower)', 'https://oldschool.runescape.wiki/images/thumb/')):
    #   continue
    # if (tryToGetPet(string.capwords(data[i])+'_(follower)', 'https://oldschool.runescape.wiki/images/thumb/')):
    #   continue

    


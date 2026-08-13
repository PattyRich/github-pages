#from osrsbox import items_api
import sys
import base64
import json
import requests
import urllib.parse
import string
import os

## Pet image collector. Just put their names in itemsToGet.json
# Ex:
# [
#  "Aggy",
#  "Mr McGroot"
# ]

def tryToGetPet(url, petName, detailed = False):
  assetDestination = '../apps/frontend/src/assets/pets_pixel/' if not detailed else '../apps/frontend/src/assets/detailed_pets/'
  if (os.path.isfile(assetDestination + petName + '.png')):
    print('Already have' + petName)
    return True
  response = requests.get(url)
  print(response.status_code, url)
  if (response.status_code != 200 and len(petName.split()) >= 2):
    url = url.replace(" ", "_")
    url = url.replace("%20", "%5F")
    response = requests.get(url)
    print(response.status_code, url)
  if (response.status_code == 200):
    with open(assetDestination + data[i] + '.png', 'wb') as f:
      f.write(response.content)
      return True
  return False


with open('itemsToGet.json', 'r') as f:
  data = json.load(f)
  for i in range(len(data)): 
    encodedPet = urllib.parse.quote(data[i])
    detailedURL = 'https://oldschool.runescape.wiki/images/thumb/' + encodedPet + '_(follower).png'
    detailedURL += '/300px-' + encodedPet + '_(follower).png'
    tryToGetPet('https://oldschool.runescape.wiki/images/' + encodedPet + '.png', data[i])
    tryToGetPet(detailedURL, data[i], True)

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

    


# Python 3 server example
from http.server import BaseHTTPRequestHandler, HTTPServer
import time

from osrsbox import items_api
import sys
import base64
import urllib.parse
import json


hostName = "localhost"
serverPort = 8080

class MyServer(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        print(self.path, flush=True)

        path = urllib.parse.unquote(self.path[1:])
        with open('itemsToGet.json', 'r') as f:
          data = json.load(f)
          if path not in data:
            data.append(path)

        with open('itemsToGet.json', 'w') as f:
          f.write(json.dumps(data))





if __name__ == "__main__":        
    webServer = HTTPServer((hostName, serverPort), MyServer)
    print("Server started http://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")

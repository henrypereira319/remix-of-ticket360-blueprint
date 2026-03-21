import sys
import urllib.request

url = sys.argv[1]

with urllib.request.urlopen(url, timeout=5) as response:
    print(response.status)

import urllib.request
import json

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/cities") as response:
        print(f"Status Code: {response.getcode()}")
        data = response.read()
        cities = json.loads(data)
        print(f"Cities found: {len(cities)}")
        print(json.dumps(cities[:3], indent=2))
except Exception as e:
    print(f"Connection failed: {e}")

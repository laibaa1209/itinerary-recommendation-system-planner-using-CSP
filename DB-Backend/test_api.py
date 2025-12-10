import requests
import json

try:
    response = requests.get("http://127.0.0.1:8000/cities")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        cities = response.json()
        print(f"Cities found: {len(cities)}")
        print(json.dumps(cities[:3], indent=2))
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Connection failed: {e}")

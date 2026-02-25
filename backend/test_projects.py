import requests
from pprint import pprint

BASE_URL = "http://127.0.0.1:8080"  # change if needed

# 🔹 Step 1: Login
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "username": "admin",
        "password": "notadmin"
    }
)

if login_response.status_code != 200:
    print("Login failed:", login_response.text)
    exit()

token = login_response.json().get("access_token")
print("Login successful")

def get_projects():
  projects_response = requests.get(
      f"{BASE_URL}/projects",
      headers={
          "Authorization": f"Bearer {token}"
      }
  )

  print("Projects response status:", projects_response.status_code)
  print("Projects data:")
  pprint(projects_response.json())

def get_reports(project_key, release_id):
  reports_response = requests.post(
      f"{BASE_URL}/projects/{project_key}/releases/{release_id}/pytest",
      headers={
          "Authorization": f"Bearer {token}"
      }
  )

  print("Reports response status:", reports_response.status_code)
  print("Reports data:")
  pprint(reports_response.json())

get_projects()
# get_reports("RD", "4980ca76-c1cc-44b2-b6df-24c0adfdc91f")

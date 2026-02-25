import requests

BASE_URL = "http://localhost:8080"  # change if needed

LOGIN_URL = f"{BASE_URL}/auth/login"
ADD_USER_URL = f"{BASE_URL}/admin/projects/users"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "notadmin"

PROJECT_KEY = "RD"
USERNAME_TO_ADD = "admin"


def login():
    payload = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }

    response = requests.post(LOGIN_URL, json=payload)

    if response.status_code != 200:
        raise Exception(f"Login failed: {response.text}")

    data = response.json()

    # Adjust this depending on your login response structure
    # Common patterns:
    # token = data["access_token"]
    # OR
    # token = data["token"]

    token = data.get("access_token") or data.get("token")

    if not token:
        raise Exception("Token not found in login response")

    print("Login successful.")
    return token


def add_user_to_project(token):
    headers = {
        "Authorization": f"Bearer {token}"
    }

    payload = {
        "project_key": PROJECT_KEY,
        "username": USERNAME_TO_ADD
    }

    response = requests.post(ADD_USER_URL, json=payload, headers=headers)

    if response.status_code != 200:
        raise Exception(f"Failed to add user: {response.text}")

    print("User added successfully:")
    print(response.json())


if __name__ == "__main__":
    token = login()
    add_user_to_project(token)
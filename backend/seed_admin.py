from db.session import SessionLocal
from db.models.user import User

from auth.passwords import hash_password

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "notadmin"

def seed_admin(username: str = ADMIN_USERNAME, password: str = ADMIN_PASSWORD):
  db = SessionLocal()

  existing = db.query(User).filter_by(username=username).first()
  if existing:
      print("Admin already exists")
      exit(0)

  admin = User(
      username=username,
      password_hash=hash_password(password),
      role="admin"
  )

  db.add(admin)
  db.commit()

  print("Admin Created")

if __name__ == "__main__":
    seed_admin()
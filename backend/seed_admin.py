from db.session import SessionLocal
from db.models.user import User

from auth.passwords import hash_password

ADMIN_USERNAME = "kshitij.tyagi"
ADMIN_PASSWORD = "semco@1"

db = SessionLocal()

existing = db.query(User).filter_by(username=ADMIN_USERNAME).first()
if existing:
    print("Admin already exists")
    exit(0)

admin = User(
    username=ADMIN_USERNAME,
    password_hash=hash_password(ADMIN_PASSWORD),
    role="admin"
)

db.add(admin)
db.commit()

print("Admin Created")
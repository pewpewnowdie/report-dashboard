from db.base import Base
from db.session import engine

import db.models
from seed_admin import seed_admin

Base.metadata.create_all(bind=engine)

seed_admin("admin", "notadmin")  
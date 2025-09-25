from app.database import Base, engine
from app.models import user  
from app.models import content


print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Done ✅")

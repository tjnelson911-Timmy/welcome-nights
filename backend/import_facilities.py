import json
import sys
sys.path.insert(0, '.')
from app.models import SessionLocal
from app import models

# Load CMS data
with open('/Users/timnelson/snfalyze/backend/data/cms_facilities.json') as f:
    data = json.load(f)

cascadia_facilities = [f for f in data['facilities'] if 'cascadia' in f['name'].lower()]

db = SessionLocal()

brand = db.query(models.Brand).filter(models.Brand.slug == 'cascadia').first()
if not brand:
    print('Cascadia brand not found!')
    exit(1)

# Delete existing sample facilities for Cascadia
db.query(models.Facility).filter(models.Facility.brand_id == brand.id).delete()
db.commit()

# Import Cascadia facilities
count = 0
for f in cascadia_facilities:
    facility = models.Facility(
        brand_id=brand.id,
        name=f['name'],
        address=f.get('address'),
        city=f.get('city'),
        state=f.get('state'),
    )
    db.add(facility)
    count += 1

db.commit()
print(f'Imported {count} Cascadia facilities')

total = db.query(models.Facility).filter(models.Facility.brand_id == brand.id).count()
print(f'Total Cascadia facilities in database: {total}')

db.close()

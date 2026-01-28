"""
Clean up duplicate facilities and fix logo assignments
"""
import os
import sys
sys.path.insert(0, '.')
from app.models import SessionLocal, Brand, Facility, Asset

db = SessionLocal()

# Remove junk facilities
junk_names = ['NaT', 'Applied filters:', 'Facility Name is not']
for name in junk_names:
    deleted = db.query(Facility).filter(Facility.name.contains(name)).delete(synchronize_session=False)
    if deleted:
        print(f"Deleted {deleted} junk entries containing '{name}'")

db.commit()

# Get all facilities
all_facilities = db.query(Facility).all()
print(f"\nTotal facilities: {len(all_facilities)}")

# Find duplicates based on normalized names
def normalize(name):
    return name.lower().replace(' of cascadia', '').replace(' healthcare', '').replace(' health & rehabilitation', '').replace(' health and rehabilitation', '').replace(' health & rehab', '').replace(' care', '').replace(' - snf', '').replace(' - alf', '').replace(' - ilf', '').strip()

seen = {}
duplicates = []
for f in all_facilities:
    norm = normalize(f.name)
    if norm in seen:
        # Keep the one with a logo, or the first one
        existing = seen[norm]
        if f.logo_asset_id and not existing.logo_asset_id:
            # This one has logo, delete the other
            duplicates.append(existing)
            seen[norm] = f
        else:
            duplicates.append(f)
    else:
        seen[norm] = f

print(f"\nFound {len(duplicates)} duplicate facilities to remove:")
for dup in duplicates:
    print(f"  - {dup.name} (logo: {dup.logo_asset_id})")
    db.delete(dup)

db.commit()

# Check final counts
final_count = db.query(Facility).count()
with_logos = db.query(Facility).filter(Facility.logo_asset_id != None).count()
cascadia = db.query(Brand).filter(Brand.slug == 'cascadia').first()
cascadia_count = db.query(Facility).filter(Facility.brand_id == cascadia.id).count()

print(f"\n=== Final Counts ===")
print(f"Total facilities: {final_count}")
print(f"Cascadia facilities: {cascadia_count}")
print(f"With logos: {with_logos}")

# List facilities without logos
no_logo = db.query(Facility).filter(Facility.logo_asset_id == None).all()
if no_logo:
    print(f"\nFacilities without logos ({len(no_logo)}):")
    for f in no_logo:
        print(f"  - {f.name}")

db.close()

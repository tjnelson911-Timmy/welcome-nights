"""
Migrate facilities and logos from snfalyze database and OneDrive folder
"""
import os
import sys
import sqlite3
import shutil
from datetime import datetime

sys.path.insert(0, '.')
from app.models import SessionLocal, Brand, Facility, Asset

# Paths
SNFALYZE_DB = '/Users/timnelson/snfalyze/backend/data/snfalyze.db'
LOGOS_DIR = '/Users/timnelson/Downloads/OneDrive_1_1-27-2026'
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), 'uploads')

os.makedirs(UPLOADS_DIR, exist_ok=True)

# Connect to old database
old_db = sqlite3.connect(SNFALYZE_DB)
old_db.row_factory = sqlite3.Row

# Connect to new database
db = SessionLocal()

# Clear existing data
print("Clearing existing facilities and assets...")
db.query(Facility).delete()
db.query(Asset).delete()
db.commit()

# Get brand mapping (both databases have same brands)
cascadia = db.query(Brand).filter(Brand.slug == 'cascadia').first()
olympus = db.query(Brand).filter(Brand.slug == 'olympus').first()

if not cascadia or not olympus:
    print("Brands not found! Run seed.py first.")
    sys.exit(1)

brand_map = {1: cascadia.id, 2: olympus.id}

# Import facilities from old database
print("\nImporting facilities from snfalyze...")
old_facilities = old_db.execute("SELECT * FROM wn_facilities").fetchall()

facility_map = {}  # old_id -> new_facility
for f in old_facilities:
    facility = Facility(
        brand_id=brand_map.get(f['brand_id'], cascadia.id),
        name=f['name'],
        address=f['address'],
        city=f['city'],
        state=f['state'],
    )
    db.add(facility)
    db.flush()
    facility_map[f['id']] = facility
    print(f"  Added: {facility.name}")

db.commit()
print(f"\nImported {len(facility_map)} facilities")

# Now import logos from OneDrive folder
print("\nImporting logos from OneDrive folder...")
logo_count = 0

for folder_name in os.listdir(LOGOS_DIR):
    folder_path = os.path.join(LOGOS_DIR, folder_name)
    if not os.path.isdir(folder_path):
        continue

    # Find PNG files in folder
    png_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.png')]
    if not png_files:
        print(f"  No PNG in: {folder_name}")
        continue

    # Use the first PNG (prefer -01 if available)
    png_file = png_files[0]
    for pf in png_files:
        if '-01' in pf:
            png_file = pf
            break

    # Find matching facility
    matching_facility = None
    folder_lower = folder_name.lower()

    for old_id, facility in facility_map.items():
        fac_lower = facility.name.lower()
        # Try various matching strategies
        if folder_lower in fac_lower or fac_lower in folder_lower:
            matching_facility = facility
            break
        # Match on key words
        folder_words = set(folder_lower.replace(' of cascadia', '').replace(' health & rehab', '').replace(' healthcare', '').split())
        fac_words = set(fac_lower.replace(' of cascadia', '').replace(' health & rehabilitation', '').replace(' healthcare', '').split())
        if len(folder_words & fac_words) >= 2:
            matching_facility = facility
            break

    if not matching_facility:
        # Create facility if no match
        matching_facility = Facility(
            brand_id=cascadia.id,
            name=folder_name,
        )
        db.add(matching_facility)
        db.flush()
        print(f"  Created new facility: {folder_name}")

    # Copy logo file
    src_path = os.path.join(folder_path, png_file)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    new_filename = f"{timestamp}_{png_file}"
    dst_path = os.path.join(UPLOADS_DIR, new_filename)

    shutil.copy2(src_path, dst_path)

    # Create asset record
    file_size = os.path.getsize(dst_path)
    asset = Asset(
        brand_id=cascadia.id,
        asset_type='facility_logo',
        filename=new_filename,
        original_filename=png_file,
        url=f'/uploads/{new_filename}',
        mime_type='image/png',
        file_size=file_size,
    )
    db.add(asset)
    db.flush()

    # Link to facility
    matching_facility.logo_asset_id = asset.id
    logo_count += 1
    print(f"  Logo: {png_file} -> {matching_facility.name}")

db.commit()

# Summary
total_facilities = db.query(Facility).count()
total_assets = db.query(Asset).count()
facilities_with_logos = db.query(Facility).filter(Facility.logo_asset_id != None).count()

print(f"\n=== Migration Complete ===")
print(f"Total facilities: {total_facilities}")
print(f"Total assets: {total_assets}")
print(f"Facilities with logos: {facilities_with_logos}")

db.close()
old_db.close()

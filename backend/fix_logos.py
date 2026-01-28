"""
Manually fix logo assignments for remaining facilities
"""
import os
import sys
import shutil
from datetime import datetime
sys.path.insert(0, '.')
from app.models import SessionLocal, Brand, Facility, Asset

LOGOS_DIR = '/Users/timnelson/Downloads/OneDrive_1_1-27-2026'
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), 'uploads')

db = SessionLocal()
cascadia = db.query(Brand).filter(Brand.slug == 'cascadia').first()

# Manual mappings: folder name -> facility name substring
manual_mappings = {
    'Boswell Transitional Care of Cascadia': 'Boswell Transitional Care',
    'Brookfield Health and Rehab of Cascadia': 'Brookfield',
    'Cascadia of Lewiston': 'Cascadia of Lewiston',
    'Cascadia of Nampa': 'Cascadia of Nampa',
    'Lewiston Transitional Care of Cascadia': 'Lewiston Transitional',
    'Mount Ascension Transitional Care of Cascadia': 'Mount Ascension',
    'Salem Transitional Care': 'Salem Transitional',
    'The Abbey of Olympus Retirement Living': 'Abbey',
    'Twin Falls Transitional Care of Cascadia': 'Twin Falls',
    'Wellspring Health & Rehab of Cascadia': 'Wellspring',
}

def assign_logo(folder_name, facility_search):
    folder_path = os.path.join(LOGOS_DIR, folder_name)
    if not os.path.isdir(folder_path):
        print(f"  Folder not found: {folder_name}")
        return False

    # Find PNG
    png_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.png')]
    if not png_files:
        print(f"  No PNG in: {folder_name}")
        return False

    png_file = png_files[0]
    for pf in png_files:
        if '-01' in pf or 'final' in pf.lower():
            png_file = pf
            break

    # Find facility
    facility = db.query(Facility).filter(Facility.name.ilike(f'%{facility_search}%')).first()
    if not facility:
        print(f"  Facility not found: {facility_search}")
        return False

    if facility.logo_asset_id:
        print(f"  Already has logo: {facility.name}")
        return False

    # Copy logo
    src_path = os.path.join(folder_path, png_file)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    new_filename = f"{timestamp}_{png_file}"
    dst_path = os.path.join(UPLOADS_DIR, new_filename)
    shutil.copy2(src_path, dst_path)

    # Create asset
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

    facility.logo_asset_id = asset.id
    print(f"  Assigned: {png_file} -> {facility.name}")
    return True

print("Fixing logo assignments...")
for folder, search in manual_mappings.items():
    assign_logo(folder, search)

db.commit()

# Final counts
total = db.query(Facility).count()
with_logos = db.query(Facility).filter(Facility.logo_asset_id != None).count()
print(f"\n=== Final Counts ===")
print(f"Total facilities: {total}")
print(f"With logos: {with_logos}")

# Remaining without logos
no_logo = db.query(Facility).filter(Facility.logo_asset_id == None).all()
if no_logo:
    print(f"\nStill without logos ({len(no_logo)}):")
    for f in no_logo:
        print(f"  - {f.name}")

db.close()

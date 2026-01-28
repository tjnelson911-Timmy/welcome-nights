"""
Fix remaining logo assignments
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

# Manual mappings for remaining
manual_mappings = {
    'Fairlawn of Olympus Retirement Living': 'Fairlawn of Olympus',
    'Olympus Living at Spokane Valley': 'Olympus Living at Spokane Valley-ALF',
    'Paradise Creek Health & Rehab of Cascadia': 'Paradise Creek Health and Rehabilitation',
    'Paradise Creek of Olympus Retirement Living': 'Paradise Creek of Olympus Retirement Living - ALF',
    'Royal Plaza of Olympus Living': 'Royal Plaza of Olympus',
    'Silverton of Cascadia Retirement Living': 'Silverton of Cascadia Retirement Living-ALF',
    'Spokane Valley Health & Rehab of Cascadia': 'Spokane Valley Health and Rehabilitation',
}

def assign_logo(folder_name, facility_search):
    folder_path = os.path.join(LOGOS_DIR, folder_name)
    if not os.path.isdir(folder_path):
        print(f"  Folder not found: {folder_name}")
        return False

    png_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.png')]
    if not png_files:
        print(f"  No PNG in: {folder_name}")
        return False

    png_file = png_files[0]
    for pf in png_files:
        if '-01' in pf or 'final' in pf.lower():
            png_file = pf
            break

    facility = db.query(Facility).filter(Facility.name.ilike(f'%{facility_search}%')).first()
    if not facility:
        print(f"  Facility not found: {facility_search}")
        return False

    if facility.logo_asset_id:
        print(f"  Already has logo: {facility.name}")
        return False

    src_path = os.path.join(folder_path, png_file)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    new_filename = f"{timestamp}_{png_file}"
    dst_path = os.path.join(UPLOADS_DIR, new_filename)
    shutil.copy2(src_path, dst_path)

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

print("Fixing remaining logo assignments...")
for folder, search in manual_mappings.items():
    assign_logo(folder, search)

# Also try to assign Silverton to ILF variant
silverton_ilf = db.query(Facility).filter(Facility.name.ilike('%Silverton%ILF%')).first()
if silverton_ilf and not silverton_ilf.logo_asset_id:
    # Use same logo as ALF
    silverton_alf = db.query(Facility).filter(Facility.name.ilike('%Silverton%ALF%')).first()
    if silverton_alf and silverton_alf.logo_asset_id:
        silverton_ilf.logo_asset_id = silverton_alf.logo_asset_id
        print(f"  Shared logo with: {silverton_ilf.name}")

db.commit()

# Final counts
total = db.query(Facility).count()
with_logos = db.query(Facility).filter(Facility.logo_asset_id != None).count()
print(f"\n=== Final Counts ===")
print(f"Total facilities: {total}")
print(f"With logos: {with_logos}")

no_logo = db.query(Facility).filter(Facility.logo_asset_id == None).all()
if no_logo:
    print(f"\nStill without logos ({len(no_logo)}):")
    for f in no_logo:
        print(f"  - {f.name}")

db.close()

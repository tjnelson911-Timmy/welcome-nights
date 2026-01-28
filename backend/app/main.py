"""
Welcome Nights API
Culture Night Presentation Builder
"""

import os
import io
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
import pandas as pd

from . import models, schemas, crud
from .models import get_db, init_db
from . import slide_builder, presentation_export

app = FastAPI(title="Welcome Nights", description="Culture Night Presentation Builder")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Upload directories
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ============ Brand Endpoints ============
@app.get("/api/brands", response_model=List[schemas.BrandResponse])
def get_brands(db: Session = Depends(get_db)):
    return crud.get_brands(db)


@app.get("/api/brands/{brand_id}", response_model=schemas.BrandResponse)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = crud.get_brand(db, brand_id)
    if not brand:
        raise HTTPException(404, "Brand not found")
    return brand


@app.post("/api/brands", response_model=schemas.BrandResponse)
def create_brand(brand: schemas.BrandCreate, db: Session = Depends(get_db)):
    return crud.create_brand(db, brand)


@app.put("/api/brands/{brand_id}", response_model=schemas.BrandResponse)
def update_brand(brand_id: int, brand: schemas.BrandUpdate, db: Session = Depends(get_db)):
    updated = crud.update_brand(db, brand_id, brand)
    if not updated:
        raise HTTPException(404, "Brand not found")
    return updated


# ============ Facility Endpoints ============
@app.get("/api/facilities", response_model=List[schemas.FacilityResponse])
def get_facilities(brand_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_facilities(db, brand_id)


@app.get("/api/facilities/{facility_id}", response_model=schemas.FacilityResponse)
def get_facility(facility_id: int, db: Session = Depends(get_db)):
    facility = crud.get_facility(db, facility_id)
    if not facility:
        raise HTTPException(404, "Facility not found")
    return facility


@app.post("/api/facilities", response_model=schemas.FacilityResponse)
def create_facility(facility: schemas.FacilityCreate, db: Session = Depends(get_db)):
    return crud.create_facility(db, facility)


@app.put("/api/facilities/{facility_id}", response_model=schemas.FacilityResponse)
def update_facility(facility_id: int, facility: schemas.FacilityUpdate, db: Session = Depends(get_db)):
    updated = crud.update_facility(db, facility_id, facility)
    if not updated:
        raise HTTPException(404, "Facility not found")
    return updated


@app.delete("/api/facilities/{facility_id}")
def delete_facility(facility_id: int, db: Session = Depends(get_db)):
    if not crud.delete_facility(db, facility_id):
        raise HTTPException(404, "Facility not found")
    return {"message": "Deleted"}


@app.post("/api/facilities/import")
async def import_facilities(
    brand_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import facilities from CSV or Excel file"""
    filename = file.filename.lower()
    content = await file.read()

    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(400, "Unsupported file type. Please upload CSV or Excel file.")
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {str(e)}")

    df.columns = [c.lower().strip().replace(' ', '_') for c in df.columns]

    if 'name' not in df.columns and 'facility_name' not in df.columns:
        raise HTTPException(400, "File must contain a 'name' or 'facility_name' column")

    if 'facility_name' in df.columns and 'name' not in df.columns:
        df['name'] = df['facility_name']

    created = 0
    updated = 0
    errors = []

    for idx, row in df.iterrows():
        try:
            name = str(row.get('name', '')).strip()
            if not name:
                continue

            facility_data = {
                'name': name,
                'city': str(row.get('city', '')).strip() if pd.notna(row.get('city')) else None,
                'state': str(row.get('state', '')).strip() if pd.notna(row.get('state')) else None,
                'address': str(row.get('address', '')).strip() if pd.notna(row.get('address')) else None,
            }

            existing = db.query(models.Facility).filter(
                models.Facility.brand_id == brand_id,
                models.Facility.name == name
            ).first()

            if existing:
                for k, v in facility_data.items():
                    if v:
                        setattr(existing, k, v)
                db.commit()
                updated += 1
            else:
                new_facility = models.Facility(brand_id=brand_id, **facility_data)
                db.add(new_facility)
                db.commit()
                created += 1
        except Exception as e:
            errors.append(f"Row {idx + 2}: {str(e)}")

    return {
        "message": f"Import complete: {created} created, {updated} updated",
        "created": created,
        "updated": updated,
        "errors": errors[:10]
    }


@app.post("/api/facilities/{facility_id}/logo")
async def upload_facility_logo(
    facility_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a logo for a specific facility"""
    facility = crud.get_facility(db, facility_id)
    if not facility:
        raise HTTPException(404, "Facility not found")

    ext = file.filename.split(".")[-1].lower()
    if ext not in {"png", "jpg", "jpeg", "gif", "webp"}:
        raise HTTPException(400, "Invalid file type")

    content = await file.read()
    fname = f"facility_{facility_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, fname)

    with open(file_path, "wb") as f:
        f.write(content)

    asset = crud.create_asset(db, schemas.AssetCreate(
        brand_id=facility.brand_id,
        asset_type="facility_logo",
        filename=fname,
        original_filename=file.filename,
        url=f"/uploads/{fname}",
        mime_type=file.content_type,
        file_size=len(content)
    ))

    facility.logo_asset_id = asset.id
    db.commit()
    db.refresh(facility)

    return {"message": "Logo uploaded", "asset": asset, "facility": facility}


@app.delete("/api/facilities/{facility_id}/logo")
def delete_facility_logo(facility_id: int, db: Session = Depends(get_db)):
    """Remove logo from a facility"""
    facility = crud.get_facility(db, facility_id)
    if not facility:
        raise HTTPException(404, "Facility not found")

    facility.logo_asset_id = None
    db.commit()

    return {"message": "Logo removed"}


@app.put("/api/facilities/{facility_id}/assign-logo/{asset_id}")
def assign_logo_to_facility(facility_id: int, asset_id: int, db: Session = Depends(get_db)):
    """Assign an existing logo asset to a facility"""
    facility = crud.get_facility(db, facility_id)
    if not facility:
        raise HTTPException(404, "Facility not found")

    asset = crud.get_asset(db, asset_id)
    if not asset:
        raise HTTPException(404, "Asset not found")

    facility.logo_asset_id = asset_id
    db.commit()
    db.refresh(facility)

    return {
        "message": "Logo assigned",
        "facility_id": facility_id,
        "asset_id": asset_id,
        "logo_url": asset.url
    }


# ============ Asset Endpoints ============
@app.get("/api/assets", response_model=List[schemas.AssetResponse])
def get_assets(brand_id: Optional[int] = None, asset_type: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_assets(db, brand_id, asset_type)


@app.post("/api/assets")
async def upload_asset(
    brand_id: int = Form(...),
    asset_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload an asset"""
    ext = file.filename.split(".")[-1].lower()
    if ext not in {"png", "jpg", "jpeg", "gif", "svg", "webp"}:
        raise HTTPException(400, "Invalid file type")

    content = await file.read()
    fname = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, fname)

    with open(file_path, "wb") as f:
        f.write(content)

    asset = crud.create_asset(db, schemas.AssetCreate(
        brand_id=brand_id,
        asset_type=asset_type,
        filename=fname,
        original_filename=file.filename,
        url=f"/uploads/{fname}",
        mime_type=file.content_type,
        file_size=len(content)
    ))

    return {"message": "Uploaded", "asset": asset}


@app.delete("/api/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = crud.get_asset(db, asset_id)
    if not asset:
        raise HTTPException(404, "Asset not found")
    try:
        os.remove(os.path.join(UPLOAD_DIR, asset.filename))
    except:
        pass
    crud.delete_asset(db, asset_id)
    return {"message": "Deleted"}


# ============ Template Endpoints ============
@app.get("/api/templates")
def get_templates():
    """Get list of uploaded PPTX templates"""
    templates = []
    if os.path.exists(TEMPLATES_DIR):
        for fname in os.listdir(TEMPLATES_DIR):
            if fname.endswith(('.pptx', '.ppt')):
                fpath = os.path.join(TEMPLATES_DIR, fname)
                stat = os.stat(fpath)
                templates.append({
                    "filename": fname,
                    "size": stat.st_size,
                    "uploaded_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "url": f"/templates/{fname}"
                })
    return sorted(templates, key=lambda x: x["uploaded_at"], reverse=True)


@app.post("/api/templates")
async def upload_template(file: UploadFile = File(...)):
    """Upload a PPTX template"""
    ext = file.filename.split(".")[-1].lower()
    if ext not in {"pptx", "ppt"}:
        raise HTTPException(400, "Invalid file type. Please upload a PowerPoint file.")

    content = await file.read()
    base_name = file.filename.rsplit(".", 1)[0]
    fname = f"{base_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{ext}"
    file_path = os.path.join(TEMPLATES_DIR, fname)

    with open(file_path, "wb") as f:
        f.write(content)

    return {"message": "Template uploaded", "filename": fname, "size": len(content), "url": f"/templates/{fname}"}


@app.delete("/api/templates/{filename}")
def delete_template(filename: str):
    file_path = os.path.join(TEMPLATES_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "Template not found")
    os.remove(file_path)
    return {"message": "Template deleted"}


@app.get("/templates/{filename}")
def serve_template(filename: str):
    file_path = os.path.join(TEMPLATES_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "Template not found")
    return FileResponse(file_path, filename=filename)


# ============ Agenda Template Endpoints ============
@app.get("/api/agenda-templates", response_model=List[schemas.AgendaTemplateResponse])
def get_agenda_templates(brand_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_agenda_templates(db, brand_id)


@app.post("/api/agenda-templates", response_model=schemas.AgendaTemplateResponse)
def create_agenda_template(template: schemas.AgendaTemplateCreate, db: Session = Depends(get_db)):
    return crud.create_agenda_template(db, template)


# ============ Content Endpoints ============
@app.get("/api/content", response_model=List[schemas.ReusableContentResponse])
def get_content(brand_id: int, db: Session = Depends(get_db)):
    return crud.get_content(db, brand_id)


@app.put("/api/content/{content_id}", response_model=schemas.ReusableContentResponse)
def update_content(content_id: int, content: schemas.ReusableContentUpdate, db: Session = Depends(get_db)):
    updated = crud.update_content(db, content_id, content)
    if not updated:
        raise HTTPException(404, "Content not found")
    return updated


# ============ Game Endpoints ============
@app.get("/api/games", response_model=List[schemas.GameResponse])
def get_games(brand_id: Optional[int] = None, game_type: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_games(db, brand_id, game_type, active_only=False)


@app.post("/api/games", response_model=schemas.GameResponse)
def create_game(game: schemas.GameCreate, db: Session = Depends(get_db)):
    return crud.create_game(db, game)


@app.put("/api/games/{game_id}", response_model=schemas.GameResponse)
def update_game(game_id: int, game: schemas.GameUpdate, db: Session = Depends(get_db)):
    updated = crud.update_game(db, game_id, game)
    if not updated:
        raise HTTPException(404, "Game not found")
    return updated


@app.delete("/api/games/{game_id}")
def delete_game(game_id: int, db: Session = Depends(get_db)):
    if not crud.delete_game(db, game_id):
        raise HTTPException(404, "Game not found")
    return {"message": "Deleted"}


# ============ Presentation Endpoints ============
@app.get("/api/presentations", response_model=List[schemas.PresentationResponse])
def get_presentations(brand_id: Optional[int] = None, facility_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_presentations(db, brand_id, facility_id)


@app.get("/api/presentations/{presentation_id}", response_model=schemas.PresentationResponse)
def get_presentation(presentation_id: int, db: Session = Depends(get_db)):
    presentation = crud.get_presentation(db, presentation_id)
    if not presentation:
        raise HTTPException(404, "Presentation not found")
    return presentation


@app.post("/api/presentations", response_model=schemas.PresentationResponse)
def create_presentation(presentation: schemas.PresentationCreate, db: Session = Depends(get_db)):
    return crud.create_presentation(db, presentation)


@app.put("/api/presentations/{presentation_id}", response_model=schemas.PresentationResponse)
def update_presentation(presentation_id: int, presentation: schemas.PresentationUpdate, db: Session = Depends(get_db)):
    updated = crud.update_presentation(db, presentation_id, presentation)
    if not updated:
        raise HTTPException(404, "Presentation not found")
    return updated


@app.delete("/api/presentations/{presentation_id}")
def delete_presentation(presentation_id: int, db: Session = Depends(get_db)):
    if not crud.delete_presentation(db, presentation_id):
        raise HTTPException(404, "Presentation not found")
    return {"message": "Deleted"}


# ============ Build Slides ============
@app.post("/api/presentations/{presentation_id}/build-slides", response_model=schemas.BuildSlidesResponse)
def build_presentation_slides(presentation_id: int, request: schemas.BuildSlidesRequest, db: Session = Depends(get_db)):
    """Build slide instances for a presentation"""
    try:
        config = request.model_dump()
        slides = slide_builder.build_slides(db, presentation_id, config)
        return {
            "presentation_id": presentation_id,
            "slides_created": len(slides),
            "slide_types": [s["slide_type"] for s in slides]
        }
    except ValueError as e:
        raise HTTPException(400, str(e))


# ============ Present Mode ============
@app.get("/api/presentations/{presentation_id}/present")
def get_present_data(presentation_id: int, db: Session = Depends(get_db)):
    """Get all data needed for presentation mode"""
    presentation = crud.get_presentation(db, presentation_id)
    if not presentation:
        raise HTTPException(404, "Presentation not found")

    brand = crud.get_brand(db, presentation.brand_id)
    facility = crud.get_facility(db, presentation.facility_id)
    slides = crud.get_presentation_slides(db, presentation_id)

    return {
        "presentation": {
            "id": presentation.id,
            "title": presentation.title,
            "status": presentation.status,
            "config": presentation.config
        },
        "brand": {
            "id": brand.id,
            "name": brand.name,
            "slug": brand.slug,
            "primary_color": brand.primary_color,
            "secondary_color": brand.secondary_color,
            "font_family": brand.font_family,
            "logo_url": brand.logo_url
        },
        "facility": {
            "id": facility.id,
            "name": facility.name,
            "city": facility.city,
            "state": facility.state
        },
        "slides": [
            {
                "id": s.id,
                "order": s.order,
                "slide_type": s.slide_type,
                "payload": s.payload,
                "notes": s.notes
            }
            for s in slides
        ],
        "total_slides": len(slides)
    }


@app.post("/api/presentations/{presentation_id}/mark-presented")
def mark_presented(presentation_id: int, db: Session = Depends(get_db)):
    """Mark presentation as presented"""
    presentation = crud.get_presentation(db, presentation_id)
    if not presentation:
        raise HTTPException(404, "Presentation not found")

    presentation.status = "presented"
    presentation.presented_at = datetime.utcnow()
    db.commit()

    return {"message": "Marked as presented"}


# ============ Export ============
@app.get("/api/presentations/{presentation_id}/export/pptx")
def export_pptx(presentation_id: int, db: Session = Depends(get_db)):
    """Export presentation to PPTX"""
    presentation = crud.get_presentation(db, presentation_id)
    if not presentation:
        raise HTTPException(404, "Presentation not found")

    try:
        pptx_bytes = presentation_export.export_to_pptx(db, presentation_id)
        filename = presentation_export.get_export_filename(presentation, "pptx")
        return Response(
            content=pptx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(500, f"Export failed: {str(e)}")


@app.get("/api/presentations/{presentation_id}/export/pdf")
def export_pdf(presentation_id: int, db: Session = Depends(get_db)):
    """Export presentation to PDF"""
    presentation = crud.get_presentation(db, presentation_id)
    if not presentation:
        raise HTTPException(404, "Presentation not found")

    try:
        pdf_bytes = presentation_export.export_to_pdf(db, presentation_id)
        filename = presentation_export.get_export_filename(presentation, "pdf")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(500, f"Export failed: {str(e)}")


# ============ Health Check ============
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Welcome Nights API"}

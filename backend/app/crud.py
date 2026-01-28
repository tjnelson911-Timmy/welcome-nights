"""
Welcome Nights CRUD Operations
"""

from sqlalchemy.orm import Session
from typing import Optional, List
from . import models, schemas


# Brand CRUD
def get_brands(db: Session) -> List[models.Brand]:
    return db.query(models.Brand).all()


def get_brand(db: Session, brand_id: int) -> Optional[models.Brand]:
    return db.query(models.Brand).filter(models.Brand.id == brand_id).first()


def get_brand_by_slug(db: Session, slug: str) -> Optional[models.Brand]:
    return db.query(models.Brand).filter(models.Brand.slug == slug).first()


def create_brand(db: Session, brand: schemas.BrandCreate) -> models.Brand:
    db_brand = models.Brand(**brand.model_dump())
    db.add(db_brand)
    db.commit()
    db.refresh(db_brand)
    return db_brand


def update_brand(db: Session, brand_id: int, brand: schemas.BrandUpdate) -> Optional[models.Brand]:
    db_brand = get_brand(db, brand_id)
    if db_brand:
        for key, value in brand.model_dump(exclude_unset=True).items():
            setattr(db_brand, key, value)
        db.commit()
        db.refresh(db_brand)
    return db_brand


# Facility CRUD
def get_facilities(db: Session, brand_id: Optional[int] = None) -> List[models.Facility]:
    query = db.query(models.Facility)
    if brand_id:
        query = query.filter(models.Facility.brand_id == brand_id)
    return query.all()


def get_facility(db: Session, facility_id: int) -> Optional[models.Facility]:
    return db.query(models.Facility).filter(models.Facility.id == facility_id).first()


def create_facility(db: Session, facility: schemas.FacilityCreate) -> models.Facility:
    db_facility = models.Facility(**facility.model_dump())
    db.add(db_facility)
    db.commit()
    db.refresh(db_facility)
    return db_facility


def update_facility(db: Session, facility_id: int, facility: schemas.FacilityUpdate) -> Optional[models.Facility]:
    db_facility = get_facility(db, facility_id)
    if db_facility:
        for key, value in facility.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(db_facility, key, value)
        db.commit()
        db.refresh(db_facility)
    return db_facility


def delete_facility(db: Session, facility_id: int) -> bool:
    db_facility = get_facility(db, facility_id)
    if db_facility:
        db.delete(db_facility)
        db.commit()
        return True
    return False


# Asset CRUD
def get_assets(db: Session, brand_id: Optional[int] = None, asset_type: Optional[str] = None) -> List[models.Asset]:
    query = db.query(models.Asset)
    if brand_id:
        query = query.filter(models.Asset.brand_id == brand_id)
    if asset_type:
        query = query.filter(models.Asset.asset_type == asset_type)
    return query.all()


def get_asset(db: Session, asset_id: int) -> Optional[models.Asset]:
    return db.query(models.Asset).filter(models.Asset.id == asset_id).first()


def create_asset(db: Session, asset: schemas.AssetCreate) -> models.Asset:
    db_asset = models.Asset(**asset.model_dump())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


def delete_asset(db: Session, asset_id: int) -> bool:
    db_asset = get_asset(db, asset_id)
    if db_asset:
        db.delete(db_asset)
        db.commit()
        return True
    return False


# Agenda Template CRUD
def get_agenda_templates(db: Session, brand_id: Optional[int] = None) -> List[models.AgendaTemplate]:
    query = db.query(models.AgendaTemplate)
    if brand_id:
        query = query.filter(
            (models.AgendaTemplate.brand_id == brand_id) | (models.AgendaTemplate.brand_id.is_(None))
        )
    return query.all()


def get_agenda_template(db: Session, template_id: int) -> Optional[models.AgendaTemplate]:
    return db.query(models.AgendaTemplate).filter(models.AgendaTemplate.id == template_id).first()


def create_agenda_template(db: Session, template: schemas.AgendaTemplateCreate) -> models.AgendaTemplate:
    db_template = models.AgendaTemplate(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


# Reusable Content CRUD
def get_content(db: Session, brand_id: int) -> List[models.ReusableContent]:
    return db.query(models.ReusableContent).filter(models.ReusableContent.brand_id == brand_id).all()


def get_content_by_key(db: Session, brand_id: int, content_key: str) -> Optional[models.ReusableContent]:
    return db.query(models.ReusableContent).filter(
        models.ReusableContent.brand_id == brand_id,
        models.ReusableContent.content_key == content_key
    ).first()


def create_content(db: Session, content: schemas.ReusableContentCreate) -> models.ReusableContent:
    db_content = models.ReusableContent(**content.model_dump())
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content


def update_content(db: Session, content_id: int, content: schemas.ReusableContentUpdate) -> Optional[models.ReusableContent]:
    db_content = db.query(models.ReusableContent).filter(models.ReusableContent.id == content_id).first()
    if db_content:
        for key, value in content.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(db_content, key, value)
        db_content.version += 1
        db.commit()
        db.refresh(db_content)
    return db_content


# Game CRUD
def get_games(db: Session, brand_id: Optional[int] = None, game_type: Optional[str] = None, active_only: bool = True) -> List[models.Game]:
    query = db.query(models.Game)
    if brand_id:
        query = query.filter((models.Game.brand_id == brand_id) | (models.Game.brand_id.is_(None)))
    if game_type:
        query = query.filter(models.Game.game_type == game_type)
    if active_only:
        query = query.filter(models.Game.is_active == True)
    return query.all()


def get_game(db: Session, game_id: int) -> Optional[models.Game]:
    return db.query(models.Game).filter(models.Game.id == game_id).first()


def create_game(db: Session, game: schemas.GameCreate) -> models.Game:
    db_game = models.Game(**game.model_dump())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


def update_game(db: Session, game_id: int, game: schemas.GameUpdate) -> Optional[models.Game]:
    db_game = get_game(db, game_id)
    if db_game:
        for key, value in game.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(db_game, key, value)
        db.commit()
        db.refresh(db_game)
    return db_game


def delete_game(db: Session, game_id: int) -> bool:
    db_game = get_game(db, game_id)
    if db_game:
        db.delete(db_game)
        db.commit()
        return True
    return False


# Presentation CRUD
def get_presentations(db: Session, brand_id: Optional[int] = None, facility_id: Optional[int] = None) -> List[models.Presentation]:
    query = db.query(models.Presentation)
    if brand_id:
        query = query.filter(models.Presentation.brand_id == brand_id)
    if facility_id:
        query = query.filter(models.Presentation.facility_id == facility_id)
    return query.order_by(models.Presentation.created_at.desc()).all()


def get_presentation(db: Session, presentation_id: int) -> Optional[models.Presentation]:
    return db.query(models.Presentation).filter(models.Presentation.id == presentation_id).first()


def create_presentation(db: Session, presentation: schemas.PresentationCreate) -> models.Presentation:
    db_presentation = models.Presentation(**presentation.model_dump())
    db.add(db_presentation)
    db.commit()
    db.refresh(db_presentation)
    return db_presentation


def update_presentation(db: Session, presentation_id: int, presentation: schemas.PresentationUpdate) -> Optional[models.Presentation]:
    db_presentation = get_presentation(db, presentation_id)
    if db_presentation:
        for key, value in presentation.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(db_presentation, key, value)
        db.commit()
        db.refresh(db_presentation)
    return db_presentation


def delete_presentation(db: Session, presentation_id: int) -> bool:
    db_presentation = get_presentation(db, presentation_id)
    if db_presentation:
        db.delete(db_presentation)
        db.commit()
        return True
    return False


# Presentation Slide CRUD
def get_presentation_slides(db: Session, presentation_id: int) -> List[models.PresentationSlide]:
    return db.query(models.PresentationSlide).filter(
        models.PresentationSlide.presentation_id == presentation_id
    ).order_by(models.PresentationSlide.order).all()


def create_presentation_slide(db: Session, slide: schemas.PresentationSlideCreate) -> models.PresentationSlide:
    db_slide = models.PresentationSlide(**slide.model_dump())
    db.add(db_slide)
    db.commit()
    db.refresh(db_slide)
    return db_slide


def delete_presentation_slides(db: Session, presentation_id: int) -> int:
    count = db.query(models.PresentationSlide).filter(
        models.PresentationSlide.presentation_id == presentation_id
    ).delete()
    db.commit()
    return count


def clear_presentation_slides(db: Session, presentation_id: int) -> int:
    """Clear all slides for a presentation (alias for delete_presentation_slides)"""
    return delete_presentation_slides(db, presentation_id)


def bulk_create_slides(db: Session, presentation_id: int, slides: List[dict]) -> List[models.PresentationSlide]:
    """Bulk create slides for a presentation"""
    db_slides = []
    for slide_data in slides:
        db_slide = models.PresentationSlide(
            presentation_id=presentation_id,
            order=slide_data.get("order", 0),
            slide_type=slide_data.get("slide_type", ""),
            payload=slide_data.get("payload", {}),
            notes=slide_data.get("notes", "")
        )
        db.add(db_slide)
        db_slides.append(db_slide)
    db.commit()
    return db_slides

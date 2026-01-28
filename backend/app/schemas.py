"""
Welcome Nights Pydantic Schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# Brand schemas
class BrandBase(BaseModel):
    name: str
    slug: str
    primary_color: Optional[str] = "#0b7280"
    secondary_color: Optional[str] = "#065a67"
    font_family: Optional[str] = "Inter"
    logo_url: Optional[str] = None


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    font_family: Optional[str] = None
    logo_url: Optional[str] = None


class BrandResponse(BrandBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Facility schemas
class FacilityBase(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    logo_asset_id: Optional[int] = None
    extra_data: Optional[Dict[str, Any]] = {}


class FacilityCreate(FacilityBase):
    brand_id: int


class FacilityUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    logo_asset_id: Optional[int] = None
    extra_data: Optional[Dict[str, Any]] = None


class FacilityResponse(FacilityBase):
    id: int
    brand_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Asset schemas
class AssetBase(BaseModel):
    asset_type: str
    filename: str
    original_filename: Optional[str] = None
    url: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None


class AssetCreate(AssetBase):
    brand_id: Optional[int] = None


class AssetResponse(AssetBase):
    id: int
    brand_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# Agenda Template schemas
class AgendaTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    slide_order: List[str]
    is_default: Optional[bool] = False


class AgendaTemplateCreate(AgendaTemplateBase):
    brand_id: Optional[int] = None


class AgendaTemplateResponse(AgendaTemplateBase):
    id: int
    brand_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# Reusable Content schemas
class ReusableContentBase(BaseModel):
    content_key: str
    title: Optional[str] = None
    content: Dict[str, Any]


class ReusableContentCreate(ReusableContentBase):
    brand_id: int


class ReusableContentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    updated_by: Optional[str] = None


class ReusableContentResponse(ReusableContentBase):
    id: int
    brand_id: int
    version: int
    updated_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Game schemas
class GameBase(BaseModel):
    title: str
    description: Optional[str] = None
    rules: Optional[str] = None
    duration_minutes: Optional[int] = None
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    game_type: Optional[str] = "challenge"
    value_label: Optional[str] = None
    tags: Optional[List[str]] = []


class GameCreate(GameBase):
    brand_id: Optional[int] = None


class GameUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[str] = None
    duration_minutes: Optional[int] = None
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    game_type: Optional[str] = None
    value_label: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class GameResponse(GameBase):
    id: int
    brand_id: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Presentation schemas
class PresentationBase(BaseModel):
    title: str
    brand_id: int
    facility_id: int
    agenda_template_id: Optional[int] = None


class PresentationCreate(PresentationBase):
    pass


class PresentationUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class PresentationResponse(PresentationBase):
    id: int
    status: str
    config: Optional[Dict[str, Any]]
    created_by: Optional[str]
    presented_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Presentation Slide schemas
class PresentationSlideBase(BaseModel):
    order: int
    slide_type: str
    payload: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class PresentationSlideCreate(PresentationSlideBase):
    presentation_id: int


class PresentationSlideResponse(PresentationSlideBase):
    id: int
    presentation_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Build slides request/response
class BuildSlidesRequest(BaseModel):
    raffle_count: Optional[int] = 0
    selected_game_ids: Optional[List[int]] = None
    include_history: Optional[bool] = True
    include_footprint: Optional[bool] = True
    include_regions: Optional[bool] = True
    include_culture: Optional[bool] = True


class BuildSlidesResponse(BaseModel):
    presentation_id: int
    slides_created: int
    slide_types: List[str]


# Present mode data
class PresentSlideData(BaseModel):
    id: int
    order: int
    slide_type: str
    payload: Optional[Dict[str, Any]]
    notes: Optional[str]


class PresentData(BaseModel):
    presentation: Dict[str, Any]
    brand: Dict[str, Any]
    facility: Dict[str, Any]
    slides: List[PresentSlideData]
    total_slides: int

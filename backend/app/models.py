"""
Welcome Nights Database Models
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()


class Brand(Base):
    """Brand configuration (Cascadia, Olympus, etc.)"""
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(50), unique=True, nullable=False)
    primary_color = Column(String(7), default="#0b7280")
    secondary_color = Column(String(7), default="#065a67")
    font_family = Column(String(100), default="Inter")
    logo_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    facilities = relationship("Facility", back_populates="brand")
    assets = relationship("Asset", back_populates="brand")
    content = relationship("ReusableContent", back_populates="brand")
    presentations = relationship("Presentation", back_populates="brand")


class Facility(Base):
    """Facility/location for presentations"""
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    name = Column(String(200), nullable=False)
    address = Column(String(300))
    city = Column(String(100))
    state = Column(String(50))
    latitude = Column(Float)
    longitude = Column(Float)
    logo_asset_id = Column(Integer, ForeignKey("assets.id"))
    extra_data = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    brand = relationship("Brand", back_populates="facilities")
    logo_asset = relationship("Asset", foreign_keys=[logo_asset_id])
    presentations = relationship("Presentation", back_populates="facility")


class Asset(Base):
    """Uploaded assets (logos, images, backgrounds)"""
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    asset_type = Column(String(50), nullable=False)  # logo, background, icon, image
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    url = Column(String(500), nullable=False)
    mime_type = Column(String(100))
    file_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    brand = relationship("Brand", back_populates="assets")


class AgendaTemplate(Base):
    """Reusable agenda templates defining slide order"""
    __tablename__ = "agenda_templates"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    slide_order = Column(JSON, nullable=False)  # List of slide type strings
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    brand = relationship("Brand")


class ReusableContent(Base):
    """Reusable content blocks (history, footprint, etc.)"""
    __tablename__ = "reusable_content"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    content_key = Column(String(50), nullable=False)  # history, footprint, regions, culture
    title = Column(String(200))
    content = Column(JSON, nullable=False)
    version = Column(Integer, default=1)
    updated_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    brand = relationship("Brand", back_populates="content")


class Game(Base):
    """Games library for challenge slides"""
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))  # null = available to all
    title = Column(String(200), nullable=False)
    description = Column(Text)
    rules = Column(Text)
    duration_minutes = Column(Integer)
    min_players = Column(Integer)
    max_players = Column(Integer)
    game_type = Column(String(50), default="challenge")  # icebreaker, challenge
    value_label = Column(String(50))  # FAMILY, TEAMWORK, etc.
    tags = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    brand = relationship("Brand")


class Presentation(Base):
    """A generated presentation instance"""
    __tablename__ = "presentations"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    agenda_template_id = Column(Integer, ForeignKey("agenda_templates.id"))
    title = Column(String(200), nullable=False)
    status = Column(String(20), default="draft")  # draft, ready, presented
    config = Column(JSON)  # Store raffle_count, selected_game_ids, etc.
    created_by = Column(String(100))
    presented_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    brand = relationship("Brand", back_populates="presentations")
    facility = relationship("Facility", back_populates="presentations")
    agenda_template = relationship("AgendaTemplate")
    slides = relationship("PresentationSlide", back_populates="presentation", cascade="all, delete-orphan")


class PresentationSlide(Base):
    """Individual slide instance in a presentation"""
    __tablename__ = "presentation_slides"

    id = Column(Integer, primary_key=True, index=True)
    presentation_id = Column(Integer, ForeignKey("presentations.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, nullable=False)
    slide_type = Column(String(50), nullable=False)
    payload = Column(JSON)  # Slide-specific data
    notes = Column(Text)  # Speaker notes
    created_at = Column(DateTime, default=datetime.utcnow)

    presentation = relationship("Presentation", back_populates="slides")


# Database setup
DATABASE_URL = "sqlite:///./welcome_nights.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

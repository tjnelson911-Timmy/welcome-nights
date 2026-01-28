"""
Welcome Nights Presentation Slide Builder Service

This module provides a deterministic slide builder that generates
ordered slide instances from presentation configuration, agenda templates,
reusable content, and selected games.
"""

from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from . import models, crud


# Slide type constants
SLIDE_TYPES = {
    "WELCOME_INTRO": "WelcomeIntro",
    "RAFFLE_BUMPER": "RaffleBumper",
    "HISTORY_BLOCK": "HistoryBlock",
    "FOOTPRINT_BLOCK": "FootprintBlock",
    "REGIONS_BLOCK": "RegionsBlock",
    "CULTURE_BLOCK": "CultureBlock",
    "GAME_SLIDE": "GameSlide",
    "PILLARS_CLOSING": "PillarsClosing",
}


def build_slides(
    db: Session,
    presentation_id: int,
    config: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Build and save slide instances for a presentation.

    Args:
        db: Database session
        presentation_id: ID of the presentation
        config: Configuration dict containing:
            - raffle_count: Number of raffle slides to insert
            - selected_game_ids: List of game IDs to include
            - include_history: Whether to include history block
            - include_footprint: Whether to include footprint block
            - include_regions: Whether to include regions block
            - include_culture: Whether to include culture block

    Returns:
        List of slide dictionaries that were created
    """
    # Get the presentation with relationships
    presentation = crud.get_presentation(db, presentation_id)
    if not presentation:
        raise ValueError(f"Presentation {presentation_id} not found")

    # Get related data
    brand = crud.get_brand(db, presentation.brand_id)
    facility = crud.get_facility(db, presentation.facility_id)
    agenda_template = crud.get_agenda_template(db, presentation.agenda_template_id)

    if not all([brand, facility, agenda_template]):
        raise ValueError("Missing required presentation data")

    # Get reusable content for the brand
    reusable_content = {
        item.content_key: item
        for item in crud.get_content(db, brand.id)
    }

    # Get selected games
    selected_game_ids = config.get("selected_game_ids") or []
    games = []
    for gid in selected_game_ids:
        game = crud.get_game(db, gid)
        if game:
            games.append(game)

    # Build slides based on agenda template
    slides = generate_slide_order(
        agenda_template=agenda_template,
        brand=brand,
        facility=facility,
        reusable_content=reusable_content,
        games=games,
        raffle_count=config.get("raffle_count", 0),
        include_history=config.get("include_history", True),
        include_footprint=config.get("include_footprint", True),
        include_regions=config.get("include_regions", True),
        include_culture=config.get("include_culture", True),
    )

    # Clear existing slides and create new ones
    crud.clear_presentation_slides(db, presentation_id)
    crud.bulk_create_slides(db, presentation_id, slides)

    # Update presentation config
    presentation.config = config
    db.commit()

    return slides


def generate_slide_order(
    agenda_template: models.AgendaTemplate,
    brand: models.Brand,
    facility: models.Facility,
    reusable_content: Dict[str, models.ReusableContent],
    games: List[models.Game],
    raffle_count: int,
    include_history: bool,
    include_footprint: bool,
    include_regions: bool,
    include_culture: bool,
) -> List[Dict[str, Any]]:
    """
    Generate the ordered list of slides based on the agenda template.

    The slide_order in the template is a list of slide type strings like:
    ["WelcomeIntro", "IceBreaker", "RaffleBumper", "HistoryBlock", ...]
    """
    slides = []

    # Get slide order from template, or use default
    slide_order = agenda_template.slide_order or [
        "WelcomeIntro", "IceBreaker", "HistoryBlock", "FootprintBlock",
        "RegionsBlock", "CultureBlock", "ChallengeGame", "PillarsClosing"
    ]

    # Track which games have been used
    ice_breaker_games = [g for g in games if g.game_type == "icebreaker"]
    challenge_games = [g for g in games if g.game_type == "challenge"]
    challenge_index = 0

    for slide_type in slide_order:
        # Generate slide based on type
        if slide_type == "WelcomeIntro":
            slides.append(create_welcome_slide(brand, facility))

        elif slide_type == "IceBreaker":
            if ice_breaker_games:
                game = ice_breaker_games[0]
                slides.append(create_game_slide(game, brand, is_icebreaker=True))

        elif slide_type == "RaffleBumper":
            slides.append(create_raffle_slide(len(slides) + 1))

        elif slide_type == "HistoryBlock" and include_history:
            content = reusable_content.get("history")
            if content:
                slides.append(create_history_slide(content, brand))

        elif slide_type == "FootprintBlock" and include_footprint:
            content = reusable_content.get("footprint")
            if content:
                slides.append(create_footprint_slide(content, brand))

        elif slide_type == "RegionsBlock" and include_regions:
            content = reusable_content.get("regions")
            if content:
                slides.append(create_regions_slide(content, brand))

        elif slide_type == "CultureBlock" and include_culture:
            content = reusable_content.get("culture")
            if content:
                slides.append(create_culture_slide(content, brand))

        elif slide_type == "ChallengeGame":
            # Add next challenge game
            if challenge_index < len(challenge_games):
                slides.append(create_game_slide(challenge_games[challenge_index], brand, is_icebreaker=False))
                challenge_index += 1

        elif slide_type == "PillarsClosing":
            slides.append(create_pillars_slide(brand))

    # Re-number slides
    for idx, slide in enumerate(slides):
        slide["order"] = idx

    return slides


def get_default_slide_blocks() -> List[Dict[str, Any]]:
    """Return default slide block structure for Culture Night"""
    return [
        {"type": "welcome_intro", "required": True},
        {"type": "icebreaker", "required": False},
        {"type": "history", "required": False},
        {"type": "footprint", "required": False},
        {"type": "regions", "required": False},
        {"type": "culture", "required": False},
        {"type": "challenges", "required": False},
        {"type": "pillars_closing", "required": True},
    ]


def distribute_raffles(raffle_count: int, breakpoints: List[int], total_blocks: int) -> List[int]:
    """
    Distribute raffle slides across designated breakpoints.

    Args:
        raffle_count: Number of raffles to distribute
        breakpoints: List of block indices where raffles can be inserted
        total_blocks: Total number of blocks in the template

    Returns:
        List of block indices where raffles should be inserted (before)
    """
    if raffle_count <= 0 or not breakpoints:
        return []

    # Filter valid breakpoints
    valid_breakpoints = [bp for bp in breakpoints if bp < total_blocks]

    if not valid_breakpoints:
        return []

    # Distribute raffles evenly across breakpoints
    positions = []
    for i in range(min(raffle_count, len(valid_breakpoints))):
        positions.append(valid_breakpoints[i])

    return sorted(positions)


def create_welcome_slide(brand: models.Brand, facility: models.Facility) -> Dict[str, Any]:
    """Create welcome/intro slide"""
    return {
        "slide_type": SLIDE_TYPES["WELCOME_INTRO"],
        "payload": {
            "brand_name": brand.name,
            "brand_slug": brand.slug,
            "facility_name": facility.name,
            "facility_location": f"{facility.city}, {facility.state}" if facility.city else "",
            "primary_color": brand.primary_color,
            "secondary_color": brand.secondary_color,
            "logo_url": brand.logo_url,
        },
        "notes": "Welcome everyone to Culture Night!"
    }


def create_raffle_slide(position: int) -> Dict[str, Any]:
    """Create raffle bumper slide"""
    return {
        "slide_type": SLIDE_TYPES["RAFFLE_BUMPER"],
        "payload": {
            "title": "RAFFLE TIME!",
            "subtitle": "Time to draw a winner!",
            "position": position,
        },
        "notes": "Conduct raffle drawing"
    }


def create_history_slide(content: models.ReusableContent, brand: models.Brand) -> Dict[str, Any]:
    """Create history timeline slide"""
    return {
        "slide_type": SLIDE_TYPES["HISTORY_BLOCK"],
        "payload": {
            "title": content.title or "Our History",
            "content": content.content or {},
            "brand_name": brand.name,
            "primary_color": brand.primary_color,
        },
        "notes": "Walk through the company history and milestones"
    }


def create_footprint_slide(content: models.ReusableContent, brand: models.Brand) -> Dict[str, Any]:
    """Create footprint/stats slide"""
    return {
        "slide_type": SLIDE_TYPES["FOOTPRINT_BLOCK"],
        "payload": {
            "title": content.title or "Our Growing Footprint",
            "content": content.content or {},
            "brand_name": brand.name,
            "primary_color": brand.primary_color,
        },
        "notes": "Highlight company growth and statistics"
    }


def create_regions_slide(content: models.ReusableContent, brand: models.Brand) -> Dict[str, Any]:
    """Create regions map slide"""
    return {
        "slide_type": SLIDE_TYPES["REGIONS_BLOCK"],
        "payload": {
            "title": content.title or "Our Regions",
            "content": content.content or {},
            "brand_name": brand.name,
            "primary_color": brand.primary_color,
        },
        "notes": "Show map of regions and locations"
    }


def create_culture_slide(content: models.ReusableContent, brand: models.Brand) -> Dict[str, Any]:
    """Create culture block slide"""
    return {
        "slide_type": SLIDE_TYPES["CULTURE_BLOCK"],
        "payload": {
            "title": content.title or f"The {brand.name} Way",
            "content": content.content or {},
            "brand_name": brand.name,
            "primary_color": brand.primary_color,
        },
        "notes": "Explain the company culture and values - we are not corporate!"
    }


def create_game_slide(
    game: models.Game,
    brand: models.Brand,
    is_icebreaker: bool = False
) -> Dict[str, Any]:
    """Create game slide"""
    return {
        "slide_type": SLIDE_TYPES["GAME_SLIDE"],
        "payload": {
            "game_id": game.id,
            "title": game.title,
            "description": game.description,
            "rules": game.rules,
            "duration_minutes": game.duration_minutes,
            "value_label": game.value_label,
            "game_type": game.game_type,
            "is_icebreaker": is_icebreaker,
            "brand_name": brand.name,
            "primary_color": brand.primary_color,
        },
        "notes": f"Game: {game.title}" + (f" - {game.rules}" if game.rules else "")
    }


def create_pillars_slide(brand: models.Brand) -> Dict[str, Any]:
    """Create 3 pillars closing slide"""
    return {
        "slide_type": SLIDE_TYPES["PILLARS_CLOSING"],
        "payload": {
            "title": "Our 3 Pillars",
            "pillars": [
                {"name": "Clinical", "description": "Excellence in care"},
                {"name": "Cultural", "description": "Our people, our values"},
                {"name": "Financial", "description": "Sustainable success"},
            ],
            "brand_name": brand.name,
            "primary_color": brand.primary_color,
            "secondary_color": brand.secondary_color,
        },
        "notes": "Close with the 3 pillars: Clinical, Cultural, Financial"
    }


def get_slide_type_display_name(slide_type: str) -> str:
    """Get human-readable display name for a slide type"""
    display_names = {
        "WelcomeIntro": "Welcome & Introduction",
        "RaffleBumper": "Raffle",
        "HistoryBlock": "History Timeline",
        "FootprintBlock": "Our Footprint",
        "RegionsBlock": "Regions Map",
        "CultureBlock": "Culture & Values",
        "GameSlide": "Game / Activity",
        "PillarsClosing": "3 Pillars Closing",
    }
    return display_names.get(slide_type, slide_type)

"""
Welcome Nights Presentation Slide Builder Service

This module generates slides matching the AV3 Culture Night template structure.
The AV3 template has 25 slides with a specific order that we replicate here.
"""

from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from . import models, crud


# AV3 Template slide types in order
AV3_SLIDE_TYPES = [
    "TitleSlide",           # 1. Logo/title
    "WelcomeSlide",         # 2. Welcome to Culture Night
    "IcebreakerGame",       # 3. Musical Chairs (or other icebreaker)
    "HistoryIntro",         # 4. History intro image
    "HistoryTimeline",      # 5. The Cascadia Family timeline
    "FootprintStats",       # 6. Our Growing Footprint
    "RegionsMap",           # 7. 5 Healthcare Company Regions
    "CultureIntro",         # 8. We are NOT corporate!
    "CultureComparison",    # 9. Common Way vs Cascadia Way
    "FieldIntro",           # 10. Field/transition
    "RaffleBumper",         # 11. RAFFLE
    "TransitionSlide",      # 12. Transition
    "ValueFamily",          # 13. FAMILY
    "ChallengeGame",        # 14. Challenge 1: Cookie
    "ValueOwnership",       # 15. OWNERSHIP
    "ChallengeGame",        # 16. Challenge 2: Cup Stacking
    "ValueResponsibility",  # 17. RESPONSIBILITY
    "ChallengeGame",        # 18. Challenge 3: Marshmallows
    "ValueCelebration",     # 19. CELEBRATION
    "ChallengeGame",        # 20. Challenge 4: Pencils
    "ValueExperience",      # 21. EXPERIENCE
    "ChallengeGame",        # 22. Challenge 5: Flip Cup
    "ThreePillars",         # 23. 3 Pillars
    "RaffleBumper",         # 24. RAFFLE
    "EndSlide",             # 25. End/logo
]

# Default games for each challenge slot
DEFAULT_CHALLENGES = [
    {"title": "Cookie", "value": "FAMILY", "rules": "Place cookie on forehead, move it to mouth without hands"},
    {"title": "Cup Stacking", "value": "OWNERSHIP", "rules": "Stack cups into pyramid, then back down"},
    {"title": "Marshmallows", "value": "RESPONSIBILITY", "rules": "Move marshmallows with chopsticks"},
    {"title": "Pencils", "value": "CELEBRATION", "rules": "Balance pencils on back of hands"},
    {"title": "Flip Cup", "value": "EXPERIENCE", "rules": "Drink and flip cup upside down"},
]

# Core values in order
CORE_VALUES = ["FAMILY", "OWNERSHIP", "RESPONSIBILITY", "CELEBRATION", "EXPERIENCE"]


def build_slides(
    db: Session,
    presentation_id: int,
    config: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Build slides matching the AV3 template structure.

    Config options:
        - raffle_count: Number of raffle slides (default 2, placed at positions 11 and 24)
        - selected_game_ids: List of game IDs to use for challenges
        - icebreaker_game_id: Game ID for the icebreaker slot
    """
    presentation = crud.get_presentation(db, presentation_id)
    if not presentation:
        raise ValueError(f"Presentation {presentation_id} not found")

    brand = crud.get_brand(db, presentation.brand_id)
    facility = crud.get_facility(db, presentation.facility_id)

    if not brand or not facility:
        raise ValueError("Missing brand or facility data")

    # Get facility logo
    facility_logo = None
    assets = crud.get_assets(db, brand_id=brand.id, asset_type="logo")
    for asset in assets:
        if asset.facility_id == facility.id:
            facility_logo = asset.url
            break

    # Get selected games
    selected_game_ids = config.get("selected_game_ids") or []
    games = []
    for gid in selected_game_ids:
        game = crud.get_game(db, gid)
        if game:
            games.append(game)

    # Get icebreaker game
    icebreaker_game_id = config.get("icebreaker_game_id")
    icebreaker_game = None
    if icebreaker_game_id:
        icebreaker_game = crud.get_game(db, icebreaker_game_id)

    # Build slides following AV3 structure
    slides = generate_av3_slides(
        brand=brand,
        facility=facility,
        facility_logo=facility_logo,
        icebreaker_game=icebreaker_game,
        challenge_games=games,
        raffle_count=config.get("raffle_count", 2),
    )

    # Clear existing slides and create new ones
    crud.clear_presentation_slides(db, presentation_id)
    crud.bulk_create_slides(db, presentation_id, slides)

    # Update presentation config
    presentation.config = config
    db.commit()

    return slides


def generate_av3_slides(
    brand: models.Brand,
    facility: models.Facility,
    facility_logo: Optional[str],
    icebreaker_game: Optional[models.Game],
    challenge_games: List[models.Game],
    raffle_count: int = 2,
) -> List[Dict[str, Any]]:
    """
    Generate slides matching the exact AV3 template structure.
    """
    slides = []
    challenge_index = 0

    primary_color = brand.primary_color or "#0b7280"

    # 1. Title Slide
    slides.append({
        "order": 0,
        "slide_type": "TitleSlide",
        "payload": {
            "brand_name": brand.name,
            "facility_name": facility.name,
            "logo_url": facility_logo or brand.logo_url,
        },
        "notes": "Title slide with facility logo"
    })

    # 2. Welcome Slide
    slides.append({
        "order": 1,
        "slide_type": "WelcomeSlide",
        "payload": {
            "title": "Welcome to Culture Night!!!",
            "bullets": [
                f"We are excited to introduce {brand.name} to you all!",
                "Help yourself to food and drinks!",
                "We want this to be fun!!!",
                "We have raffles and games with prizes, so be ready to participate!",
            ],
            "primary_color": primary_color,
        },
        "notes": "Welcome everyone to Culture Night"
    })

    # 3. Icebreaker Game
    if icebreaker_game:
        slides.append({
            "order": 2,
            "slide_type": "IcebreakerGame",
            "payload": {
                "title": f"Let's break the ice…Game 1: {icebreaker_game.title}",
                "game_title": icebreaker_game.title,
                "rules": icebreaker_game.rules,
                "primary_color": primary_color,
            },
            "notes": f"Icebreaker: {icebreaker_game.title}"
        })
    else:
        slides.append({
            "order": 2,
            "slide_type": "IcebreakerGame",
            "payload": {
                "title": "Let's break the ice…Game 1: Musical Chairs",
                "game_title": "Musical Chairs",
                "rules": "5 Players\nMusic plays, players walk\nMusic stops, players sit\nPlayer without a chair is eliminated\nLast player with a seat wins",
                "primary_color": primary_color,
            },
            "notes": "Icebreaker: Musical Chairs"
        })

    # 4. History Intro (image slide)
    slides.append({
        "order": 3,
        "slide_type": "HistoryIntro",
        "payload": {
            "brand_name": brand.name,
        },
        "notes": "History intro image"
    })

    # 5. History Timeline
    slides.append({
        "order": 4,
        "slide_type": "HistoryTimeline",
        "payload": {
            "title": f"The {brand.name} \"Family\"",
            "events": [
                {"date": "March 2015", "text": "Company founded"},
                {"date": "October 2021", "text": "Expansion began"},
                {"date": "December 2025", "text": "Continued growth"},
            ],
            "primary_color": primary_color,
        },
        "notes": "Company history timeline"
    })

    # 6. Footprint Stats
    slides.append({
        "order": 5,
        "slide_type": "FootprintStats",
        "payload": {
            "title": "OUR GROWING FOOTPRINT",
            "stats": [
                {"value": "65+", "label": "Facilities"},
                {"value": "5", "label": "States"},
                {"value": "5,000+", "label": "Team Members"},
            ],
            "primary_color": primary_color,
        },
        "notes": "Company footprint statistics"
    })

    # 7. Regions Map
    slides.append({
        "order": 6,
        "slide_type": "RegionsMap",
        "payload": {
            "title": "5 Healthcare Company Regions",
            "regions": [
                {"name": "prior_lake", "label": "Prior Lake"},
                {"name": "portland", "label": "Portland"},
                {"name": "olympia", "label": "Olympia"},
                {"name": "boise", "label": "Boise"},
                {"name": "denver", "label": "Denver"},
            ],
            "primary_color": primary_color,
        },
        "notes": "Regional map"
    })

    # 8. Culture Intro - NOT Corporate
    slides.append({
        "order": 7,
        "slide_type": "CultureIntro",
        "payload": {
            "title": "WE ARE NOT CORPORATE!",
            "subtitle": f"The {brand.name} Way…",
            "primary_color": primary_color,
        },
        "notes": "Culture intro - we are not corporate"
    })

    # 9. Culture Comparison
    slides.append({
        "order": 8,
        "slide_type": "CultureComparison",
        "payload": {
            "left_title": "The Common Way…",
            "right_title": f"The {brand.name} Way…",
            "comparisons": [
                {"common": "Technically we can't do that…", "ours": "Let's figure it out together!"},
                {"common": "It's not my job.", "ours": "We are all part of the same team!"},
                {"common": "That's above my pay grade.", "ours": "Let me connect you with someone who can help!"},
            ],
            "primary_color": primary_color,
        },
        "notes": "Common way vs our way comparison"
    })

    # 10. Field Intro
    slides.append({
        "order": 9,
        "slide_type": "FieldIntro",
        "payload": {
            "title": "Field",
            "primary_color": primary_color,
        },
        "notes": "Field intro transition"
    })

    # 11. Raffle #1
    if raffle_count >= 1:
        slides.append({
            "order": 10,
            "slide_type": "RaffleBumper",
            "payload": {
                "title": "RAFFLE",
                "subtitle": "Time to draw a winner!",
                "raffle_number": 1,
            },
            "notes": "Raffle #1"
        })

    # 12. Transition
    slides.append({
        "order": 11,
        "slide_type": "TransitionSlide",
        "payload": {},
        "notes": "Transition slide"
    })

    # 13-22. Values and Challenges (5 pairs)
    for i, value in enumerate(CORE_VALUES):
        # Value slide
        slides.append({
            "order": len(slides),
            "slide_type": f"Value{value.title()}",
            "payload": {
                "value": value,
                "primary_color": primary_color,
            },
            "notes": f"Value: {value}"
        })

        # Challenge slide
        if challenge_index < len(challenge_games):
            game = challenge_games[challenge_index]
            slides.append({
                "order": len(slides),
                "slide_type": "ChallengeGame",
                "payload": {
                    "title": f"Challenge {i+1}: {game.title}",
                    "game_title": game.title,
                    "rules": game.rules,
                    "value": value,
                    "challenge_number": i + 1,
                    "primary_color": primary_color,
                },
                "notes": f"Challenge {i+1}: {game.title}"
            })
            challenge_index += 1
        else:
            # Use default challenge
            default = DEFAULT_CHALLENGES[i]
            slides.append({
                "order": len(slides),
                "slide_type": "ChallengeGame",
                "payload": {
                    "title": f"Challenge {i+1}: {default['title']}",
                    "game_title": default["title"],
                    "rules": default["rules"],
                    "value": value,
                    "challenge_number": i + 1,
                    "primary_color": primary_color,
                },
                "notes": f"Challenge {i+1}: {default['title']}"
            })

    # 23. Three Pillars
    slides.append({
        "order": len(slides),
        "slide_type": "ThreePillars",
        "payload": {
            "title": "3 Pillars",
            "pillars": [
                {"name": "Clinical", "description": "Excellence in patient care"},
                {"name": "Cultural", "description": "Our people and values"},
                {"name": "Financial", "description": "Sustainable success"},
            ],
            "primary_color": primary_color,
        },
        "notes": "Three pillars closing"
    })

    # 24. Raffle #2
    if raffle_count >= 2:
        slides.append({
            "order": len(slides),
            "slide_type": "RaffleBumper",
            "payload": {
                "title": "RAFFLE",
                "subtitle": "Time to draw another winner!",
                "raffle_number": 2,
            },
            "notes": "Raffle #2"
        })

    # 25. End Slide
    slides.append({
        "order": len(slides),
        "slide_type": "EndSlide",
        "payload": {
            "brand_name": brand.name,
            "facility_name": facility.name,
            "logo_url": facility_logo or brand.logo_url,
        },
        "notes": "End slide with logo"
    })

    return slides


def get_slide_type_display_name(slide_type: str) -> str:
    """Get human-readable display name for a slide type"""
    display_names = {
        "TitleSlide": "Title",
        "WelcomeSlide": "Welcome",
        "IcebreakerGame": "Icebreaker Game",
        "HistoryIntro": "History Intro",
        "HistoryTimeline": "History Timeline",
        "FootprintStats": "Our Footprint",
        "RegionsMap": "Regions",
        "CultureIntro": "Culture Intro",
        "CultureComparison": "Culture Comparison",
        "FieldIntro": "Field",
        "RaffleBumper": "Raffle",
        "TransitionSlide": "Transition",
        "ValueFamily": "FAMILY",
        "ValueOwnership": "OWNERSHIP",
        "ValueResponsibility": "RESPONSIBILITY",
        "ValueCelebration": "CELEBRATION",
        "ValueExperience": "EXPERIENCE",
        "ChallengeGame": "Challenge Game",
        "ThreePillars": "3 Pillars",
        "EndSlide": "End",
    }
    return display_names.get(slide_type, slide_type)

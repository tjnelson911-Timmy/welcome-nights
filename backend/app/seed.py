"""
Seed data for Welcome Nights
"""

from .models import SessionLocal, init_db, Brand, Facility, Game, AgendaTemplate, ReusableContent


def seed_database():
    init_db()
    db = SessionLocal()

    # Check if already seeded
    if db.query(Brand).count() > 0:
        print("Database already seeded")
        db.close()
        return

    # Brands
    cascadia = Brand(
        name="Cascadia Healthcare",
        slug="cascadia",
        primary_color="#0b7280",
        secondary_color="#065a67",
        font_family="Inter"
    )
    olympus = Brand(
        name="Olympus Retirement Living",
        slug="olympus",
        primary_color="#1e40af",
        secondary_color="#1e3a8a",
        font_family="Inter"
    )
    db.add_all([cascadia, olympus])
    db.commit()

    # Sample Facilities
    facilities = [
        Facility(brand_id=cascadia.id, name="Cascadia Care Center", city="Portland", state="OR"),
        Facility(brand_id=cascadia.id, name="Mountain View SNF", city="Seattle", state="WA"),
        Facility(brand_id=cascadia.id, name="Evergreen Health & Rehab", city="Boise", state="ID"),
        Facility(brand_id=olympus.id, name="Olympus Heights", city="San Diego", state="CA"),
        Facility(brand_id=olympus.id, name="Summit Senior Living", city="Phoenix", state="AZ"),
    ]
    db.add_all(facilities)
    db.commit()

    # Games
    games = [
        Game(
            title="Musical Chairs",
            description="Classic ice breaker game",
            rules="1. Set up chairs in a circle\\n2. Play music while players walk around\\n3. When music stops, everyone sits\\n4. Player without a chair is out\\n5. Last person wins!",
            duration_minutes=15,
            game_type="icebreaker",
            value_label="TEAMWORK"
        ),
        Game(
            title="Cookie Face",
            description="Move a cookie from forehead to mouth using only facial muscles",
            rules="1. Place a cookie on your forehead\\n2. Move it to your mouth using facial muscles only\\n3. No hands allowed!\\n4. First to eat wins!",
            duration_minutes=5,
            game_type="challenge",
            value_label="FAMILY"
        ),
        Game(
            title="Cup Stacking",
            description="Stack and unstack cups in a pyramid",
            rules="1. Build a pyramid (3-2-1 formation)\\n2. Collapse back to single stack\\n3. Fastest time wins!",
            duration_minutes=5,
            game_type="challenge",
            value_label="EXCELLENCE"
        ),
        Game(
            title="Flip Cup",
            description="Team relay race flipping cups",
            rules="1. Teams line up on opposite sides\\n2. First player drinks and flips cup\\n3. Cup must land upside down\\n4. First team to finish wins!",
            duration_minutes=10,
            game_type="challenge",
            value_label="TEAMWORK"
        ),
    ]
    db.add_all(games)
    db.commit()

    # Agenda Templates
    templates = [
        AgendaTemplate(
            name="Standard Culture Night",
            description="Full culture night with all segments",
            slide_order=[
                "WelcomeIntro", "IceBreaker", "RaffleBumper",
                "HistoryBlock", "FootprintBlock", "RaffleBumper",
                "RegionsBlock", "CultureBlock", "RaffleBumper",
                "ChallengeGame", "PillarsClosing"
            ],
            is_default=True
        ),
        AgendaTemplate(
            name="Quick Culture Night",
            description="Shortened version",
            slide_order=[
                "WelcomeIntro", "IceBreaker",
                "HistoryBlock", "CultureBlock", "RaffleBumper",
                "PillarsClosing"
            ]
        ),
    ]
    db.add_all(templates)
    db.commit()

    # Reusable Content - Cascadia
    cascadia_content = [
        ReusableContent(
            brand_id=cascadia.id,
            content_key="history",
            title="Our History",
            content={
                "items": [
                    {"year": "1995", "text": "Founded in Portland, Oregon"},
                    {"year": "2005", "text": "Expanded to Washington state"},
                    {"year": "2015", "text": "Reached 50 facilities milestone"},
                    {"year": "2023", "text": "Serving communities across the Northwest"}
                ]
            }
        ),
        ReusableContent(
            brand_id=cascadia.id,
            content_key="footprint",
            title="Our Growing Footprint",
            content={
                "stats": [
                    {"value": "75+", "label": "Facilities"},
                    {"value": "5,000+", "label": "Team Members"},
                    {"value": "10,000+", "label": "Residents Served"},
                    {"value": "5", "label": "States"}
                ]
            }
        ),
        ReusableContent(
            brand_id=cascadia.id,
            content_key="regions",
            title="Our Regions",
            content={
                "regions": [
                    {"name": "Pacific Northwest", "facilities": 35},
                    {"name": "Mountain West", "facilities": 20},
                    {"name": "Southwest", "facilities": 15},
                    {"name": "California", "facilities": 10}
                ]
            }
        ),
        ReusableContent(
            brand_id=cascadia.id,
            content_key="culture",
            title="The Cascadia Way",
            content={
                "subtitle": "We are NOT corporate",
                "comparisons": [
                    {"cascadia": "Family First", "common": "Profits First"},
                    {"cascadia": "Empower Teams", "common": "Micromanage"},
                    {"cascadia": "Celebrate Wins", "common": "Focus on Problems"},
                    {"cascadia": "Grow Together", "common": "Individual Competition"}
                ]
            }
        ),
    ]
    db.add_all(cascadia_content)

    # Reusable Content - Olympus
    olympus_content = [
        ReusableContent(
            brand_id=olympus.id,
            content_key="history",
            title="Our History",
            content={
                "items": [
                    {"year": "2000", "text": "Founded in San Diego"},
                    {"year": "2010", "text": "Expanded throughout California"},
                    {"year": "2020", "text": "Reached 30 communities"},
                    {"year": "2023", "text": "Premier retirement living provider"}
                ]
            }
        ),
        ReusableContent(
            brand_id=olympus.id,
            content_key="footprint",
            title="Our Growing Footprint",
            content={
                "stats": [
                    {"value": "40+", "label": "Communities"},
                    {"value": "2,500+", "label": "Team Members"},
                    {"value": "5,000+", "label": "Residents"},
                    {"value": "3", "label": "States"}
                ]
            }
        ),
        ReusableContent(
            brand_id=olympus.id,
            content_key="regions",
            title="Our Regions",
            content={
                "regions": [
                    {"name": "Southern California", "facilities": 20},
                    {"name": "Northern California", "facilities": 12},
                    {"name": "Arizona", "facilities": 8}
                ]
            }
        ),
        ReusableContent(
            brand_id=olympus.id,
            content_key="culture",
            title="The Olympus Way",
            content={
                "subtitle": "Excellence in Senior Living",
                "comparisons": [
                    {"olympus": "Resident-Centered", "common": "Process-Centered"},
                    {"olympus": "Innovation", "common": "Status Quo"},
                    {"olympus": "Community", "common": "Isolation"},
                    {"olympus": "Dignity", "common": "Routine"}
                ]
            }
        ),
    ]
    db.add_all(olympus_content)
    db.commit()

    print("Database seeded successfully!")
    print(f"  - {db.query(Brand).count()} brands")
    print(f"  - {db.query(Facility).count()} facilities")
    print(f"  - {db.query(Game).count()} games")
    print(f"  - {db.query(AgendaTemplate).count()} templates")
    print(f"  - {db.query(ReusableContent).count()} content blocks")

    db.close()


if __name__ == "__main__":
    seed_database()

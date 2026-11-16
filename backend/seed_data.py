import uuid
from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.tournament import TournamentSettings
from app.models.team import Team, TeamPlayer
from app.models.match import Match, MatchInnings, MatchStatus
from app.models.scorecard import BattingScorecard, BowlingScorecard
from app.models.scoring import BallEvent

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("🌱 Seeding Bairajeshwar Premier League (BPL) data...")

        # 1. Super Admin
        admin = db.query(User).filter(User.email == "admin@bpl.com").first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                user_id="BPL000",
                username="Tournament Director",
                email="admin@bpl.com",
                role=UserRole.SUPER_ADMIN.value,
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("  ✓ Created Super Admin (admin@bpl.com / BPL000)")

        # 2. Tournament Settings
        settings_obj = db.query(TournamentSettings).first()
        if not settings_obj:
            settings_obj = TournamentSettings(
                tournament_name="BAIRAJESHWAR PREMIER LEAGUE (BPL)",
                banner_url="/images/bpl_banner.png",
                logo_url="/images/bpl_logo.png",
                total_teams=8,
                overs_per_match=10,
                points_win=2,
                points_tie=1,
                points_no_result=1,
                status="LIVE"
            )
            db.add(settings_obj)
            db.commit()
            print("  ✓ Created Tournament Settings")

        # 3. Eight Residential Teams with Authentic Names and Colors
        team_definitions = [
            {"name": "Bairajeshwar Royals", "short_code": "BROYALS", "primary": "#047857", "secondary": "#fbbf24"},
            {"name": "Wing-A Warriors", "short_code": "WAWAR", "primary": "#1e3a8a", "secondary": "#60a5fa"},
            {"name": "Tower Titans", "short_code": "TTITANS", "primary": "#b91c1c", "secondary": "#f87171"},
            {"name": "Penthouse Panthers", "short_code": "PPANTH", "primary": "#4c1d95", "secondary": "#c084fc"},
            {"name": "Podium Strikers", "short_code": "PSTRIKE", "primary": "#0f766e", "secondary": "#2dd4bf"},
            {"name": "Clubhouse Blasters", "short_code": "CBLAST", "primary": "#c2410c", "secondary": "#fb923c"},
            {"name": "Garden Gladiators", "short_code": "GGLAD", "primary": "#15803d", "secondary": "#86efac"},
            {"name": "Terrace Thunders", "short_code": "TTHUND", "primary": "#374151", "secondary": "#9ca3af"},
        ]

        # 4. Create 32 Registered Residential Users
        players_pool = [
            ("Aarav Mehta", "aarav@gmail.com"),
            ("Rohan Sharma", "rohan@gmail.com"),
            ("Vikram Patel", "vikram@gmail.com"),
            ("Aditya Verma", "aditya@gmail.com"),
            ("Kabir Singh", "kabir@gmail.com"),
            ("Yash Desai", "yash@gmail.com"),
            ("Varun Joshi", "varun@gmail.com"),
            ("Pranav Kulkarni", "pranav@gmail.com"),
            ("Siddharth Nair", "siddharth@gmail.com"),
            ("Ishaan Kapoor", "ishaan@gmail.com"),
            ("Arjun Reddy", "arjun@gmail.com"),
            ("Tanmay Shah", "tanmay@gmail.com"),
            ("Nikhil Rao", "nikhil@gmail.com"),
            ("Devansh Gupta", "devansh@gmail.com"),
            ("Karan Malhotra", "karan@gmail.com"),
            ("Rishi Bhatt", "rishi@gmail.com"),
            ("Dhruv Saxena", "dhruv@gmail.com"),
            ("Kunal Singhania", "kunal@gmail.com"),
            ("Harsh Vardhan", "harsh@gmail.com"),
            ("Sameer Sen", "sameer@gmail.com"),
            ("Aniket Deshmukh", "aniket@gmail.com"),
            ("Raghav Chawla", "raghav@gmail.com"),
            ("Manish Tiwari", "manish@gmail.com"),
            ("Gaurav Bansal", "gaurav@gmail.com"),
            ("Akash Chopra", "akash@gmail.com"),
            ("Chirag Agarwal", "chirag@gmail.com"),
            ("Mayank Jain", "mayank@gmail.com"),
            ("Sourabh Dubey", "sourabh@gmail.com"),
            ("Deepak Mishra", "deepak@gmail.com"),
            ("Hemant Rawat", "hemant@gmail.com"),
            ("Pooja Hegde", "pooja@gmail.com"),
            ("Ananya Roy", "ananya@gmail.com"),
        ]

        created_users = []
        for i, (p_name, p_email) in enumerate(players_pool, 1):
            user = db.query(User).filter(User.email == p_email).first()
            if not user:
                user = User(
                    id=str(uuid.uuid4()),
                    user_id=f"BPL{i:03d}",
                    username=p_name,
                    email=p_email,
                    role=UserRole.USER.value,
                    is_active=True
                )
                db.add(user)
                db.commit()
            created_users.append(user)

        print(f"  ✓ Seeded {len(created_users)} registered building players with unique BPL IDs (BPL001 to BPL032)")

        # Create the 8 Teams & Assign Captains and 4 players each
        created_teams = []
        for t_idx, t_def in enumerate(team_definitions):
            team = db.query(Team).filter(Team.name == t_def["name"]).first()
            if not team:
                team = Team(
                    id=str(uuid.uuid4()),
                    name=t_def["name"],
                    short_code=t_def["short_code"],
                    primary_color=t_def["primary"],
                    secondary_color=t_def["secondary"]
                )
                db.add(team)
                db.commit()

            # Assign 4 players to each team
            assigned_players = created_users[t_idx * 4 : (t_idx + 1) * 4]
            captain = assigned_players[0]
            team.captain_id = captain.id
            captain.role = UserRole.CAPTAIN.value

            for p_order, p in enumerate(assigned_players):
                existing_tp = db.query(TeamPlayer).filter(
                    TeamPlayer.team_id == team.id,
                    TeamPlayer.user_id == p.id
                ).first()
                if not existing_tp:
                    tp = TeamPlayer(
                        id=str(uuid.uuid4()),
                        team_id=team.id,
                        user_id=p.id,
                        player_role="ALL_ROUNDER" if p_order % 2 == 0 else ("BATSMAN" if p_order == 1 else "BOWLER"),
                        jersey_number=7 if p_order == 0 else (p_order * 11),
                        is_captain=(p.id == captain.id)
                    )
                    db.add(tp)

            db.commit()
            created_teams.append(team)

        print("  ✓ Created 8 residential teams and squads")

        # 5. Create Fixtures
        # Match 1: Completed Match (Royals vs Titans)
        m1 = db.query(Match).filter(Match.match_number == "M01").first()
        if not m1:
            m1 = Match(
                id=str(uuid.uuid4()),
                match_number="M01",
                description="Inaugural Derby: Bairajeshwar Royals vs Tower Titans",
                team_a_id=created_teams[0].id,
                team_b_id=created_teams[2].id,
                venue="Bairajeshwar Cricket Ground (Turf 1)",
                match_date=datetime.utcnow() - timedelta(days=1),
                overs_per_innings=10,
                status=MatchStatus.COMPLETED.value,
                toss_winner_id=created_teams[0].id,
                toss_decision="BAT",
                winner_id=created_teams[0].id,
                win_margin="Bairajeshwar Royals won by 18 runs"
            )
            db.add(m1)
            db.commit()

            # Add completed innings for Match 1
            inn1 = MatchInnings(
                id=str(uuid.uuid4()),
                match_id=m1.id,
                innings_number=1,
                batting_team_id=created_teams[0].id,
                bowling_team_id=created_teams[2].id,
                total_runs=96,
                wickets=4,
                legal_balls_bowled=60,
                is_completed=True
            )
            db.add(inn1)
            
            inn2 = MatchInnings(
                id=str(uuid.uuid4()),
                match_id=m1.id,
                innings_number=2,
                batting_team_id=created_teams[2].id,
                bowling_team_id=created_teams[0].id,
                total_runs=78,
                wickets=7,
                legal_balls_bowled=60,
                is_completed=True
            )
            db.add(inn2)

            # Scorecard sample stats for player leaderboards
            db.add(BattingScorecard(
                id=str(uuid.uuid4()),
                innings_id=inn1.id,
                batsman_id=created_users[0].id, # Aarav Mehta
                runs=58,
                balls_faced=32,
                fours=6,
                sixes=3,
                strike_rate=181.25,
                is_out=False
            ))
            db.add(BowlingScorecard(
                id=str(uuid.uuid4()),
                innings_id=inn2.id,
                bowler_id=created_users[1].id, # Rohan Sharma
                legal_balls=18,
                overs_bowled=3.0,
                maidens=0,
                runs_conceded=19,
                wickets=3,
                economy_rate=6.33
            ))
            db.commit()

        # Match 2: LIVE Match (Warriors vs Panthers)
        m2 = db.query(Match).filter(Match.match_number == "M02").first()
        if not m2:
            m2 = Match(
                id=str(uuid.uuid4()),
                match_number="M02",
                description="Clash of the Wings: Wing-A Warriors vs Penthouse Panthers",
                team_a_id=created_teams[1].id,
                team_b_id=created_teams[3].id,
                venue="Bairajeshwar Cricket Ground (Turf 1)",
                match_date=datetime.utcnow(),
                overs_per_innings=10,
                status=MatchStatus.LIVE.value,
                toss_winner_id=created_teams[1].id,
                toss_decision="BAT",
                current_innings_number=1
            )
            db.add(m2)
            db.commit()

            live_inn = MatchInnings(
                id=str(uuid.uuid4()),
                match_id=m2.id,
                innings_number=1,
                batting_team_id=created_teams[1].id,
                bowling_team_id=created_teams[3].id,
                total_runs=42,
                wickets=1,
                legal_balls_bowled=28, # 4.4 overs
                current_striker_id=created_users[4].id, # Kabir Singh
                current_non_striker_id=created_users[5].id, # Yash Desai
                current_bowler_id=created_users[12].id, # Nikhil Rao
                is_completed=False
            )
            db.add(live_inn)
            db.commit()

            # Active striker scorecard
            db.add(BattingScorecard(
                id=str(uuid.uuid4()),
                innings_id=live_inn.id,
                batsman_id=created_users[4].id,
                runs=26,
                balls_faced=16,
                fours=3,
                sixes=1,
                strike_rate=162.5
            ))
            # Active non-striker scorecard
            db.add(BattingScorecard(
                id=str(uuid.uuid4()),
                innings_id=live_inn.id,
                batsman_id=created_users[5].id,
                runs=14,
                balls_faced=11,
                fours=1,
                sixes=1,
                strike_rate=127.27
            ))
            # Active bowler scorecard
            db.add(BowlingScorecard(
                id=str(uuid.uuid4()),
                innings_id=live_inn.id,
                bowler_id=created_users[12].id,
                legal_balls=10,
                overs_bowled=1.4,
                runs_conceded=16,
                wickets=1,
                economy_rate=9.60
            ))
            # Seed a recent ball event with snapshot
            db.add(BallEvent(
                id=str(uuid.uuid4()),
                innings_id=live_inn.id,
                ball_sequence=1,
                over_number=4,
                ball_in_over=4,
                bowler_id=created_users[12].id,
                striker_id=created_users[4].id,
                non_striker_id=created_users[5].id,
                runs_scored=4,
                extra_type="NONE",
                extra_runs=0,
                total_ball_runs=4,
                is_legal_delivery=True,
                is_wicket=False,
                commentary="FOUR! Kabir Singh drills it through extra cover for a cracking boundary!"
            ))
            db.commit()

        # Match 3: UPCOMING Match
        m3 = db.query(Match).filter(Match.match_number == "M03").first()
        if not m3:
            m3 = Match(
                id=str(uuid.uuid4()),
                match_number="M03",
                description="Weekend Special: Podium Strikers vs Clubhouse Blasters",
                team_a_id=created_teams[4].id,
                team_b_id=created_teams[5].id,
                venue="Bairajeshwar Cricket Ground (Turf 1)",
                match_date=datetime.utcnow() + timedelta(hours=6),
                overs_per_innings=10,
                status=MatchStatus.UPCOMING.value
            )
            db.add(m3)
            db.commit()

        print("  ✓ Created realistic fixtures: 1 Completed, 1 LIVE, 1 Upcoming")
        print("🎉 Database seeding complete!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()

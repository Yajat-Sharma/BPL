# BAIRAJESHWAR PREMIER LEAGUE (BPL) - COMPLETE SYSTEM SETUP

A production-quality live cricket scoring and tournament broadcasting web platform exclusively built for Bairajeshwar residential cricket tournament.

---

## 🏏 Platform Highlights

- **Visual Brand Language**: Custom Emerald Green (`#047857`), Forest Pitch Green (`#064e3b`), Golden Yellow (`#fbbf24`), and Charcoal (`#0f172a`) design inspired by the official tournament identity.
- **Unique Resident User IDs**: Deterministic sequential IDs generated on OTP verification (e.g. `BPL001`, `BPL002`, `BPL003`...).
- **Role-Based Access Control**:
  - `SUPER_ADMIN`: Complete control over live scoring, undoing mistakes, team creation, squad assignment by User ID, scheduling, and rules.
  - `CAPTAIN`: Access to their squad rosters, fixtures and team performance.
  - `USER`: Watch live ball-by-ball updates, browse fixtures, inspect points standings and player leaderboards.
- **Real-Time Cricket Scoring Engine**:
  - Legal vs. illegal deliveries (`WIDE`, `NO_BALL`, `BYE`, `LEG_BYE`).
  - Automatic strike rotation on odd runs (1, 3, 5).
  - Over completion and bowler change triggers.
  - Wicket dismissal types (Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket).
  - Target run calculation, Current Run Rate (CRR) and Required Run Rate (RRR).
  - **Deterministic State Snapshotting with Instant UNDO**: Single-click rollback of any delivery restoring exact prior runs, overs, batsmen on crease, and bowler figures.
- **Real-Time WebSockets**: Match channels broadcasting ball-by-ball commentary and score changes without page refreshes.
- **Automated Points Table & Player Stats**: Dynamic Net Run Rate (NRR) computation, Orange Cap (most runs), and Purple Cap (most wickets) leaderboards.

---

## 🚀 Quick Start Guide

### 1. Start the FastAPI Backend

```powershell
cd backend
$env:PYTHONPATH = "backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Default Super Admin: `admin@bpl.com` (OTP bypass code in development: `999999`)

### 2. Start the Next.js Frontend

```powershell
cd frontend
npm run dev
```

- Public Application: [http://localhost:3000](http://localhost:3000)
- Live Match Center: [http://localhost:3000/live](http://localhost:3000/live)
- Admin Portal: [http://localhost:3000/admin](http://localhost:3000/admin)
- Points Standings: [http://localhost:3000/points-table](http://localhost:3000/points-table)
- Cap Leaderboards: [http://localhost:3000/stats](http://localhost:3000/stats)

---

## 👥 Seeded 8 Residential Teams

1. **Bairajeshwar Royals** (`BROYALS`)
2. **Wing-A Warriors** (`WAWAR`)
3. **Tower Titans** (`TTITANS`)
4. **Penthouse Panthers** (`PPANTH`)
5. **Podium Strikers** (`PSTRIKE`)
6. **Clubhouse Blasters** (`CBLAST`)
7. **Garden Gladiators** (`GGLAD`)
8. **Terrace Thunders** (`TTHUND`)

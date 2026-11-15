# IMPLEMENTATION ROADMAP: BAIRAJESHWAR PREMIER LEAGUE (BPL)

## 1. Phased Development Roadmap

The development of the platform is divided into 9 independent, verifiable phases aligned with the confirmed BPL ground scoring rules (**defined square, NO overhead net, zones 1D/2D/4D, fixed 4, line no-balls, direct out of square dismissal, zone precedence safeguard**).

```mermaid
gantt
    title BPL Implementation Roadmap (Confirmed Scoring Rules Aligned)
    dateFormat  YYYY-MM-DD
    section Phase 1: Architecture & Foundation
    Database Schema & Migrations       :done, p1, 2026-11-15, 1d
    section Phase 2: Auth & Role Control
    Email OTP & JWT Roles             :done, p2, 2026-11-15, 1d
    section Phase 3: Franchise & Squads
    8 Teams & User ID Squad Building   :done, p3, 2026-11-15, 1d
    section Phase 4: Round-Robin Engine
    28-Match Fixture Generator         :done, p4, 2026-11-15, 1d
    section Phase 5: BPL Ground Scoring
    Scoring Engine & Micro-Snapshots   :done, p5, 2026-11-15, 1d
    section Phase 6: Real-Time Stream
    WebSocket Broadcast & Auto-Sync    :done, p6, 2026-11-15, 1d
    section Phase 7: Public Web Portal
    Public Cricbuzz-Style UI           :done, p7, 2026-11-15, 1d
    section Phase 8: Standings & Caps
    Automated NRR, Orange & Purple Cap :done, p8, 2026-11-15, 1d
    section Phase 9: Verification & Docs
    Seed Data, Test Suites & Docs      :done, p9, 2026-11-15, 1d
```

---

## 2. Phase-by-Phase Verification Checklist

### Phase 1: Foundation & PostgreSQL Schema
- [x] SQLAlchemy 2.0 models reflecting BPL ground rules: `users`, `teams`, `team_players`, `matches`, `match_innings`, `batting_scorecards`, `bowling_scorecards`, `ball_events`, and `tournament_settings`.
- [x] Constraints: Unique `BPLxxx` user IDs, unique team short codes, single team membership per resident.
- [x] Removed all overhead net columns and rules.
- [x] Delivery event types: `NO_BALL`, `DIRECT_OUT`, `ONE_D`, `TWO_D`, `FOUR_D`, `RUNS_COMPLETED`, `WIDE`, `WICKET`.

### Phase 2: Authentication & Permissions System
- [x] Email OTP verification service (no passwords).
- [x] Deterministic User ID generator (`BPL001`, `BPL002`...).
- [x] Cryptographic JWT creation and claim validation.
- [x] Distinct roles: `SUPER_ADMIN`, `SCORER`, `CAPTAIN`, `USER`.
- [x] Unauthenticated public access for all spectators.

### Phase 3: Franchise & Squad Administration
- [x] 8 participating residential teams.
- [x] Assign registered residents by User ID to team squads without duplicate membership.
- [x] Assign captaincy linked directly to the team model.
- [x] Member profile endpoint (`/api/v1/auth/me`) returning personal team, captain, and teammates.

### Phase 4: Tournament Engine & Fixtures
- [x] 28-match single round-robin scheduling algorithm (Berger cyclic tables).
- [x] Configurable match overs, venue, and start times.
- [x] Match lifecycle progression (`UPCOMING` -> `LIVE` -> `COMPLETED`).

### Phase 5: BPL Ground Scoring Engine & Rules
- [x] Confirmed Delivery Types & Rules:
  - `NO_BALL`: +1 run to batting team, repeated delivery, does NOT count as legal ball.
  - `FOUR_D`: FIXED 4 runs awarded. Additional running runs omitted.
  - `ONE_D`: 1 zone run + physically completed runs.
  - `TWO_D`: 2 zone runs + physically completed runs.
  - `RUNS_COMPLETED`: Physically completed runs between wickets.
  - `DIRECT_OUT`: Ball directly out of square = OUT (legal ball).
  - `Zone Precedence Safeguard`: 1D, 2D, and 4D zones take precedence before checking direct square boundary exit.
- [x] Strike rotation on odd physical runs and at end of each 6-ball over.
- [x] **Deterministic Undo**: Micro-snapshots of innings and scorecard state restored atomically on demand.

### Phase 6: WebSocket Real-Time Broadcasting
- [x] Channel manager `/ws/matches/{match_id}`.
- [x] Automated delivery and undo delta broadcast without page refresh.
- [x] Resilient frontend WebSocket hook with auto-reconnection.

### Phase 7: Public Web Experience
- [x] Professional cricket visual identity with Deep Emerald Green & Golden Yellow accents.
- [x] Public homepage with prominent Live Match Card, upcoming fixtures, and cap leaders.
- [x] Ball-by-ball live match commentary and full interactive digital scorecards.
- [x] Scorer control pad equipped with 1D, 2D, 4D (Fixed 4), Line NB, Direct Out, and Undo buttons.
- [x] Responsive layout optimized for mobile smartphones, tablets, and desktop displays.

### Phase 8: Automated Standings & Player Caps
- [x] Net Run Rate (NRR) dynamically re-computed across all completed matches.
- [x] Standings table with positions, wins, losses, ties, points, and Top-4 qualification markers.
- [x] Individual leaderboards: Orange Cap (leading run scorer) and Purple Cap (top wicket taker).

### Phase 9: Testing & Documentation
- [x] Unit test suites for zone scoring, line no-balls, direct out of square dismissals, and rollback undo.
- [x] Verified and committed architectural documentation in `docs/`:
  - `docs/ARCHITECTURE.md`
  - `docs/DATABASE_SCHEMA.md`
  - `docs/API_SPECIFICATION.md`
  - `docs/SCORING_ENGINE.md`
  - `docs/IMPLEMENTATION_ROADMAP.md`

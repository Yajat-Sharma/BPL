# REST API & WEBSOCKET SPECIFICATION

## 1. Authentication & Security Model

- **Public Endpoints**: Completely open to the world. Zero authentication tokens, session cookies, or accounts required to read scores, scorecards, fixtures, teams, or leaderboards.
- **Member Endpoints**: Protected by JWT in `Authorization: Bearer <token>`.
- **Scorer & Super Admin Endpoints**: Validated against `User.role IN ('SUPER_ADMIN', 'SCORER')`.

---

## 2. Public REST Endpoints (Unauthenticated Read-Only)

### 2.1 Live Scoring & Matches
- `GET /api/v1/matches`
  - Query parameters: `status` (`UPCOMING`, `LIVE`, `COMPLETED`, optional)
  - Returns list of tournament matches with franchise details, scores, and status.
- `GET /api/v1/matches/{match_id}`
  - Returns detailed match metadata, venue, round number, and overs.
- `GET /api/v1/scoring/live/{match_id}`
  - Returns real-time match state: current innings, score (`runs/wickets`), overs, CRR, RRR, active striker & non-striker, bowler figures, and recent balls formatted (`4D`, `1D`, `2D`, `1nb`, `W-OUT`).
- `GET /api/v1/scoring/scorecard/{match_id}`
  - Returns complete scorecard for both 1st and 2nd innings with full batting lists (dismissal, runs, balls, 4s, 6s, SR) and bowling figures (overs, maidens, runs, wickets, no-balls, wides, economy).

### 2.2 Teams & Rosters
- `GET /api/v1/teams`
  - Returns all 8 franchises with colors, logos, captains, and squad lists.
- `GET /api/v1/teams/{team_id}`
  - Returns single team with full squad profiles and jersey numbers.

### 2.3 Standings & Statistics
- `GET /api/v1/stats/points-table`
  - Returns real-time standings with Played, Won, Lost, Tied, Points, and dynamically computed Net Run Rate (NRR).
- `GET /api/v1/stats/orange-cap`
  - Top 10 run-scorers in the tournament.
- `GET /api/v1/stats/purple-cap`
  - Top 10 wicket-takers in the tournament.
- `GET /api/v1/stats/summary`
  - Composite payload for homepage containing points preview, Orange Cap leader, and Purple Cap leader.
- `GET /api/v1/settings`
  - Returns active tournament regulations and BPL Box Cricket ground rules (including zone precedence and fixed-4 rules).

---

## 3. Member Endpoints (Requires Authenticated Resident)

### 3.1 Authentication
- `POST /api/v1/auth/send-otp`
  - Body: `{ "email": "resident@gmail.com" }`
  - Dispatches 6-digit verification OTP.
- `POST /api/v1/auth/verify-otp`
  - Body: `{ "email": "resident@gmail.com", "otp": "123456", "username": "Optional for new user" }`
  - Returns JWT token and User object with assigned permanent User ID (`BPL001`, `BPL002`...).
- `GET /api/v1/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Returns authenticated member's profile: User info, assigned franchise, captain info, and list of squad teammates.

---

## 4. Protected Admin & Scorer Endpoints (Scorer or Super Admin Required)

### 4.1 Live Scoring Operations
- `POST /api/v1/matches/{match_id}/toss`
  - Body: `{ "toss_winner_id": "<uuid>", "toss_decision": "BAT" | "BOWL" }`
- `POST /api/v1/matches/{match_id}/start`
  - Body: `{ "batting_team_id": "<uuid>", "bowling_team_id": "<uuid>", "striker_id": "<uuid>", "non_striker_id": "<uuid>", "bowler_id": "<uuid>", "team_a_playing_xi": [...], "team_b_playing_xi": [...] }`
- `POST /api/v1/scoring/ball/{match_id}`
  - **Confirmed BPL Delivery Event Payload**:
    ```json
    {
      "event_type": "NO_BALL" | "DIRECT_OUT" | "ONE_D" | "TWO_D" | "FOUR_D" | "RUNS_COMPLETED" | "WIDE" | "WICKET",
      "completed_runs": 0,
      "wicket_type": "DIRECT_OUT" | "BOWLED" | "CAUGHT" | "RUN_OUT" | "STUMPED" | "HIT_WICKET" | "LBW",
      "dismissed_player_id": "<uuid>",
      "fielder_id": "<uuid>",
      "custom_commentary": "Optional text"
    }
    ```
  - **Delivery Event Behaviors**:
    - `NO_BALL`: +1 run to batting score, extras["no_ball"] + 1, legal delivery = False, repeat delivery = True. Plus any `completed_runs` run off the bat.
    - `FOUR_D`: Fixed 4 runs awarded. `completed_runs` is ignored (no physical running allowed on 4D). Legal delivery = True.
    - `ONE_D`: 1 zone run + `completed_runs`. Legal delivery = True.
    - `TWO_D`: 2 zone runs + `completed_runs`. Legal delivery = True.
    - `RUNS_COMPLETED`: `completed_runs` added to score. Legal delivery = True.
    - `DIRECT_OUT`: Wicket recorded (`DIRECT_OUT`), legal delivery = True.
    - `WICKET`: Standard dismissal recorded with `wicket_type`, legal delivery = True.
    - `WIDE`: +1 extra run, legal delivery = False, repeat delivery = True.
- `POST /api/v1/scoring/undo/{match_id}`
  - Reverts the most recent delivery, rolls back scorecards and innings state from snapshot, and broadcasts updated state to WebSockets.
- `POST /api/v1/scoring/switch-bowler/{match_id}`
  - Body: `{ "bowler_id": "<uuid>" }`
- `POST /api/v1/scoring/select-batsman/{match_id}`
  - Body: `{ "batsman_id": "<uuid>" }`
- `POST /api/v1/scoring/swap-strike/{match_id}`
  - Manually interchanges striker and non-striker ends.

### 4.2 Super Admin Management (Super Admin Role Required)
- `POST /api/v1/teams`
  - Body: `{ "name": "...", "short_code": "...", "primary_color": "...", "secondary_color": "..." }`
- `POST /api/v1/teams/{team_id}/players`
  - Body: `{ "bpl_user_id": "BPL008", "player_role": "ALL_ROUNDER", "jersey_number": 10, "is_captain": false }`
- `DELETE /api/v1/teams/{team_id}/players/{player_id}`
- `POST /api/v1/matches`
  - Manual fixture scheduler.
- `POST /api/v1/matches/generate-round-robin`
  - Automatically generates all 28 single round-robin fixtures for the 8 franchises.
- `PUT /api/v1/settings`
  - Configures tournament settings & BPL ground rules:
    ```json
    {
      "tournament_name": "Bairajeshwar Premier League (BPL)",
      "overs_per_match": 6,
      "players_per_team": 8,
      "max_wickets": 7,
      "allow_last_man_batting": false,
      "wide_runs": 1,
      "no_ball_runs": 1,
      "no_ball_reball": true,
      "wide_reball": true,
      "zone_1d_runs": 1,
      "zone_2d_runs": 2,
      "zone_4d_runs": 4,
      "zone_precedence_enabled": true,
      "direct_out_enabled": true,
      "allow_lbw": false,
      "over_limit_per_bowler": 2
    }
    ```

---

## 5. WebSocket Protocol Specification

### Connection URL
`ws://<host>/ws/matches/{match_id}`

### Public Real-Time Streaming
- Spectators connect with no authorization required.
- WebSocket automatically broadcasts whenever a ball is recorded, a zone is struck, an extra is conceded, or a delivery is undone.
- Payload includes full scoreboard state, active batters, bowling spell, and recent ball badge labels (`1D`, `2D`, `4D`, `1nb`, `1wd`, `OUT`).

# REST API & WEBSOCKET SPECIFICATION

## 1. Authentication & Security Model

- **Public Endpoints**: Completely open to the world. No Bearer tokens, cookies, or registration required.
- **Member Endpoints**: Protected by JWT in `Authorization: Bearer <token>`.
- **Admin/Scorer Write Endpoints**: Validated against `User.role IN ('SUPER_ADMIN', 'SCORER')`.

---

## 2. Public REST Endpoints (No Authentication Required)

### 2.1 Live Scoring & Matches
- `GET /api/v1/matches`
  - Query parameters: `status` (`UPCOMING`, `LIVE`, `COMPLETED`, optional)
  - Returns list of matches with franchise details, scores, and status.
- `GET /api/v1/matches/{match_id}`
  - Returns detailed match metadata, scheduled timings, venue, and overs.
- `GET /api/v1/scoring/live/{match_id}`
  - Returns real-time match state: current innings, score (`runs/wickets`), overs, CRR, RRR, active striker & non-striker, bowler figures, and recent balls.
- `GET /api/v1/scoring/scorecard/{match_id}`
  - Returns complete scorecard for both 1st and 2nd innings with full batting lists (dismissal, runs, balls, 4s, 6s, SR) and bowling figures (overs, maidens, runs, wickets, economy).

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
  - Returns active tournament regulations and Box Cricket rules.

---

## 3. Member Endpoints (Requires Authenticated Resident)

### 3.1 Authentication
- `POST /api/v1/auth/send-otp`
  - Body: `{ "email": "resident@gmail.com" }`
  - Dispatches 6-digit OTP to user's email.
- `POST /api/v1/auth/verify-otp`
  - Body: `{ "email": "resident@gmail.com", "otp": "123456", "username": "Optional for new user" }`
  - Returns JWT token and User object (with permanent User ID like `BPL005`).
- `GET /api/v1/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Returns authenticated member's profile: User info, assigned team, captain info, and list of squad teammates.

---

## 4. Protected Admin & Scorer Endpoints (Scorer or Super Admin Role Required)

### 4.1 Live Scoring Operations
- `POST /api/v1/matches/{match_id}/toss`
  - Body: `{ "toss_winner_id": "<uuid>", "toss_decision": "BAT" | "BOWL" }`
- `POST /api/v1/matches/{match_id}/start`
  - Body: `{ "batting_team_id": "<uuid>", "bowling_team_id": "<uuid>", "striker_id": "<uuid>", "non_striker_id": "<uuid>", "bowler_id": "<uuid>", "team_a_playing_xi": [...], "team_b_playing_xi": [...] }`
- `POST /api/v1/scoring/ball/{match_id}`
  - Body:
    ```json
    {
      "runs_scored": 0,
      "extra_type": "NONE" | "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | "ROOF_NET_HIT" | "WALL_HIT",
      "extra_runs": 0,
      "is_wicket": false,
      "wicket_type": "BOWLED" | "CAUGHT" | "LBW" | "RUN_OUT" | "STUMPED" | "HIT_WICKET" | "ONE_TIP_ONE_HAND" | "ROOF_NET_CATCH" | "DIRECT_OUT_OF_BOX",
      "dismissed_player_id": "<uuid>",
      "fielder_id": "<uuid>",
      "custom_commentary": "Optional text"
    }
    ```
  - Processes ball, mutates scorecards, commits transaction, and broadcasts to WebSocket channel.
- `POST /api/v1/scoring/undo/{match_id}`
  - Reverts the most recent delivery, rolls back scorecards to snapshot, and broadcasts updated state.
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
  - Updates tournament settings & Box Cricket rules (overs, bowler quotas, net hits, wall runs, wickets allowed).

---

## 5. WebSocket Protocol Specification

### Connection URL
`ws://<host>/ws/matches/{match_id}`

### Handshake & Security
- Public spectators connect without credentials.
- Auto ping/pong heartbeat every 25 seconds to preserve long-lived connections through proxies.

### Event Format Broadcast (Server -> Client)
```json
{
  "match_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "match_number": "M02",
  "status": "LIVE",
  "current_innings_number": 1,
  "overs_per_innings": 6,
  "batting_team": {
    "id": "...",
    "name": "Bairajeshwar Royals",
    "short_code": "BROYALS",
    "primary_color": "#047857"
  },
  "bowling_team": {
    "id": "...",
    "name": "Wing-A Warriors",
    "short_code": "WAWAR",
    "primary_color": "#1e3a8a"
  },
  "total_runs": 45,
  "wickets": 2,
  "overs": 4.2,
  "legal_balls": 26,
  "crr": 10.38,
  "target": null,
  "rrr": null,
  "striker": {
    "id": "...",
    "name": "Kabir Singh",
    "runs": 28,
    "balls": 15,
    "fours": 3,
    "sixes": 2,
    "sr": 186.67
  },
  "non_striker": {
    "id": "...",
    "name": "Yash Desai",
    "runs": 12,
    "balls": 8,
    "fours": 1,
    "sixes": 0,
    "sr": 150.0
  },
  "bowler": {
    "id": "...",
    "name": "Nikhil Rao",
    "overs": 1.2,
    "maidens": 0,
    "runs": 14,
    "wickets": 1,
    "econ": 10.5
  },
  "recent_balls": [
    { "sequence": 24, "over": 3, "ball_in_over": 6, "label": "4", "runs": 4, "is_wicket": false },
    { "sequence": 25, "over": 4, "ball_in_over": 1, "label": "1wd", "runs": 1, "is_wicket": false },
    { "sequence": 26, "over": 4, "ball_in_over": 2, "label": "W", "runs": 0, "is_wicket": true }
  ],
  "last_commentary": "WICKET! Nikhil Rao strikes clean! Bowled out!",
  "win_margin": null,
  "is_innings_completed": false,
  "is_match_completed": false
}
```

# DATABASE SCHEMA SPECIFICATION: POSTGRESQL

## 1. Schema Design Principles

The BPL database schema models an **open-air box cricket ground with a defined playing square, NO overhead net, designated scoring zones (1D, 2D, 4D), line no-balls, and direct out-of-square dismissals**.

Key Principles:
1. **Explicit Delivery Event Types**: The `ball_events` table explicitly tracks the confirmed BPL delivery types: `NO_BALL`, `DIRECT_OUT`, `ONE_D`, `TWO_D`, `FOUR_D`, `RUNS_COMPLETED`, `WIDE`, and `WICKET`.
2. **Deterministic Micro-Snapshots**: Every `ball_events` row stores `previous_state_snapshot` (JSONB) capturing the exact micro-state of both scorecards and innings before the delivery occurred, enabling instant and bug-free undo.
3. **Fixed 4 vs Running Runs**: `FOUR_D` deliveries record `fixed_runs = 4` with `completed_runs = 0`. `ONE_D` and `TWO_D` record zone runs plus any physically completed running runs.
4. **Scorer Account Authorization**: The `users.role` enum includes `SCORER` in addition to `SUPER_ADMIN`, `CAPTAIN`, and `USER`.
5. **Referential Integrity**: Strict foreign keys and constraints prevent orphan scoring events or invalid team assignments.

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ TEAM_PLAYERS : "belongs to"
    USERS ||--o{ MATCH_PLAYING_XI : "selected in"
    USERS ||--o{ BATTING_SCORECARDS : "bats as"
    USERS ||--o{ BOWLING_SCORECARDS : "bowls as"
    TEAMS ||--o{ TEAM_PLAYERS : "comprises"
    TEAMS ||--o{ MATCHES : "Team A or Team B"
    MATCHES ||--o{ MATCH_INNINGS : "has innings"
    MATCHES ||--o{ MATCH_PLAYING_XI : "has 2 squads"
    MATCH_INNINGS ||--o{ BATTING_SCORECARDS : "records batting"
    MATCH_INNINGS ||--o{ BOWLING_SCORECARDS : "records bowling"
    MATCH_INNINGS ||--o{ BALL_EVENTS : "records deliveries"

    USERS {
        uuid id PK
        varchar user_id UK "e.g. BPL001"
        varchar username
        varchar email UK
        varchar role "SUPER_ADMIN | SCORER | CAPTAIN | USER"
        boolean is_active
        timestamp created_at
    }

    EMAIL_OTPS {
        bigserial id PK
        varchar email
        varchar otp_code
        timestamp expires_at
        boolean is_used
        timestamp created_at
    }

    TEAMS {
        uuid id PK
        varchar name UK
        varchar short_code UK "e.g. BROYALS"
        varchar logo_url
        varchar primary_color
        varchar secondary_color
        uuid captain_id FK
        timestamp created_at
    }

    TEAM_PLAYERS {
        uuid id PK
        uuid team_id FK
        uuid user_id FK "UNIQUE across tournament"
        varchar player_role "BATSMAN | BOWLER | ALL_ROUNDER | WICKET_KEEPER"
        int jersey_number
        boolean is_captain
        timestamp joined_at
    }

    TOURNAMENT_SETTINGS {
        int id PK
        varchar tournament_name
        varchar banner_url
        varchar logo_url
        int total_teams "Default 8"
        int overs_per_match "Customizable"
        int points_win "Default 2"
        int points_tie "Default 1"
        int points_no_result "Default 1"
        int players_per_team "Default 8"
        int max_wickets "Default 7"
        boolean allow_last_man_batting
        int wide_runs "Default 1"
        int no_ball_runs "Default 1"
        boolean no_ball_reball "Default TRUE"
        boolean wide_reball "Default TRUE"
        int zone_1d_runs "Default 1"
        int zone_2d_runs "Default 2"
        int zone_4d_runs "Default 4"
        boolean zone_precedence_enabled "Default TRUE"
        boolean direct_out_enabled "Default TRUE"
        boolean allow_lbw "Default FALSE"
        int over_limit_per_bowler "Default 2"
        varchar status "UPCOMING | LIVE | COMPLETED"
        timestamp updated_at
    }

    MATCHES {
        uuid id PK
        varchar match_number UK "M01 to M28"
        int round_number "1 to 7"
        varchar description
        uuid team_a_id FK
        uuid team_b_id FK
        varchar venue
        timestamp match_date
        int overs_per_innings
        varchar status "UPCOMING | LIVE | COMPLETED | ABANDONED"
        uuid toss_winner_id FK
        varchar toss_decision "BAT | BOWL"
        uuid winner_id FK
        varchar win_margin
        int current_innings_number
        int target_runs
        timestamp created_at
    }

    MATCH_INNINGS {
        uuid id PK
        uuid match_id FK
        int innings_number "1 or 2"
        uuid batting_team_id FK
        uuid bowling_team_id FK
        int total_runs
        int wickets
        int legal_balls_bowled
        int wide_runs
        int no_ball_runs
        int bye_runs
        int leg_bye_runs
        int penalty_runs
        boolean is_completed
        uuid current_striker_id FK
        uuid current_non_striker_id FK
        uuid current_bowler_id FK
    }

    BATTING_SCORECARDS {
        uuid id PK
        uuid innings_id FK
        uuid batsman_id FK
        int batting_position
        int runs
        int balls_faced
        int fours
        int sixes
        numeric strike_rate
        boolean is_out
        varchar dismissal_type
        uuid bowler_id FK
        uuid fielder_id FK
    }

    BOWLING_SCORECARDS {
        uuid id PK
        uuid innings_id FK
        uuid bowler_id FK
        int legal_balls
        numeric overs_bowled
        int maidens
        int runs_conceded
        int wickets
        numeric economy_rate
        int wides
        int no_balls
    }

    BALL_EVENTS {
        uuid id PK
        uuid innings_id FK
        int ball_sequence "1..N"
        int over_number "0-indexed"
        int ball_in_over "1..6"
        uuid bowler_id FK
        uuid striker_id FK
        uuid non_striker_id FK
        varchar event_type "NO_BALL | DIRECT_OUT | ONE_D | TWO_D | FOUR_D | RUNS_COMPLETED | WIDE | WICKET"
        int completed_runs "Running runs completed between wickets"
        int zone_runs "Fixed or designated zone runs (1, 2, or 4)"
        int total_ball_runs "Total runs added to team score"
        boolean is_legal_delivery "False for NO_BALL and WIDE"
        boolean repeat_delivery "True for NO_BALL and WIDE"
        boolean is_wicket
        varchar dismissal_type "DIRECT_OUT | BOWLED | CAUGHT | RUN_OUT | STUMPED | HIT_WICKET | LBW"
        uuid dismissed_player_id FK
        uuid fielder_id FK
        text commentary
        jsonb previous_state_snapshot
        timestamp created_at
    }
```

---

## 3. Key Table Specifications & Constraints

### 3.1 `tournament_settings`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY | Settings row identifier |
| `tournament_name` | VARCHAR(150) | NOT NULL | Official tournament name |
| `overs_per_match` | INT | DEFAULT 6 | Customizable match overs |
| `players_per_team` | INT | DEFAULT 8 | Box cricket squad size |
| `max_wickets` | INT | DEFAULT 7 | Wickets allowed before all out |
| `allow_last_man_batting` | BOOLEAN | DEFAULT FALSE | Last man can bat alone toggle |
| `wide_runs` | INT | DEFAULT 1 | Runs awarded for wide |
| `no_ball_runs` | INT | DEFAULT 1 | Runs awarded for line no-ball (+1) |
| `no_ball_reball` | BOOLEAN | DEFAULT TRUE | Line no-balls repeated |
| `wide_reball` | BOOLEAN | DEFAULT TRUE | Wides repeated |
| `zone_1d_runs` | INT | DEFAULT 1 | Runs for Zone 1D |
| `zone_2d_runs` | INT | DEFAULT 2 | Runs for Zone 2D |
| `zone_4d_runs` | INT | DEFAULT 4 | Runs for Zone 4D (Fixed 4) |
| `zone_precedence_enabled`| BOOLEAN | DEFAULT TRUE | 1D/2D/4D zones take precedence over square exits |
| `direct_out_enabled` | BOOLEAN | DEFAULT TRUE | Out if hit directly outside square |
| `allow_lbw` | BOOLEAN | DEFAULT FALSE | Disabled by default |
| `over_limit_per_bowler` | INT | DEFAULT 2 | Max overs per bowler |
| `status` | VARCHAR(50) | DEFAULT 'UPCOMING' | `UPCOMING`, `LIVE`, `COMPLETED` |

---

### 3.2 `ball_events`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Event unique ID |
| `innings_id` | UUID | FOREIGN KEY, NOT NULL | Reference to `match_innings` |
| `ball_sequence` | INT | NOT NULL | Sequential delivery counter (1, 2, 3...) |
| `over_number` | INT | NOT NULL | 0-indexed over number |
| `ball_in_over` | INT | NOT NULL | 1 to 6 (0 for illegal deliveries) |
| `bowler_id` | UUID | FOREIGN KEY, NOT NULL | Active bowler |
| `striker_id` | UUID | FOREIGN KEY, NOT NULL | Active striker |
| `non_striker_id` | UUID | FOREIGN KEY, NULLABLE | Active non-striker (null for last-man) |
| `event_type` | VARCHAR(30) | NOT NULL | `NO_BALL`, `DIRECT_OUT`, `ONE_D`, `TWO_D`, `FOUR_D`, `RUNS_COMPLETED`, `WIDE`, `WICKET` |
| `completed_runs` | INT | DEFAULT 0 | Physical runs run between wickets |
| `zone_runs` | INT | DEFAULT 0 | Declared zone runs (1 for 1D, 2 for 2D, 4 for 4D) |
| `total_ball_runs` | INT | DEFAULT 0 | Total runs credited on this delivery |
| `is_legal_delivery` | BOOLEAN | DEFAULT TRUE | False for `NO_BALL` or `WIDE` |
| `repeat_delivery` | BOOLEAN | DEFAULT FALSE | True for `NO_BALL` or `WIDE` |
| `is_wicket` | BOOLEAN | DEFAULT FALSE | Wicket indicator |
| `dismissal_type` | VARCHAR(50) | NULLABLE | `DIRECT_OUT`, `BOWLED`, `CAUGHT`, `RUN_OUT`, `STUMPED`, `HIT_WICKET`, `LBW` |
| `dismissed_player_id` | UUID | FOREIGN KEY, NULLABLE | Dismissed batsman |
| `previous_state_snapshot`| JSONB | NOT NULL | Exact serialized JSON state for atomic undo |

*Indexes*:
- `idx_ball_events_innings_seq` ON (`innings_id`, `ball_sequence` DESC)
- `idx_ball_events_event_type` ON (`event_type`)

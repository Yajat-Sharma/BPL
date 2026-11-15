# DATABASE SCHEMA SPECIFICATION: POSTGRESQL

## 1. Schema Design Principles

The BPL database schema is designed to model **residential box cricket** with strict referential integrity, event-sourcing for deliveries, and high-performance indexing for live queries.

Key Principles:
1. **UUID Primary Keys**: Prevents enumeration attacks and simplifies distributed synchronization.
2. **Immutable Ball Events**: Every ball delivered in an innings is appended as an immutable event record.
3. **State Snapshotting**: Every `ball_events` row contains `previous_state_snapshot` (JSONB) capturing the exact micro-state of both scorecards and innings before the delivery occurred, enabling instant and bug-free undo.
4. **Configurable Box Cricket Regulations**: The `tournament_settings` table stores all customizable rules (overs, bowler quotas, net hits, wall runs, wickets allowed).

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
        int wide_runs
        int no_ball_runs
        boolean no_ball_reball
        boolean wide_reball
        varchar roof_net_hit_rule "DEAD_BALL | RUNS_1 | RUNS_2 | OUT"
        varchar direct_hit_wall_rule "RUNS_4 | RUNS_6 | RUN_PHYSICALLY"
        boolean allow_lbw
        int over_limit_per_bowler
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
        int runs_scored
        varchar extra_type "NONE | WIDE | NO_BALL | BYE | LEG_BYE | ROOF_NET_HIT | WALL_HIT"
        int extra_runs
        int total_ball_runs
        boolean is_legal_delivery
        boolean is_wicket
        varchar wicket_type
        uuid dismissed_player_id FK
        uuid fielder_id FK
        text commentary
        jsonb previous_state_snapshot
        timestamp created_at
    }
```

---

## 3. Detailed Table Specifications & Constraints

### 3.1 `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Internal unique identifier |
| `user_id` | VARCHAR(20) | UNIQUE, NOT NULL | Public ID: `BPL001`, `BPL002`... |
| `username` | VARCHAR(100) | NOT NULL | Full name of resident |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Gmail address |
| `role` | VARCHAR(20) | NOT NULL, DEFAULT 'USER' | `SUPER_ADMIN`, `SCORER`, `CAPTAIN`, `USER` |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account state |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

*Indexes*:
- `idx_users_user_id` (BTREE)
- `idx_users_email` (BTREE)

---

### 3.2 `teams` & `team_players`
- `teams.name` UNIQUE, `teams.short_code` UNIQUE (Max 8 franchises).
- `team_players.user_id` UNIQUE: **Guarantees no player can be assigned to multiple teams**.
- Foreign Keys configured with `ON DELETE CASCADE` for team player records when a team is removed.

---

### 3.3 `matches`
- `match_number` VARCHAR(20) UNIQUE (e.g. `M01` through `M28`).
- `overs_per_innings` INT: Inherited from tournament settings or overridden per match.
- `status` CHECK (`status IN ('UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED')`).
- `round_number` INT (1 to 7 for the 28-match round-robin phase).

*Indexes*:
- `idx_matches_status_date` ON (`status`, `match_date`)

---

### 3.4 `ball_events`
- `innings_id` REFERENCES `match_innings(id)` ON DELETE CASCADE.
- `ball_sequence` INT NOT NULL: Monotonically increasing counter per innings.
- `extra_type` CHECK (`extra_type IN ('NONE', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'PENALTY', 'ROOF_NET_HIT', 'WALL_HIT')`).
- `wicket_type` CHECK (`wicket_type IN ('BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'ONE_TIP_ONE_HAND', 'ROOF_NET_CATCH', 'DIRECT_OUT_OF_BOX')`).
- `previous_state_snapshot` JSONB NOT NULL: Complete JSON representation of both scorecards and innings state before this delivery was applied.

*Indexes*:
- `idx_ball_events_innings_seq` ON (`innings_id`, `ball_sequence` DESC)

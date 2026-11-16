export interface User {
  id: string;
  user_id: string; // e.g. BPL001
  username: string;
  email: string;
  role: "SUPER_ADMIN" | "CAPTAIN" | "USER";
  is_active: boolean;
}

export interface TeamSummary {
  id: string;
  name: string;
  short_code: string;
  primary_color: string;
  secondary_color: string;
}

export interface Teammate {
  id: string;
  user_id: string;
  username: string;
  role: string;
  player_role: string;
  jersey_number?: number;
  is_captain: boolean;
}

export interface MemberProfile {
  user: User;
  team?: TeamSummary;
  captain?: User;
  teammates: Teammate[];
  is_captain_of_team: boolean;
}

export interface TeamPlayer {
  id: string;
  user_id: string;
  player_role: string;
  jersey_number?: number;
  is_captain: boolean;
  user: User;
}

export interface Team {
  id: string;
  name: string;
  short_code: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  captain_id?: string;
  captain?: User;
  players: TeamPlayer[];
}

export interface Match {
  id: string;
  match_number: string;
  description?: string;
  team_a_id: string;
  team_b_id: string;
  team_a: Team;
  team_b: Team;
  venue: string;
  match_date: string;
  overs_per_innings: number;
  status: "UPCOMING" | "LIVE" | "COMPLETED" | "ABANDONED";
  toss_winner_id?: string;
  toss_decision?: "BAT" | "BOWL";
  toss_winner?: Team;
  winner_id?: string;
  winner?: Team;
  win_margin?: string;
  current_innings_number: number;
  target_runs?: number;
}

export interface LiveBall {
  sequence: number;
  over: number;
  ball_in_over: number;
  label: string;
  runs: number;
  is_wicket: boolean;
  commentary?: string;
}

export interface LiveMatchState {
  match_id: string;
  match_number: string;
  status: string;
  current_innings_number: number;
  overs_per_innings: number;
  batting_team: {
    id: string;
    name: string;
    short_code: string;
    logo_url?: string;
    primary_color: string;
  };
  bowling_team: {
    id: string;
    name: string;
    short_code: string;
    logo_url?: string;
    primary_color: string;
  };
  total_runs: number;
  wickets: number;
  overs: number;
  legal_balls: number;
  crr: number;
  target?: number;
  rrr?: number;
  striker?: {
    id: string;
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    sr: number;
  };
  non_striker?: {
    id: string;
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    sr: number;
  };
  bowler?: {
    id: string;
    name: string;
    overs: number;
    maidens: number;
    runs: number;
    wickets: number;
    econ: number;
  };
  recent_balls: LiveBall[];
  last_commentary?: string;
  win_margin?: string;
  is_innings_completed: boolean;
  is_match_completed: boolean;
}

export interface PointsTableEntry {
  position: number;
  team_id: string;
  team_name: string;
  short_code: string;
  logo_url?: string;
  primary_color: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  no_result: number;
  points: number;
  nrr: number;
}

export interface LeaderboardBatter {
  player_id: string;
  user_id: string;
  name: string;
  total_runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  highest_score: number;
  strike_rate: number;
  innings: number;
}

export interface LeaderboardBowler {
  player_id: string;
  user_id: string;
  name: string;
  wickets: number;
  runs_conceded: number;
  overs: number;
  economy: number;
  average: number;
  maidens: number;
}

export interface TournamentSettingsData {
  id: number;
  tournament_name: string;
  banner_url?: string;
  logo_url?: string;
  total_teams: number;
  overs_per_match: number;
  points_win: number;
  points_tie: number;
  points_no_result: number;
  status: string;
  players_per_team: number;
  max_wickets: number;
  allow_last_man_batting: boolean;
  wide_runs: number;
  no_ball_runs: number;
  no_ball_reball: boolean;
  wide_reball: boolean;
  roof_net_hit_rule: string;
  direct_hit_wall_rule: string;
  allow_lbw: boolean;
  over_limit_per_bowler: number;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Zap,
  Users,
  Shield,
  Play,
  Flame,
  ArrowRight,
  Plus,
  X,
  Dice5,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";

const PRESET_OVERS = [2, 4, 6, 8, 10, 12, 16, 20];

const SAMPLE_GULLY_PLAYERS_A = ["Rohit", "Virat", "Sachin", "Yuvi", "Dhoni", "Hardik"];
const SAMPLE_GULLY_PLAYERS_B = ["Bumrah", "Shami", "Zaheer", "Ashwin", "Jadeja", "Siraj"];

export default function CreateGullyMatchPage() {
  const router = useRouter();

  // Mode: SINGLE match vs LEAGUE tournament
  const [matchType, setMatchType] = useState<"SINGLE" | "LEAGUE">("SINGLE");
  const [numMatches, setNumMatches] = useState(3);

  // Settings
  const [matchName, setMatchName] = useState("Sunday Gully Derby");
  const [overs, setOvers] = useState(6);
  const [ballType, setBallType] = useState("Tennis Ball");
  const [venue, setVenue] = useState("Local Gully / Turf Pitch");

  // Teams & Players
  const [teamAName, setTeamAName] = useState("Royal Strikers");
  const [teamBName, setTeamBName] = useState("Gully Kings");
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>([
    "Kabir",
    "Rohan",
    "Aman",
    "Vicky",
    "Deepak",
  ]);
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>([
    "Yash",
    "Sameer",
    "Arjun",
    "Kunal",
    "Tushar",
  ]);

  // Input fields for adding players
  const [newPlayerA, setNewPlayerA] = useState("");
  const [newPlayerB, setNewPlayerB] = useState("");

  // Toss & Openers setup
  const [tossWinner, setTossWinner] = useState<"TEAM_A" | "TEAM_B">("TEAM_A");
  const [tossDecision, setTossDecision] = useState<"BAT" | "BOWL">("BAT");
  const [strikerName, setStrikerName] = useState("");
  const [nonStrikerName, setNonStrikerName] = useState("");
  const [bowlerName, setBowlerName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add player handlers
  const handleAddPlayerA = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newPlayerA.trim();
    if (clean && !teamAPlayers.includes(clean)) {
      setTeamAPlayers([...teamAPlayers, clean]);
      setNewPlayerA("");
    }
  };

  const handleRemovePlayerA = (name: string) => {
    setTeamAPlayers(teamAPlayers.filter((p) => p !== name));
  };

  const handleAddPlayerB = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newPlayerB.trim();
    if (clean && !teamBPlayers.includes(clean)) {
      setTeamBPlayers([...teamBPlayers, clean]);
      setNewPlayerB("");
    }
  };

  const handleRemovePlayerB = (name: string) => {
    setTeamBPlayers(teamBPlayers.filter((p) => p !== name));
  };

  // Quick fill preset sample squads
  const handleQuickFill = () => {
    setTeamAName("Street Warriors");
    setTeamBName("Turf Blasters");
    setTeamAPlayers([...SAMPLE_GULLY_PLAYERS_A]);
    setTeamBPlayers([...SAMPLE_GULLY_PLAYERS_B]);
    setStrikerName(SAMPLE_GULLY_PLAYERS_A[0]);
    setNonStrikerName(SAMPLE_GULLY_PLAYERS_A[1]);
    setBowlerName(SAMPLE_GULLY_PLAYERS_B[0]);
  };

  // Determine which team bats first based on toss
  const battingTeamName =
    tossWinner === "TEAM_A"
      ? tossDecision === "BAT"
        ? teamAName
        : teamBName
      : tossDecision === "BAT"
      ? teamBName
      : teamAName;

  const bowlingTeamName = battingTeamName === teamAName ? teamBName : teamAName;
  const battingPlayers = battingTeamName === teamAName ? teamAPlayers : teamBPlayers;
  const bowlingPlayers = battingTeamName === teamAName ? teamBPlayers : teamAPlayers;

  // Submit and create match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (teamAPlayers.length < 2 || teamBPlayers.length < 2) {
      setError("Please add at least 2 players to each team to start a match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Ensure user has a guest token if not logged in
      let token = typeof window !== "undefined" ? localStorage.getItem("bpl_token") : null;
      if (!token) {
        try {
          const guestRes = await api.post("/auth/guest", { username: "Gully Scorer" });
          token = guestRes.data.access_token;
          localStorage.setItem("bpl_token", token as string);
          localStorage.setItem("bpl_user", JSON.stringify(guestRes.data.user));
        } catch (err) {
          console.warn("Guest session auto-gen warning:", err);
        }
      }

      // 2. Quick create match payload
      const payload = {
        match_name: matchName.trim() || `${teamAName} vs ${teamBName}`,
        match_type: matchType,
        num_matches: matchType === "LEAGUE" ? numMatches : 1,
        overs_per_innings: overs,
        venue: venue.trim() || "Gully Turf Ground",
        ball_type: ballType,
        team_a_name: teamAName.trim() || "Team A",
        team_b_name: teamBName.trim() || "Team B",
        team_a_players: teamAPlayers,
        team_b_players: teamBPlayers,
        toss_winner_team: tossWinner,
        toss_decision: tossDecision,
        striker_name: strikerName || battingPlayers[0] || "Striker",
        non_striker_name: nonStrikerName || battingPlayers[1] || "Non-Striker",
        bowler_name: bowlerName || bowlingPlayers[0] || "Bowler",
      };

      const res = await api.post("/matches/quick-create", payload);
      const matchId = res.data.match_id;

      // 3. Immediately launch scoring pad
      router.push(`/admin/score/${matchId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create match. Please verify player details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b3827] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-bpl-gold/40 text-bpl-gold text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" /> Gully & Box Cricket Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
            Create Match or League
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Zero setup required. Add your team, tap in your player names, and start scoring in seconds!
          </p>
        </div>

        <button
          type="button"
          onClick={handleQuickFill}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bpl-forest hover:bg-[#1b3827] border border-bpl-gold/40 text-bpl-gold text-xs font-bold uppercase transition-all shadow-md self-start sm:self-auto"
        >
          <Dice5 className="w-4 h-4" /> Quick Auto-Fill (6v6)
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateMatch} className="space-y-8">
        {/* Step 1: Match Type & Format */}
        <div className="emerald-card rounded-2xl p-6 sm:p-8 border border-bpl-emerald/40 space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-bpl-gold tracking-wider">
            <Layers className="w-4 h-4" /> Step 1: Match Format & Rules
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMatchType("SINGLE")}
              className={`p-4 rounded-xl border text-left transition-all ${
                matchType === "SINGLE"
                  ? "bg-bpl-emerald/30 border-bpl-gold text-white shadow-lg ring-1 ring-bpl-gold"
                  : "bg-[#06130d] border-[#1b3827] text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-bpl-gold" /> Single Quick Match
                </span>
                {matchType === "SINGLE" && <CheckCircle2 className="w-4 h-4 text-bpl-gold" />}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                1v1 Head-to-Head Clash. Perfect for casual weekend gully or turf matches.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMatchType("LEAGUE")}
              className={`p-4 rounded-xl border text-left transition-all ${
                matchType === "LEAGUE"
                  ? "bg-bpl-emerald/30 border-bpl-gold text-white shadow-lg ring-1 ring-bpl-gold"
                  : "bg-[#06130d] border-[#1b3827] text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-bpl-gold" /> Mini League / Series
                </span>
                {matchType === "LEAGUE" && <CheckCircle2 className="w-4 h-4 text-bpl-gold" />}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Multi-match series or tournament. Auto-schedules consecutive fixtures.
              </p>
            </button>
          </div>

          {matchType === "LEAGUE" && (
            <div className="bg-[#06130d] p-4 rounded-xl border border-bpl-gold/30 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white uppercase">Number of Matches in Series</label>
                <p className="text-[11px] text-slate-400">Total fixtures to generate for this league</p>
              </div>
              <div className="flex items-center gap-2">
                {[2, 3, 5, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumMatches(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      numMatches === num
                        ? "bg-bpl-gold text-slate-950 shadow"
                        : "bg-[#112217] text-slate-300 hover:bg-[#1b3827]"
                    }`}
                  >
                    {num} Matches
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Match / Tournament Title
              </label>
              <input
                type="text"
                required
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                placeholder="e.g. Sunday Gully Derby"
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Ball Type
              </label>
              <select
                value={ballType}
                onChange={(e) => setBallType(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              >
                <option value="Tennis Ball">🎾 Tennis Ball (Light/Heavy)</option>
                <option value="Tape Ball">🏏 Tape Ball</option>
                <option value="Box Cricket Foam/Rubber">🧱 Box Cricket Rubber/Foam</option>
                <option value="Leather Ball">🔴 Leather Ball</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              Overs Per Innings: <span className="text-bpl-gold font-black">{overs} Overs</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_OVERS.map((ov) => (
                <button
                  key={ov}
                  type="button"
                  onClick={() => setOvers(ov)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    overs === ov
                      ? "bg-bpl-gold text-slate-950 font-black shadow-md scale-105"
                      : "bg-[#06130d] border border-[#1b3827] text-slate-300 hover:border-bpl-gold/50"
                  }`}
                >
                  {ov} Ov
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Teams & Players */}
        <div className="emerald-card rounded-2xl p-6 sm:p-8 border border-bpl-emerald/40 space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-bpl-gold tracking-wider">
            <Users className="w-4 h-4" /> Step 2: Teams & Player Squads
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Team A */}
            <div className="space-y-4 p-4 rounded-xl bg-[#06130d] border border-[#1b3827]">
              <div>
                <label className="block text-xs font-bold uppercase text-bpl-mint mb-1">
                  Team A Name
                </label>
                <input
                  type="text"
                  required
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  placeholder="e.g. Royal Strikers"
                  className="w-full bg-[#0a2719] border border-[#1b3827] focus:border-bpl-mint rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Add Players ({teamAPlayers.length} added)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlayerA}
                    onChange={(e) => setNewPlayerA(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddPlayerA(e)}
                    placeholder="Type name & hit Enter"
                    className="flex-1 bg-[#112217] border border-[#1b3827] focus:border-bpl-gold rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPlayerA()}
                    className="px-3 py-1.5 rounded-lg bg-bpl-mint/20 border border-bpl-mint/40 text-bpl-mint hover:bg-bpl-mint/30 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3 min-h-[40px]">
                  {teamAPlayers.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700/50 text-emerald-200 text-xs font-semibold"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemovePlayerA(p)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Team B */}
            <div className="space-y-4 p-4 rounded-xl bg-[#06130d] border border-[#1b3827]">
              <div>
                <label className="block text-xs font-bold uppercase text-blue-400 mb-1">
                  Team B Name
                </label>
                <input
                  type="text"
                  required
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  placeholder="e.g. Gully Kings"
                  className="w-full bg-[#0a1f33] border border-[#1b3827] focus:border-blue-400 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Add Players ({teamBPlayers.length} added)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlayerB}
                    onChange={(e) => setNewPlayerB(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddPlayerB(e)}
                    placeholder="Type name & hit Enter"
                    className="flex-1 bg-[#112217] border border-[#1b3827] focus:border-bpl-gold rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPlayerB()}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3 min-h-[40px]">
                  {teamBPlayers.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-700/50 text-blue-200 text-xs font-semibold"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemovePlayerB(p)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Toss & Starters */}
        <div className="emerald-card rounded-2xl p-6 sm:p-8 border border-bpl-emerald/40 space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-bpl-gold tracking-wider">
            <Flame className="w-4 h-4" /> Step 3: Toss & Opening Starters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Toss Won By
              </label>
              <select
                value={tossWinner}
                onChange={(e) => setTossWinner(e.target.value as any)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              >
                <option value="TEAM_A">{teamAName || "Team A"}</option>
                <option value="TEAM_B">{teamBName || "Team B"}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Elected To
              </label>
              <select
                value={tossDecision}
                onChange={(e) => setTossDecision(e.target.value as any)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              >
                <option value="BAT">🏏 Bat First</option>
                <option value="BOWL">⚾ Bowl First</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#06130d] border border-bpl-gold/30">
            <div className="text-xs text-bpl-gold font-bold uppercase mb-3">
              1st Innings: <span className="text-white">{battingTeamName}</span> Batting vs{" "}
              <span className="text-white">{bowlingTeamName}</span> Bowling
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-bpl-mint mb-1">
                  Striker (*)
                </label>
                <select
                  value={strikerName}
                  onChange={(e) => setStrikerName(e.target.value)}
                  className="w-full bg-[#112217] border border-[#1b3827] focus:border-bpl-mint rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">{battingPlayers[0] || "Select Striker"}</option>
                  {battingPlayers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Non-Striker
                </label>
                <select
                  value={nonStrikerName}
                  onChange={(e) => setNonStrikerName(e.target.value)}
                  className="w-full bg-[#112217] border border-[#1b3827] focus:border-bpl-mint rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">{battingPlayers[1] || "Select Non-Striker"}</option>
                  {battingPlayers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-blue-400 mb-1">
                  Opening Bowler
                </label>
                <select
                  value={bowlerName}
                  onChange={(e) => setBowlerName(e.target.value)}
                  className="w-full bg-[#112217] border border-[#1b3827] focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">{bowlingPlayers[0] || "Select Bowler"}</option>
                  {bowlingPlayers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-bpl-gold via-yellow-400 to-amber-500 text-slate-950 font-black text-base uppercase tracking-wider hover:from-yellow-400 hover:to-amber-400 transition-all shadow-xl hover:shadow-yellow-500/20 transform hover:-translate-y-0.5 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <>Creating Match & Initializing...</>
            ) : (
              <>
                <Play className="w-5 h-5 fill-slate-950" /> Start Match & Score Now
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  RotateCcw, Play, RefreshCw, CheckCircle2,
  ShieldCheck, ArrowRightLeft, Shield
} from "lucide-react";
import { api } from "@/lib/api";
import { useMatchSocket } from "@/lib/socket";
import { LiveMatchState, Match } from "@/types";
import { ThisOverDeliveries } from "@/components/ThisOverDeliveries";

export default function AdminLiveScoringPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [initialState, setInitialState] = useState<LiveMatchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Match Toss & Setup state
  const [tossWinnerId, setTossWinnerId] = useState("");
  const [tossDecision, setTossDecision] = useState<"BAT" | "BOWL">("BAT");
  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");

  // Wicket modal state
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState("BOWLED");
  const [dismissedBatsmanId, setDismissedBatsmanId] = useState("");
  const [newBatsmanId, setNewBatsmanId] = useState("");

  // New Bowler modal state
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [selectedNewBowlerId, setSelectedNewBowlerId] = useState("");

  // Real-time socket sync
  const { data: liveState, setData: setLiveState } = useMatchSocket(matchId, initialState);

  const loadData = async () => {
    try {
      // Ensure guest session if unauthenticated
      if (typeof window !== "undefined" && !localStorage.getItem("bpl_token")) {
        try {
          const guestRes = await api.post("/auth/guest", { username: "Gully Scorer" });
          localStorage.setItem("bpl_token", guestRes.data.access_token);
          localStorage.setItem("bpl_user", JSON.stringify(guestRes.data.user));
        } catch (e) {
          console.warn("Guest session setup error:", e);
        }
      }

      const [mRes, sRes] = await Promise.all([
        api.get(`/matches/${matchId}`),
        api.get(`/scoring/live/${matchId}`).catch(() => ({ data: null })),
      ]);
      setMatch(mRes.data);
      if (sRes.data) {
        setInitialState(sRes.data);
      }
      if (mRes.data) {
        setTossWinnerId(mRes.data.team_a_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [matchId]);

  const state = liveState || initialState;

  // 1. Scoring Action: Deliver Runs (0, 1, 2, 3, 4, 6)
  const handleScoreRuns = async (runs: number) => {
    if (!state) return;
    setError(null);
    setActionLoading(true);
    try {
      const res = await api.post(`/scoring/ball/${matchId}`, {
        runs_scored: runs,
        extra_type: "NONE",
        extra_runs: 0,
        is_wicket: false,
      });
      setLiveState(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Scoring delivery failed");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Extras & Box Cricket Special Events
  const handleScoreExtra = async (extraType: string, runs: number = 0) => {
    if (!state) return;
    setError(null);
    setActionLoading(true);
    try {
      const res = await api.post(`/scoring/ball/${matchId}`, {
        runs_scored: runs,
        extra_type: extraType,
        extra_runs: extraType === "WIDE" || extraType === "NO_BALL" ? (runs || 1) : runs,
        is_wicket: false,
      });
      setLiveState(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Extra scoring failed");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Wicket Delivery
  const handleConfirmWicket = async () => {
    if (!state) return;
    setError(null);
    setActionLoading(true);
    try {
      const res = await api.post(`/scoring/ball/${matchId}`, {
        runs_scored: 0,
        extra_type: "NONE",
        extra_runs: 0,
        is_wicket: true,
        wicket_type: wicketType,
        dismissed_player_id: dismissedBatsmanId || state.striker?.id,
      });
      setLiveState(res.data);
      setShowWicketModal(false);

      if (newBatsmanId) {
        const nextRes = await api.post(`/scoring/select-batsman/${matchId}`, {
          batsman_id: newBatsmanId,
        });
        setLiveState(nextRes.data);
        setNewBatsmanId("");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to record wicket");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. UNDO LAST BALL
  const handleUndo = async () => {
    if (!confirm("Are you sure you want to UNDO the last delivery? This will restore the exact prior score, overs, batsmen and bowling figures.")) return;
    setError(null);
    setActionLoading(true);
    try {
      const res = await api.post(`/scoring/undo/${matchId}`);
      setLiveState(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Undo failed");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Change Strike manually
  const handleSwapStrike = async () => {
    try {
      const res = await api.post(`/scoring/swap-strike/${matchId}`);
      setLiveState(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to swap strike");
    }
  };

  // 6. Switch Bowler
  const handleConfirmBowler = async () => {
    if (!selectedNewBowlerId) return;
    try {
      const res = await api.post(`/scoring/switch-bowler/${matchId}`, {
        bowler_id: selectedNewBowlerId,
      });
      setLiveState(res.data);
      setShowBowlerModal(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to switch bowler");
    }
  };

  // 7. Start Match / Initialize Playing XI
  const handleStartMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    setError(null);
    setActionLoading(true);

    try {
      const battingTeamId = tossDecision === "BAT" ? tossWinnerId : (tossWinnerId === match.team_a_id ? match.team_b_id : match.team_a_id);
      const bowlingTeamId = battingTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;

      const teamAPlayerIds = match.team_a.players.map((p) => p.user_id);
      const teamBPlayerIds = match.team_b.players.map((p) => p.user_id);

      await api.post(`/matches/${matchId}/start`, {
        batting_team_id: battingTeamId,
        bowling_team_id: bowlingTeamId,
        striker_id: strikerId,
        non_striker_id: nonStrikerId,
        bowler_id: bowlerId,
        team_a_playing_xi: teamAPlayerIds,
        team_b_playing_xi: teamBPlayerIds,
      });

      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start match");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !match) {
    return (
      <div className="py-24 flex justify-center items-center text-slate-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-bpl-gold" /> Loading scoring pad...
      </div>
    );
  }

  if (match.status === "UPCOMING" || !state) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="border-b border-[#1b3827] pb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-bpl-gold mb-1">
            <ShieldCheck className="w-4 h-4" /> Match Initialization
          </div>
          <h1 className="text-3xl font-black uppercase text-white">
            {match.team_a.name} vs {match.team_b.name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Set toss result, batting order, opening batsmen and opening bowler to launch live scoring.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleStartMatch} className="emerald-card rounded-2xl p-6 sm:p-8 border border-bpl-emerald/40 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Toss Winner
              </label>
              <select
                value={tossWinnerId}
                onChange={(e) => setTossWinnerId(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              >
                <option value={match.team_a_id}>{match.team_a.name}</option>
                <option value={match.team_b_id}>{match.team_b.name}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Toss Decision
              </label>
              <select
                value={tossDecision}
                onChange={(e) => setTossDecision(e.target.value as any)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              >
                <option value="BAT">Elected to BAT first</option>
                <option value="BOWL">Elected to BOWL first</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1b3827] grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-bpl-mint mb-1.5">
                Opening Striker (*)
              </label>
              <select
                required
                value={strikerId}
                onChange={(e) => setStrikerId(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="">Select Striker...</option>
                {[...match.team_a.players, ...match.team_b.players].map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.user.username} ({p.user.user_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Non-Striker
              </label>
              <select
                required
                value={nonStrikerId}
                onChange={(e) => setNonStrikerId(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="">Select Non-Striker...</option>
                {[...match.team_a.players, ...match.team_b.players].map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.user.username} ({p.user.user_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-bpl-gold mb-1.5">
                Opening Bowler
              </label>
              <select
                required
                value={bowlerId}
                onChange={(e) => setBowlerId(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="">Select Bowler...</option>
                {[...match.team_a.players, ...match.team_b.players].map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.user.username} ({p.user.user_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-bpl-gold to-yellow-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:from-yellow-400 transition-all shadow-lg flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" /> Start Live Match & Scoring
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1b3827] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-bpl-gold">{state.match_number}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-bold uppercase text-slate-400">Admin Live Control (Box Cricket)</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            {state.batting_team.name} vs {state.bowling_team.name}
          </h1>
        </div>

        {/* Action Bar with UNDO Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleUndo}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-xs uppercase tracking-wider border border-amber-500/40 transition-colors shadow"
            title="Roll back the previous ball state"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Undo Last Ball
          </button>

          <Link
            href={`/live/${matchId}`}
            target="_blank"
            className="text-xs font-bold uppercase text-slate-300 hover:text-white bg-[#112217] px-3.5 py-2 rounded-xl border border-[#1b3827]"
          >
            Public View ↗
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Main Scoreboard Display */}
      <div className="emerald-card rounded-3xl p-6 sm:p-8 border border-bpl-emerald/50 space-y-6 shadow-2xl">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-bpl-mint mb-1">
              {state.batting_team.name} (Innings {state.current_innings_number})
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-6xl sm:text-7xl font-black text-bpl-gold font-mono tracking-tight">
                {state.total_runs}/{state.wickets}
              </span>
              <span className="text-2xl font-bold text-slate-400 font-mono">
                ({state.overs} / {state.overs_per_innings} ov)
              </span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="text-sm font-semibold text-slate-300">
              CRR: <strong className="text-white font-mono text-base">{state.crr}</strong>
            </div>
            {state.target && (
              <div className="text-sm font-semibold text-bpl-gold">
                Target: <strong className="font-mono text-base">{state.target}</strong>
              </div>
            )}
            {state.rrr && (
              <div className="text-sm font-semibold text-rose-400">
                RRR: <strong className="font-mono text-base">{state.rrr}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Active Batsmen & Bowler Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Batsmen with Swap Strike button */}
          <div className="bg-[#06130d] rounded-2xl p-4 border border-[#1b3827] space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400 border-b border-[#1b3827] pb-2">
              <span>Batsmen On Field</span>
              <button
                onClick={handleSwapStrike}
                className="text-[11px] text-bpl-mint hover:text-white flex items-center gap-1 font-bold lowercase bg-[#112217] px-2 py-0.5 rounded border border-[#1b3827]"
              >
                <ArrowRightLeft className="w-3 h-3" /> swap strike
              </button>
            </div>

            {state.striker ? (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-bpl-gold">★</span> {state.striker.name} (Striker)
                </span>
                <span className="font-mono font-bold text-bpl-gold">
                  {state.striker.runs}* <span className="text-xs text-slate-400 font-normal">({state.striker.balls}b)</span>
                </span>
              </div>
            ) : (
              <div className="text-xs text-rose-400 font-bold">No striker on field! Select new batsman below.</div>
            )}

            {state.non_striker ? (
              <div className="flex justify-between items-center text-sm text-slate-300">
                <span>{state.non_striker.name} (Non-striker)</span>
                <span className="font-mono">
                  {state.non_striker.runs} <span className="text-xs text-slate-500">({state.non_striker.balls}b)</span>
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">Last man batting / no non-striker.</div>
            )}
          </div>

          {/* Active Bowler */}
          <div className="bg-[#06130d] rounded-2xl p-4 border border-[#1b3827] space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400 border-b border-[#1b3827] pb-2">
              <span>Current Bowler</span>
              <button
                onClick={() => setShowBowlerModal(true)}
                className="text-[11px] text-bpl-gold hover:text-white font-bold bg-[#112217] px-2 py-0.5 rounded border border-[#1b3827]"
              >
                Change Bowler
              </button>
            </div>

            {state.bowler ? (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-bpl-mint">{state.bowler.name}</span>
                <span className="font-mono font-bold text-white">
                  {state.bowler.wickets}/{state.bowler.runs} <span className="text-xs text-slate-400 font-normal">({state.bowler.overs} ov)</span>
                </span>
              </div>
            ) : (
              <div className="text-xs text-amber-400 font-bold flex items-center justify-between">
                <span>Over completed! Change bowler.</span>
                <button
                  onClick={() => setShowBowlerModal(true)}
                  className="px-2 py-1 rounded bg-bpl-gold text-slate-950 font-black text-xs"
                >
                  Select Bowler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Balls Strip */}
        <div className="pt-2">
          <ThisOverDeliveries currentOvers={state.overs} recentBalls={state.recent_balls} />
        </div>
      </div>

      {/* --- SCORING BUTTONS (BOX CRICKET COMPLIANT) --- */}
      <div className="emerald-card rounded-3xl p-6 sm:p-8 border border-bpl-emerald/40 space-y-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            RUNS OFF THE BAT
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 6].map((num) => (
              <button
                key={num}
                onClick={() => handleScoreRuns(num)}
                disabled={actionLoading}
                className={`py-6 rounded-2xl font-black text-2xl sm:text-3xl font-mono transition-all transform active:scale-95 shadow-lg border ${
                  num === 4
                    ? "bg-blue-900/60 hover:bg-blue-800 text-blue-200 border-blue-500/50"
                    : num === 6
                    ? "bg-gradient-to-tr from-bpl-gold to-yellow-400 text-slate-950 border-amber-300"
                    : num === 0
                    ? "bg-[#112217] hover:bg-[#1b3827] text-slate-300 border-[#1b3827]"
                    : "bg-bpl-forest/70 hover:bg-bpl-forest text-white border-bpl-emerald/50"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* BOX CRICKET SPECIAL SCORING BUTTONS */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-bpl-gold mb-3">
            BOX CRICKET BOUNDARIES & NET RULES
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleScoreExtra("WALL_HIT", 4)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-[#112217] hover:bg-[#1b3827] text-bpl-gold font-black text-xs uppercase tracking-wider border border-bpl-gold/40 shadow-sm"
            >
              Direct Wall 4
            </button>
            <button
              onClick={() => handleScoreExtra("WALL_HIT", 6)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-[#112217] hover:bg-[#1b3827] text-bpl-gold font-black text-xs uppercase tracking-wider border border-bpl-gold/40 shadow-sm"
            >
              Direct Wall 6
            </button>
            <button
              onClick={() => handleScoreExtra("ROOF_NET_HIT", 1)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-[#112217] hover:bg-[#1b3827] text-bpl-mint font-bold text-xs uppercase tracking-wider border border-bpl-mint/30 shadow-sm"
            >
              Top Net Hit (+1)
            </button>
            <button
              onClick={() => handleScoreExtra("ROOF_NET_HIT", 2)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-[#112217] hover:bg-[#1b3827] text-bpl-mint font-bold text-xs uppercase tracking-wider border border-bpl-mint/30 shadow-sm"
            >
              Top Net Hit (+2)
            </button>
          </div>
        </div>

        {/* EXTRAS ROW */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            EXTRAS & PENALTIES
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleScoreExtra("WIDE", 1)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-[#112217] hover:bg-[#1b3827] text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/30 transition-all active:scale-95"
            >
              WIDE (+1)
            </button>
            <button
              onClick={() => handleScoreExtra("NO_BALL", 1)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-[#112217] hover:bg-[#1b3827] text-rose-400 font-bold text-xs uppercase tracking-wider border border-rose-500/30 transition-all active:scale-95"
            >
              NO BALL (+1)
            </button>
            <button
              onClick={() => handleScoreExtra("BYE", 1)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-[#112217] hover:bg-[#1b3827] text-slate-200 font-bold text-xs uppercase tracking-wider border border-[#1b3827] transition-all active:scale-95"
            >
              BYE (+1)
            </button>
            <button
              onClick={() => handleScoreExtra("LEG_BYE", 1)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-[#112217] hover:bg-[#1b3827] text-slate-200 font-bold text-xs uppercase tracking-wider border border-[#1b3827] transition-all active:scale-95"
            >
              LEG BYE (+1)
            </button>
          </div>
        </div>

        {/* WICKET BUTTON */}
        <div>
          <button
            onClick={() => {
              setDismissedBatsmanId(state.striker?.id || "");
              setShowWicketModal(true);
            }}
            disabled={actionLoading}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-lg uppercase tracking-wider transition-all transform active:scale-98 shadow-xl flex items-center justify-center gap-2 border border-red-400/30"
          >
            WICKET OUT!
          </button>
        </div>
      </div>

      {/* --- WICKET MODAL WITH BOX CRICKET DISMISSALS --- */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="emerald-card max-w-md w-full rounded-2xl p-6 border border-bpl-emerald/50 space-y-5">
            <h3 className="text-xl font-black uppercase text-white">Record Dismissal</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Dismissed Batsman
              </label>
              <select
                value={dismissedBatsmanId}
                onChange={(e) => setDismissedBatsmanId(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white"
              >
                {state.striker && <option value={state.striker.id}>{state.striker.name} (Striker)</option>}
                {state.non_striker && <option value={state.non_striker.id}>{state.non_striker.name} (Non-striker)</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Dismissal Type (Standard & Box Cricket)
              </label>
              <select
                value={wicketType}
                onChange={(e) => setWicketType(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="BOWLED">Bowled</option>
                <option value="CAUGHT">Caught</option>
                <option value="RUN_OUT">Run Out</option>
                <option value="STUMPED">Stumped</option>
                <option value="HIT_WICKET">Hit Wicket</option>
                <option value="ONE_TIP_ONE_HAND">One-Tip-One-Hand Catch (Box Rule)</option>
                <option value="ROOF_NET_CATCH">Caught Off Top Net (Box Rule)</option>
                <option value="DIRECT_OUT_OF_BOX">Direct Out of Box Net</option>
                <option value="LBW">LBW (If enabled)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-bpl-mint mb-1.5">
                Next Batsman Coming In (Optional)
              </label>
              <select
                value={newBatsmanId}
                onChange={(e) => setNewBatsmanId(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="">Select next batsman later...</option>
                {[...match.team_a.players, ...match.team_b.players].map((p) => (
                  <option key={p.user_id} value={p.user_id}>{p.user.username}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowWicketModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#112217] text-slate-300 font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWicket}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CHANGE BOWLER MODAL --- */}
      {showBowlerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="emerald-card max-w-md w-full rounded-2xl p-6 border border-bpl-emerald/50 space-y-5">
            <h3 className="text-xl font-black uppercase text-white">Select Bowler</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Choose Bowler for Next Over
              </label>
              <select
                value={selectedNewBowlerId}
                onChange={(e) => setSelectedNewBowlerId(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="">Select Bowler...</option>
                {[...match.team_a.players, ...match.team_b.players].map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.user.username} ({p.user.user_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowBowlerModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#112217] text-slate-300 font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBowler}
                className="flex-1 py-2.5 rounded-xl bg-bpl-forest hover:bg-bpl-emerald text-white font-bold text-xs uppercase tracking-wider border border-bpl-gold/30"
              >
                Assign Bowler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  RotateCcw,
  Play,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  ArrowRightLeft,
  Shield,
  Share2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useMatchSocket } from "@/lib/socket";
import { LiveMatchState, Match } from "@/types";
import { ThisOverDeliveries } from "@/components/ThisOverDeliveries";
import { ShareMatchButton } from "@/components/ShareMatchButton";

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
        extra_runs: extraType === "WIDE" || extraType === "NO_BALL" ? runs || 1 : runs,
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
      const dismissedId = dismissedBatsmanId || state.striker?.id;
      const res = await api.post(`/scoring/ball/${matchId}`, {
        runs_scored: 0,
        extra_type: "NONE",
        extra_runs: 0,
        is_wicket: true,
        wicket_type: wicketType,
        dismissed_batsman_id: dismissedId,
        new_batsman_id: newBatsmanId || undefined,
      });
      setLiveState(res.data);
      setShowWicketModal(false);
      setDismissedBatsmanId("");
      setNewBatsmanId("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Wicket record failed");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Manual Strike Rotation
  const handleSwapStrike = async () => {
    if (!state) return;
    setError(null);
    setActionLoading(true);
    try {
      const res = await api.post(`/scoring/swap-strike/${matchId}`);
      setLiveState(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Swap strike failed");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Change Active Bowler
  const handleConfirmBowler = async () => {
    if (!selectedNewBowlerId) return;
    setError(null);
    setActionLoading(true);
    try {
      const res = await api.post(`/scoring/switch-bowler/${matchId}`, {
        bowler_id: selectedNewBowlerId,
      });
      setLiveState(res.data);
      setShowBowlerModal(false);
      setSelectedNewBowlerId("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to switch bowler");
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Undo Delivery
  const handleUndo = async () => {
    if (!state) return;
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

  // 7. Start Match & Set Initial Lineups
  const handleStartMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    setError(null);
    setActionLoading(true);

    try {
      const battingTeamId =
        tossWinnerId === match.team_a_id
          ? tossDecision === "BAT"
            ? match.team_a_id
            : match.team_b_id
          : tossDecision === "BAT"
          ? match.team_b_id
          : match.team_a_id;

      const bowlingTeamId =
        battingTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;

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
      <div className="py-24 flex justify-center items-center text-stone-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-red-600" /> Loading scoring console...
      </div>
    );
  }

  // If match hasn't started yet, show Toss & Setup Wizard
  if (match.status === "UPCOMING" || !state) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="border-b border-stone-200 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" /> Match Initialization
          </div>
          <h1 className="text-3xl font-black uppercase text-stone-900 tracking-tight">
            {match.team_a.name} vs {match.team_b.name}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Set toss result, batting order, opening batsmen and opening bowler to launch live scoring.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form
          onSubmit={handleStartMatch}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                Toss Winner
              </label>
              <select
                value={tossWinnerId}
                onChange={(e) => setTossWinnerId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-4 py-3 text-sm text-stone-900 font-semibold focus:outline-none"
              >
                <option value={match.team_a_id}>{match.team_a.name}</option>
                <option value={match.team_b_id}>{match.team_b.name}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                Toss Decision
              </label>
              <select
                value={tossDecision}
                onChange={(e) => setTossDecision(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-4 py-3 text-sm text-stone-900 font-semibold focus:outline-none"
              >
                <option value="BAT">Elected to BAT first</option>
                <option value="BOWL">Elected to BOWL first</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-red-600 mb-1.5">
                Opening Striker (*)
              </label>
              <select
                required
                value={strikerId}
                onChange={(e) => setStrikerId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-stone-900 font-medium focus:outline-none"
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
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                Non-Striker
              </label>
              <select
                required
                value={nonStrikerId}
                onChange={(e) => setNonStrikerId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-stone-900 font-medium focus:outline-none"
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
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1.5">
                Opening Bowler
              </label>
              <select
                required
                value={bowlerId}
                onChange={(e) => setBowlerId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-stone-900 font-medium focus:outline-none"
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
              className="px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white text-white" /> Start Live Match & Scoring
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Match is LIVE - Render Scorer Console
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Status & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[11px] uppercase tracking-wider">
              ● LIVE
            </span>
            <span className="font-mono text-xs font-bold text-stone-500 uppercase">
              {state.match_number}
            </span>
            <span className="text-xs text-stone-300">•</span>
            <span className="text-xs font-bold uppercase text-stone-500">
              Live Scorer Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-red-600 tracking-tight mt-1">
            {state.batting_team.name} vs {state.bowling_team.name}
          </h1>
        </div>

        {/* Action Bar with SHARE and UNDO Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Share Live Score Link Component */}
          <ShareMatchButton
            matchId={matchId}
            matchTitle={`${state.batting_team.name} vs ${state.bowling_team.name}`}
            scoreText={`${state.total_runs}/${state.wickets}`}
            oversText={`${state.overs} ov`}
            variant="primary"
          />

          <button
            onClick={handleUndo}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs uppercase tracking-wider border border-stone-300 transition-colors shadow-sm"
            title="Roll back the previous ball state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Undo Last Ball</span>
          </button>

          <Link
            href={`/live/${matchId}`}
            target="_blank"
            className="text-xs font-bold uppercase text-stone-700 hover:text-red-600 bg-white hover:bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-300 transition-colors shadow-sm"
          >
            Public View ↗
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Scoreboard Display (Matching Image 2) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
              {state.batting_team.name} (Innings {state.current_innings_number})
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-6xl sm:text-7xl font-black text-stone-900 font-mono tracking-tight">
                {state.total_runs}/{state.wickets}
              </span>
              <span className="text-2xl font-bold text-stone-400 font-mono">
                ({state.overs} / {state.overs_per_innings} ov)
              </span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="text-sm font-semibold text-stone-600">
              CRR: <strong className="text-stone-900 font-mono text-base">{state.crr}</strong>
            </div>
            {state.target && (
              <div className="text-sm font-semibold text-red-600">
                Target: <strong className="font-mono text-base">{state.target}</strong>
              </div>
            )}
            {state.rrr && (
              <div className="text-sm font-semibold text-stone-500">
                RRR: <strong className="font-mono text-base">{state.rrr}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Active Batsmen & Bowler Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Batsmen On Field */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase text-stone-500 border-b border-stone-200 pb-2">
              <span>Batsmen On Field</span>
              <button
                onClick={handleSwapStrike}
                className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-bold lowercase bg-red-50 px-2 py-0.5 rounded-lg border border-red-200"
              >
                <ArrowRightLeft className="w-3 h-3" /> swap strike
              </button>
            </div>

            {state.striker ? (
              <div className="flex justify-between items-center text-sm font-bold text-stone-900">
                <span className="flex items-center gap-1.5">
                  <span className="text-red-600">★</span> {state.striker.name}{" "}
                  <span className="text-xs font-normal text-stone-500">(Striker)</span>
                </span>
                <span className="font-mono text-stone-900">
                  {state.striker.runs}*{" "}
                  <span className="text-xs text-stone-400 font-normal">
                    ({state.striker.balls}b)
                  </span>
                </span>
              </div>
            ) : (
              <div className="text-xs text-red-500 font-bold">
                No striker on field! Select new batsman below.
              </div>
            )}

            {state.non_striker ? (
              <div className="flex justify-between items-center text-sm text-stone-700 font-medium">
                <span>
                  {state.non_striker.name}{" "}
                  <span className="text-xs text-stone-400">(Non-striker)</span>
                </span>
                <span className="font-mono text-stone-800">
                  {state.non_striker.runs}{" "}
                  <span className="text-xs text-stone-400">
                    ({state.non_striker.balls}b)
                  </span>
                </span>
              </div>
            ) : (
              <div className="text-xs text-stone-400 italic">
                Last man batting / no non-striker.
              </div>
            )}
          </div>

          {/* Active Bowler */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase text-stone-500 border-b border-stone-200 pb-2">
              <span>Current Bowler</span>
              <button
                onClick={() => setShowBowlerModal(true)}
                className="text-[11px] text-stone-700 hover:text-stone-900 font-bold bg-white px-2 py-0.5 rounded-lg border border-stone-200"
              >
                Change Bowler
              </button>
            </div>

            {state.bowler ? (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-red-600">{state.bowler.name}</span>
                <span className="font-mono font-bold text-stone-900">
                  {state.bowler.wickets}/{state.bowler.runs}{" "}
                  <span className="text-xs text-stone-400 font-normal">
                    ({state.bowler.overs} ov)
                  </span>
                </span>
              </div>
            ) : (
              <div className="text-xs text-stone-500 font-bold flex items-center justify-between">
                <span>Over completed! Change bowler.</span>
                <button
                  onClick={() => setShowBowlerModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-xs"
                >
                  Select Bowler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Balls Strip (Red Circles Matching Image 2) */}
        <div className="pt-2">
          <ThisOverDeliveries currentOvers={state.overs} recentBalls={state.recent_balls} />
        </div>
      </div>

      {/* --- SCORING BUTTONS PAD --- */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
            RUNS OFF THE BAT
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 6].map((num) => (
              <button
                key={num}
                onClick={() => handleScoreRuns(num)}
                disabled={actionLoading}
                className={`py-6 rounded-2xl font-black text-2xl sm:text-3xl font-mono transition-all transform active:scale-95 shadow-sm border ${
                  num === 4
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-md shadow-red-500/20"
                    : num === 6
                    ? "bg-rose-700 hover:bg-rose-800 text-white border-rose-700 shadow-md shadow-rose-500/20"
                    : num === 0
                    ? "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200"
                    : "bg-white hover:bg-stone-50 text-stone-900 border-stone-200"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* GULLY & BOX CRICKET SPECIAL SCORING BUTTONS */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
            GULLY & BOX CRICKET BOUNDARIES
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleScoreExtra("WALL_HIT", 4)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 font-black text-xs uppercase tracking-wider border border-stone-200 shadow-sm"
            >
              4D (Direct Wall 4)
            </button>
            <button
              onClick={() => handleScoreExtra("WALL_HIT", 2)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 font-black text-xs uppercase tracking-wider border border-stone-200 shadow-sm"
            >
              2D (Wall 2 Runs)
            </button>
            <button
              onClick={() => handleScoreExtra("ROOF_NET_HIT", 1)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 font-black text-xs uppercase tracking-wider border border-stone-200 shadow-sm"
            >
              1D (Net 1 Run)
            </button>
            <button
              onClick={() => setShowWicketModal(true)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/20"
            >
              🚨 OUT / WICKET
            </button>
          </div>
        </div>

        {/* STANDARD EXTRAS */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
            EXTRAS & SPECIAL DELIVERIES
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleScoreExtra("WIDE", 1)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-black text-xs uppercase tracking-wider shadow-sm"
            >
              WIDE (+1)
            </button>
            <button
              onClick={() => handleScoreExtra("NO_BALL", 1)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-black text-xs uppercase tracking-wider shadow-sm"
            >
              NO BALL (+1 RE-BALL)
            </button>
            <button
              onClick={() => handleScoreExtra("BYE", 1)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs uppercase tracking-wider shadow-sm"
            >
              BYE (+1)
            </button>
            <button
              onClick={() => handleScoreExtra("LEG_BYE", 1)}
              disabled={actionLoading}
              className="py-3.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs uppercase tracking-wider shadow-sm"
            >
              LEG BYE (+1)
            </button>
          </div>
        </div>
      </div>

      {/* --- WICKET MODAL WITH BOX CRICKET DISMISSALS --- */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xl space-y-5">
            <h3 className="text-xl font-black uppercase text-stone-900">Record Dismissal</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
                Dismissed Batsman
              </label>
              <select
                value={dismissedBatsmanId}
                onChange={(e) => setDismissedBatsmanId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-stone-900"
              >
                {state.striker && (
                  <option value={state.striker.id}>{state.striker.name} (Striker)</option>
                )}
                {state.non_striker && (
                  <option value={state.non_striker.id}>{state.non_striker.name} (Non-striker)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
                Dismissal Type (Standard & Box Cricket)
              </label>
              <select
                value={wicketType}
                onChange={(e) => setWicketType(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-stone-900"
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
              <label className="block text-xs font-bold uppercase text-red-600 mb-1.5">
                Next Batsman Coming In (Optional)
              </label>
              <select
                value={newBatsmanId}
                onChange={(e) => setNewBatsmanId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-stone-900"
              >
                <option value="">Select next batsman later...</option>
                {[...match.team_a.players, ...match.team_b.players].map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.user.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowWicketModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs uppercase hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWicket}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CHANGE BOWLER MODAL --- */}
      {showBowlerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xl space-y-5">
            <h3 className="text-xl font-black uppercase text-stone-900">Select Bowler</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
                Choose Bowler for Next Over
              </label>
              <select
                value={selectedNewBowlerId}
                onChange={(e) => setSelectedNewBowlerId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-stone-900"
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
                className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs uppercase hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBowler}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
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

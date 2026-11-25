"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Radio,
  RefreshCw,
  Trophy,
  Activity,
  MessageSquare,
  ChevronDown,
  CheckCircle2,
  Share2,
  Users,
  Shield,
} from "lucide-react";
import { api } from "@/lib/api";
import { useMatchSocket } from "@/lib/socket";
import { LiveMatchState } from "@/types";
import { ThisOverDeliveries } from "@/components/ThisOverDeliveries";
import { ShareMatchButton, WhatsAppIcon } from "@/components/ShareMatchButton";

export default function LiveMatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [initialData, setInitialData] = useState<LiveMatchState | null>(null);
  const [fullScorecard, setFullScorecard] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"live" | "scorecard" | "commentary">("live");
  const [loading, setLoading] = useState(true);

  // Hook up WebSocket with auto-reconnection and state sync
  const { data: liveState, isConnected } = useMatchSocket(matchId, initialData);

  useEffect(() => {
    async function fetchState() {
      try {
        const [liveRes, cardRes] = await Promise.all([
          api.get(`/scoring/live/${matchId}`),
          api.get(`/scoring/scorecard/${matchId}`),
        ]);
        setInitialData(liveRes.data);
        setFullScorecard(cardRes.data);
      } catch (err) {
        console.error("Error fetching match live state:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchState();
  }, [matchId]);

  const state = liveState || initialData;

  if (loading || !state) {
    return (
      <div className="py-24 flex flex-col justify-center items-center text-stone-500 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
        <span className="text-sm font-semibold">Connecting to Live Cricket Feed...</span>
      </div>
    );
  }

  // Win Prediction / Momentum calculation
  const totalTarget = state.target || 100;
  const currentRuns = state.total_runs || 0;
  const calcProbA = Math.min(
    85,
    Math.max(15, Math.round((currentRuns / (totalTarget || 1)) * 100))
  );
  const probA = state.current_innings_number === 2 ? calcProbA : 55;
  const probB = 100 - probA;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/live"
            className="p-1.5 -ml-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
          >
            ←
          </Link>
          <h2 className="text-sm font-black uppercase tracking-wider text-stone-800">Live Match</h2>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              isConnected
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-emerald-600 animate-pulse" : "bg-amber-500"
              }`}
            />
            {isConnected ? "Live Feed" : "Connecting..."}
          </div>

          <ShareMatchButton
            matchId={matchId}
            matchTitle={`${state.batting_team.name} vs ${state.bowling_team.name}`}
            scoreText={`${state.total_runs}/${state.wickets}`}
            oversText={`${state.overs} ov`}
            variant="secondary"
          />
        </div>
      </div>

      {/* Primary Cricket Score Card (Matching Image 2 Design) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6 relative overflow-hidden">
        {/* Card Header: Live Pill & Match Heading */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-600 text-white font-black text-[11px] uppercase tracking-wider shadow-sm">
            ● LIVE
          </div>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest pt-1">
            CRICLIVE BOX & GULLY TOURNAMENT • {state.match_number}
          </p>
          <h1 className="text-xl sm:text-2xl font-black uppercase text-red-600 tracking-wide">
            {state.batting_team.name} VS {state.bowling_team.name}
          </h1>
        </div>

        {/* Head-to-Head Scores Display */}
        <div className="grid grid-cols-5 items-center gap-2 pt-2 pb-2">
          {/* Batting Side */}
          <div className="col-span-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white text-lg font-black shadow-md flex-shrink-0">
              {state.batting_team.name.charAt(0)}
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight leading-none">
                {state.total_runs}/{state.wickets}
              </div>
              <div className="text-xs font-bold text-stone-400 font-mono mt-1">
                ★ {state.overs} / {state.overs_per_innings} ov
              </div>
            </div>
          </div>

          {/* VS Center Marker */}
          <div className="col-span-1 text-center">
            <span className="text-xs font-black uppercase text-stone-400 tracking-widest px-2 py-1 bg-stone-100 rounded-lg">
              VS
            </span>
          </div>

          {/* Bowling Side */}
          <div className="col-span-2 flex items-center justify-end gap-3 text-right">
            <div>
              <div className="text-xl sm:text-2xl font-black text-stone-700 font-mono tracking-tight leading-none">
                {state.target ? state.target - 1 : "0"}/{state.current_innings_number === 2 ? "all" : "-"}
              </div>
              <div className="text-xs font-bold text-stone-400 font-mono mt-1">
                {state.bowling_team.name}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-stone-200 flex items-center justify-center text-stone-700 text-lg font-black shadow-sm flex-shrink-0">
              {state.bowling_team.name.charAt(0)}
            </div>
          </div>
        </div>

        {/* Status / Equation Line */}
        <div className="text-center py-2 bg-stone-50 rounded-2xl border border-stone-100">
          <p className="text-xs sm:text-sm font-bold text-stone-800">
            {state.win_margin ? (
              <span className="text-emerald-600 font-black">{state.win_margin}</span>
            ) : state.target ? (
              <>
                {state.batting_team.name} needs{" "}
                <strong className="text-red-600 font-mono font-black">
                  {Math.max(0, state.target - state.total_runs)}
                </strong>{" "}
                runs in{" "}
                <strong className="font-mono font-black">
                  {Math.max(
                    0,
                    state.overs_per_innings * 6 - state.legal_balls
                  )}
                </strong>{" "}
                balls (RRR: {state.rrr || "-"})
              </>
            ) : (
              <>
                Innings 1 in Progress • Current Run Rate:{" "}
                <strong className="font-mono text-red-600">{state.crr}</strong>
              </>
            )}
          </p>
        </div>

        {/* Win Prediction Bar (Matching Image 2) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[11px] font-bold uppercase text-stone-500">
            <span>
              {probA}% {state.batting_team.name}
            </span>
            <span className="text-stone-400 font-semibold">Win Prediction</span>
            <span>
              {probB}% {state.bowling_team.name}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden flex">
            <div
              style={{ width: `${probA}%` }}
              className="bg-red-600 h-full transition-all duration-500"
            />
            <div
              style={{ width: `${probB}%` }}
              className="bg-stone-300 h-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Navigation Tabs (Live, Scorecard, Commentary) */}
        <div className="flex border-b border-stone-200 gap-8 pt-2">
          <button
            onClick={() => setActiveTab("live")}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "live"
                ? "border-red-600 text-red-600"
                : "border-transparent text-stone-400 hover:text-stone-800"
            }`}
          >
            Live
          </button>
          <button
            onClick={() => setActiveTab("scorecard")}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "scorecard"
                ? "border-red-600 text-red-600"
                : "border-transparent text-stone-400 hover:text-stone-800"
            }`}
          >
            Scorecard
          </button>
          <button
            onClick={() => setActiveTab("commentary")}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "commentary"
                ? "border-red-600 text-red-600"
                : "border-transparent text-stone-400 hover:text-stone-800"
            }`}
          >
            Ball Commentary
          </button>
        </div>

        {/* TAB 1: Live Tab (Batters, Bowlers, Over Circles - Exactly like Image 2) */}
        {activeTab === "live" && (
          <div className="space-y-6 pt-2">
            {/* Batting Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">
                Batting
              </h3>

              <div className="space-y-2">
                {state.striker && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                        {state.striker.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-900 flex items-center gap-1">
                          <span className="text-red-600">★</span> {state.striker.name}
                        </div>
                        <div className="text-[11px] text-stone-400 font-medium">Batsman</div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-base font-black text-stone-900">
                        {state.striker.runs}*
                      </span>
                      <span className="text-xs text-stone-400 ml-1">
                        ({state.striker.balls})
                      </span>
                    </div>
                  </div>
                )}

                {state.non_striker && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-xs">
                        {state.non_striker.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-800">
                          {state.non_striker.name}
                        </div>
                        <div className="text-[11px] text-stone-400 font-medium">Batsman</div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-base font-bold text-stone-700">
                        {state.non_striker.runs}
                      </span>
                      <span className="text-xs text-stone-400 ml-1">
                        ({state.non_striker.balls})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bowling Section */}
            {state.bowler && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">
                  Bowling
                </h3>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs">
                      {state.bowler.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">
                        {state.bowler.name}
                      </div>
                      <div className="text-[11px] text-stone-400 font-medium">Bowler</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-base font-black text-red-600">
                      {state.bowler.wickets}/{state.bowler.runs}
                    </span>
                    <span className="text-xs text-stone-400 ml-1">
                      ({state.bowler.overs} ov)
                    </span>
                  </div>
                </div>

                {/* Over Deliveries Strip (Red circles matching Image 2) */}
                <div className="pt-2">
                  <ThisOverDeliveries currentOvers={state.overs} recentBalls={state.recent_balls} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Full Detailed Scorecard */}
        {activeTab === "scorecard" && (
          <div className="space-y-6 pt-2">
            {fullScorecard?.innings?.map((inn: any) => (
              <div
                key={inn.innings_number}
                className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                  <h3 className="text-sm font-black uppercase text-stone-900">
                    {inn.batting_team_name} Innings
                  </h3>
                  <div className="font-mono font-bold text-red-600 text-base">
                    {inn.total_runs}/{inn.wickets}{" "}
                    <span className="text-xs text-stone-400">({inn.overs} Ov)</span>
                  </div>
                </div>

                {/* Batting Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[11px] font-bold uppercase text-stone-400 border-b border-stone-200">
                        <th className="py-2">Batter</th>
                        <th className="py-2">Dismissal</th>
                        <th className="py-2 text-right">R</th>
                        <th className="py-2 text-right">B</th>
                        <th className="py-2 text-right">4s</th>
                        <th className="py-2 text-right">6s</th>
                        <th className="py-2 text-right">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/60">
                      {inn.batters.map((bt: any) => (
                        <tr key={bt.id} className="hover:bg-white/80">
                          <td className="py-2 font-bold text-stone-900">{bt.name}</td>
                          <td className="py-2 text-stone-400 italic">{bt.dismissal}</td>
                          <td className="py-2 text-right font-mono font-black text-red-600">
                            {bt.runs}
                          </td>
                          <td className="py-2 text-right font-mono text-stone-500">{bt.balls}</td>
                          <td className="py-2 text-right font-mono text-stone-500">{bt.fours}</td>
                          <td className="py-2 text-right font-mono text-stone-500">{bt.sixes}</td>
                          <td className="py-2 text-right font-mono text-stone-700">{bt.sr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bowling Table */}
                <div className="overflow-x-auto pt-3 border-t border-stone-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[11px] font-bold uppercase text-stone-400 border-b border-stone-200">
                        <th className="py-2">Bowler</th>
                        <th className="py-2 text-right">O</th>
                        <th className="py-2 text-right">M</th>
                        <th className="py-2 text-right">R</th>
                        <th className="py-2 text-right">W</th>
                        <th className="py-2 text-right">ECON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/60">
                      {inn.bowlers.map((bw: any) => (
                        <tr key={bw.id} className="hover:bg-white/80">
                          <td className="py-2 font-bold text-stone-900">{bw.name}</td>
                          <td className="py-2 text-right font-mono text-stone-800">{bw.overs}</td>
                          <td className="py-2 text-right font-mono text-stone-400">
                            {bw.maidens}
                          </td>
                          <td className="py-2 text-right font-mono text-stone-700">{bw.runs}</td>
                          <td className="py-2 text-right font-mono font-black text-red-600">
                            {bw.wickets}
                          </td>
                          <td className="py-2 text-right font-mono text-stone-700">
                            {bw.economy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Ball-By-Ball Commentary */}
        {activeTab === "commentary" && (
          <div className="space-y-3 pt-2">
            {state.recent_balls.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-6 text-center">
                No commentary recorded yet.
              </p>
            ) : (
              [...state.recent_balls].reverse().map((b) => (
                <div
                  key={b.sequence}
                  className="rounded-2xl p-3 bg-stone-50 border border-stone-200 flex items-start gap-3"
                >
                  <div className="flex flex-col items-center flex-shrink-0">
                    <span className="font-mono text-[11px] font-bold text-stone-400">
                      {b.over}.{b.ball_in_over}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-full mt-1 flex items-center justify-center font-black text-xs ${
                        b.is_wicket
                          ? "bg-red-800 text-white"
                          : b.runs === 4 || b.runs === 6
                          ? "bg-red-600 text-white"
                          : "bg-white text-stone-800 border border-stone-300"
                      }`}
                    >
                      {b.label}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-stone-800 font-medium leading-relaxed">
                      {b.commentary || `${b.runs} runs scored.`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Share Card */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <WhatsAppIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-emerald-950">
              Share Live Match on WhatsApp
            </h4>
            <p className="text-xs text-emerald-800">
              Send real-time score updates to your cricket friends & group chats in 1 click.
            </p>
          </div>
        </div>
        <ShareMatchButton
          matchId={matchId}
          matchTitle={`${state.batting_team.name} vs ${state.bowling_team.name}`}
          scoreText={`${state.total_runs}/${state.wickets}`}
          oversText={`${state.overs} ov`}
          variant="primary"
        />
      </div>
    </div>
  );
}

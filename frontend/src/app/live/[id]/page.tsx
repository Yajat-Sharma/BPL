"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Radio, RefreshCw, Trophy, Activity, MessageSquare, ChevronDown, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useMatchSocket } from "@/lib/socket";
import { LiveMatchState } from "@/types";
import { ThisOverDeliveries } from "@/components/ThisOverDeliveries";

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
      <div className="py-24 flex flex-col justify-center items-center text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-bpl-gold" />
        <span className="text-sm">Connecting to Live Cricket Scoring Feed...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Live Header & Real-Time Connection Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1b3827] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-bpl-gold uppercase tracking-wider">
              {state.match_number}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {state.overs_per_innings} Overs Residential Match
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {state.batting_team.name} vs {state.bowling_team.name}
          </h1>
        </div>

        {/* Real-time WebSocket Status Pill */}
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            isConnected
              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
              : "bg-amber-950/40 text-amber-400 border-amber-800/40"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {isConnected ? "Live Sync Active" : "Reconnecting Feed..."}
          </div>

          <Link
            href={`/admin/score/${state.match_id}`}
            className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg bg-bpl-forest hover:bg-bpl-emerald text-white border border-bpl-gold/30 transition-colors"
          >
            Scoring Console
          </Link>
        </div>
      </div>

      {/* Primary Professional Cricket Score Banner */}
      <div className="emerald-card rounded-3xl p-6 sm:p-8 border border-bpl-emerald/50 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#0a2315] via-[#06130d] to-[#04110b]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Main Score figures */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-red-600 text-white font-black text-[11px] uppercase tracking-wider animate-pulse">
                {state.status}
              </span>
              <span className="text-xs text-bpl-mint font-semibold uppercase">
                Innings {state.current_innings_number}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {state.batting_team.name}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black text-bpl-gold font-mono tracking-tight">
                {state.total_runs}/{state.wickets}
              </span>
              <span className="text-lg font-bold text-slate-400 font-mono">
                ({state.overs} / {state.overs_per_innings} ov)
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-300 pt-2">
              <div>CRR: <strong className="text-white font-mono">{state.crr}</strong></div>
              {state.target && (
                <div>Target: <strong className="text-bpl-gold font-mono">{state.target}</strong></div>
              )}
              {state.rrr && (
                <div>RRR: <strong className="text-rose-400 font-mono">{state.rrr}</strong></div>
              )}
            </div>
          </div>

          {/* Active Batsmen & Bowler Table */}
          <div className="md:col-span-2 bg-[#06130d]/90 rounded-2xl p-5 border border-[#1b3827] space-y-4 shadow-inner">
            {/* Batsmen In Play */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex justify-between border-b border-[#1b3827] pb-1 mb-2">
                <span>Batter</span>
                <span className="flex gap-4">
                  <span className="w-8 text-center">R</span>
                  <span className="w-8 text-center">B</span>
                  <span className="w-8 text-center">4s</span>
                  <span className="w-8 text-center">6s</span>
                  <span className="w-12 text-right">SR</span>
                </span>
              </div>

              {state.striker && (
                <div className="flex justify-between items-center text-sm py-1 font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    <span className="text-bpl-gold">★</span> {state.striker.name} *
                  </div>
                  <div className="flex gap-4 font-mono">
                    <span className="w-8 text-center text-bpl-gold font-bold">{state.striker.runs}</span>
                    <span className="w-8 text-center text-slate-400">{state.striker.balls}</span>
                    <span className="w-8 text-center text-slate-400">{state.striker.fours}</span>
                    <span className="w-8 text-center text-slate-400">{state.striker.sixes}</span>
                    <span className="w-12 text-right text-slate-300">{state.striker.sr}</span>
                  </div>
                </div>
              )}

              {state.non_striker && (
                <div className="flex justify-between items-center text-sm py-1 font-medium text-slate-300">
                  <div>{state.non_striker.name}</div>
                  <div className="flex gap-4 font-mono text-slate-400">
                    <span className="w-8 text-center text-white">{state.non_striker.runs}</span>
                    <span className="w-8 text-center">{state.non_striker.balls}</span>
                    <span className="w-8 text-center">{state.non_striker.fours}</span>
                    <span className="w-8 text-center">{state.non_striker.sixes}</span>
                    <span className="w-12 text-right">{state.non_striker.sr}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bowler In Play */}
            {state.bowler && (
              <div className="pt-3 border-t border-[#1b3827]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex justify-between mb-1.5">
                  <span>Bowler</span>
                  <span className="flex gap-4">
                    <span className="w-8 text-center">O</span>
                    <span className="w-8 text-center">M</span>
                    <span className="w-8 text-center">R</span>
                    <span className="w-8 text-center">W</span>
                    <span className="w-12 text-right">ECON</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm py-0.5 text-white">
                  <div className="font-semibold text-bpl-mint">{state.bowler.name}</div>
                  <div className="flex gap-4 font-mono text-xs">
                    <span className="w-8 text-center font-bold">{state.bowler.overs}</span>
                    <span className="w-8 text-center text-slate-400">{state.bowler.maidens}</span>
                    <span className="w-8 text-center text-slate-300">{state.bowler.runs}</span>
                    <span className="w-8 text-center text-bpl-gold font-bold">{state.bowler.wickets}</span>
                    <span className="w-12 text-right text-slate-300">{state.bowler.econ}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Balls Strip */}
        <div className="mt-6 pt-5 border-t border-[#1b3827] flex flex-wrap items-center justify-between gap-4">
          <ThisOverDeliveries currentOvers={state.overs} recentBalls={state.recent_balls} />

          {state.win_margin && (
            <div className="text-xs font-bold px-3 py-1 rounded bg-bpl-emerald/20 text-bpl-mint border border-bpl-emerald/40 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-bpl-gold" /> {state.win_margin}
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Live Commentary / Full Scorecard */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[#1b3827]">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "live"
                ? "border-bpl-gold text-bpl-gold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4" /> Ball-By-Ball Commentary
          </button>
          <button
            onClick={() => setActiveTab("scorecard")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "scorecard"
                ? "border-bpl-gold text-bpl-gold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" /> Full Scorecard
          </button>
        </div>

        {/* TAB 1: Ball-by-Ball Commentary */}
        {activeTab === "live" && (
          <div className="space-y-4">
            {state.recent_balls.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-6">No commentary recorded yet.</p>
            ) : (
              [...state.recent_balls].reverse().map((b) => (
                <div
                  key={b.sequence}
                  className="emerald-card rounded-xl p-4 border border-[#1b3827] flex items-start gap-4 hover:border-bpl-emerald/40 transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {b.over}.{b.ball_in_over}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-full mt-1.5 flex items-center justify-center font-bold text-xs ${
                        b.is_wicket
                          ? "bg-red-600 text-white"
                          : b.runs === 4
                          ? "bg-blue-600 text-white"
                          : b.runs === 6
                          ? "bg-bpl-gold text-slate-950 font-black"
                          : "bg-[#112217] text-slate-300 border border-[#1b3827]"
                      }`}
                    >
                      {b.label}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      {b.commentary || `${b.runs} runs scored.`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: Full Detailed Scorecard */}
        {activeTab === "scorecard" && (
          <div className="space-y-8">
            {fullScorecard?.innings?.map((inn: any) => (
              <div key={inn.innings_number} className="emerald-card rounded-2xl p-6 border border-[#1b3827] space-y-6">
                <div className="flex justify-between items-center border-b border-[#1b3827] pb-3">
                  <h3 className="text-lg font-black uppercase text-white">
                    {inn.batting_team_name} Innings
                  </h3>
                  <div className="font-mono font-bold text-bpl-gold text-lg">
                    {inn.total_runs}/{inn.wickets} <span className="text-xs text-slate-400">({inn.overs} Ov)</span>
                  </div>
                </div>

                {/* Batting Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] font-bold uppercase text-slate-400 border-b border-[#1b3827]">
                        <th className="py-2">Batter</th>
                        <th className="py-2">Dismissal</th>
                        <th className="py-2 text-right">R</th>
                        <th className="py-2 text-right">B</th>
                        <th className="py-2 text-right">4s</th>
                        <th className="py-2 text-right">6s</th>
                        <th className="py-2 text-right">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b3827]/40">
                      {inn.batters.map((bt: any) => (
                        <tr key={bt.id} className="hover:bg-[#112217]/50">
                          <td className="py-2.5 font-bold text-white">{bt.name}</td>
                          <td className="py-2.5 text-xs text-slate-400 italic">{bt.dismissal}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-bpl-gold">{bt.runs}</td>
                          <td className="py-2.5 text-right font-mono text-slate-400">{bt.balls}</td>
                          <td className="py-2.5 text-right font-mono text-slate-400">{bt.fours}</td>
                          <td className="py-2.5 text-right font-mono text-slate-400">{bt.sixes}</td>
                          <td className="py-2.5 text-right font-mono text-slate-300">{bt.sr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bowling Table */}
                <div className="overflow-x-auto pt-4 border-t border-[#1b3827]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] font-bold uppercase text-slate-400 border-b border-[#1b3827]">
                        <th className="py-2">Bowler</th>
                        <th className="py-2 text-right">O</th>
                        <th className="py-2 text-right">M</th>
                        <th className="py-2 text-right">R</th>
                        <th className="py-2 text-right">W</th>
                        <th className="py-2 text-right">ECON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b3827]/40">
                      {inn.bowlers.map((bw: any) => (
                        <tr key={bw.id} className="hover:bg-[#112217]/50">
                          <td className="py-2.5 font-bold text-bpl-mint">{bw.name}</td>
                          <td className="py-2.5 text-right font-mono text-white">{bw.overs}</td>
                          <td className="py-2.5 text-right font-mono text-slate-400">{bw.maidens}</td>
                          <td className="py-2.5 text-right font-mono text-slate-300">{bw.runs}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-bpl-gold">{bw.wickets}</td>
                          <td className="py-2.5 text-right font-mono text-slate-300">{bw.economy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

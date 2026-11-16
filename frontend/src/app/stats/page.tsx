"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Award, Zap, Crosshair } from "lucide-react";
import { api } from "@/lib/api";
import { LeaderboardBatter, LeaderboardBowler } from "@/types";

export default function StatsPage() {
  const [topBatsmen, setTopBatsmen] = useState<LeaderboardBatter[]>([]);
  const [topBowlers, setTopBowlers] = useState<LeaderboardBowler[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [batRes, bowlRes] = await Promise.all([
          api.get("/stats/orange-cap"),
          api.get("/stats/purple-cap"),
        ]);
        setTopBatsmen(batRes.data);
        setTopBowlers(bowlRes.data);
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-[#1b3827] pb-6">
        <h1 className="text-3xl font-black uppercase text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-bpl-gold" />
          Player Statistics & Cap Leaderboards
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Tracking the highest run scorers (Orange Cap) and top wicket takers (Purple Cap) in BPL 2026.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orange Cap Leaderboard */}
        <div className="emerald-card rounded-2xl p-6 sm:p-8 border border-amber-500/30 space-y-6 bg-gradient-to-br from-[#1c1206]/70 to-[#06130d]">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase text-amber-400">Orange Cap</h2>
                <p className="text-xs text-slate-400">Leading Run Scorers</p>
              </div>
            </div>
            {topBatsmen[0] && (
              <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/40">
                Leader: {topBatsmen[0].name}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase text-slate-400 border-b border-[#1b3827]">
                  <th className="py-2.5">#</th>
                  <th className="py-2.5">Batsman</th>
                  <th className="py-2.5 text-center">Inn</th>
                  <th className="py-2.5 text-right font-bold text-amber-400">Runs</th>
                  <th className="py-2.5 text-right">4s</th>
                  <th className="py-2.5 text-right">6s</th>
                  <th className="py-2.5 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b3827]/40">
                {topBatsmen.map((b, idx) => (
                  <tr key={b.player_id} className="hover:bg-[#112217]/50">
                    <td className="py-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3">
                      <div className="font-bold text-white">{b.name}</div>
                      <div className="text-[10px] text-bpl-mint font-mono">{b.user_id}</div>
                    </td>
                    <td className="py-3 text-center text-slate-400 font-mono">{b.innings}</td>
                    <td className="py-3 text-right font-mono font-black text-base text-amber-400">{b.total_runs}</td>
                    <td className="py-3 text-right font-mono text-slate-400">{b.fours}</td>
                    <td className="py-3 text-right font-mono text-slate-400">{b.sixes}</td>
                    <td className="py-3 text-right font-mono text-slate-300">{b.strike_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purple Cap Leaderboard */}
        <div className="emerald-card rounded-2xl p-6 sm:p-8 border border-purple-500/30 space-y-6 bg-gradient-to-br from-[#1b0a26]/70 to-[#06130d]">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase text-purple-400">Purple Cap</h2>
                <p className="text-xs text-slate-400">Leading Wicket Takers</p>
              </div>
            </div>
            {topBowlers[0] && (
              <span className="text-xs font-mono font-black text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/40">
                Leader: {topBowlers[0].name}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase text-slate-400 border-b border-[#1b3827]">
                  <th className="py-2.5">#</th>
                  <th className="py-2.5">Bowler</th>
                  <th className="py-2.5 text-center">Overs</th>
                  <th className="py-2.5 text-right font-bold text-purple-400">Wkts</th>
                  <th className="py-2.5 text-right">Runs</th>
                  <th className="py-2.5 text-right">Econ</th>
                  <th className="py-2.5 text-right">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b3827]/40">
                {topBowlers.map((bw, idx) => (
                  <tr key={bw.player_id} className="hover:bg-[#112217]/50">
                    <td className="py-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3">
                      <div className="font-bold text-white">{bw.name}</div>
                      <div className="text-[10px] text-bpl-mint font-mono">{bw.user_id}</div>
                    </td>
                    <td className="py-3 text-center text-slate-400 font-mono">{bw.overs}</td>
                    <td className="py-3 text-right font-mono font-black text-base text-purple-400">{bw.wickets}</td>
                    <td className="py-3 text-right font-mono text-slate-400">{bw.runs_conceded}</td>
                    <td className="py-3 text-right font-mono text-slate-300">{bw.economy}</td>
                    <td className="py-3 text-right font-mono text-slate-300">{bw.average}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

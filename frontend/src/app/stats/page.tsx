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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider mb-2">
          <Award className="w-3.5 h-3.5" /> Player Leaderboards
        </div>
        <h1 className="text-3xl font-black uppercase text-stone-900 tracking-tight flex items-center gap-3">
          Tournament Statistics
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Tracking the highest run scorers (Orange Cap) and top wicket takers (Purple Cap).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orange Cap Leaderboard */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase text-stone-900">Orange Cap</h2>
                <p className="text-xs text-stone-400 font-semibold">Leading Run Scorers</p>
              </div>
            </div>
            {topBatsmen[0] && (
              <span className="text-xs font-mono font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                Leader: {topBatsmen[0].name}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase text-stone-400 border-b border-stone-100">
                  <th className="py-2.5">#</th>
                  <th className="py-2.5">Batter</th>
                  <th className="py-2.5 text-center">Inn</th>
                  <th className="py-2.5 text-right font-bold text-orange-600">Runs</th>
                  <th className="py-2.5 text-right">4s</th>
                  <th className="py-2.5 text-right">6s</th>
                  <th className="py-2.5 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {topBatsmen.map((b, idx) => (
                  <tr key={b.player_id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 font-mono font-bold text-stone-400">{idx + 1}</td>
                    <td className="py-3">
                      <div className="font-bold text-stone-900">{b.name}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{b.user_id}</div>
                    </td>
                    <td className="py-3 text-center text-stone-500 font-mono">{b.innings}</td>
                    <td className="py-3 text-right font-mono font-black text-base text-orange-600">
                      {b.total_runs}
                    </td>
                    <td className="py-3 text-right font-mono text-stone-500">{b.fours}</td>
                    <td className="py-3 text-right font-mono text-stone-500">{b.sixes}</td>
                    <td className="py-3 text-right font-mono text-stone-700">{b.strike_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purple Cap Leaderboard */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase text-stone-900">Purple Cap</h2>
                <p className="text-xs text-stone-400 font-semibold">Leading Wicket Takers</p>
              </div>
            </div>
            {topBowlers[0] && (
              <span className="text-xs font-mono font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Leader: {topBowlers[0].name}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase text-stone-400 border-b border-stone-100">
                  <th className="py-2.5">#</th>
                  <th className="py-2.5">Bowler</th>
                  <th className="py-2.5 text-center">Overs</th>
                  <th className="py-2.5 text-right font-bold text-purple-600">Wkts</th>
                  <th className="py-2.5 text-right">Runs</th>
                  <th className="py-2.5 text-right">Econ</th>
                  <th className="py-2.5 text-right">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {topBowlers.map((bw, idx) => (
                  <tr key={bw.player_id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 font-mono font-bold text-stone-400">{idx + 1}</td>
                    <td className="py-3">
                      <div className="font-bold text-stone-900">{bw.name}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{bw.user_id}</div>
                    </td>
                    <td className="py-3 text-center text-stone-500 font-mono">{bw.overs}</td>
                    <td className="py-3 text-right font-mono font-black text-base text-purple-600">
                      {bw.wickets}
                    </td>
                    <td className="py-3 text-right font-mono text-stone-500">{bw.runs_conceded}</td>
                    <td className="py-3 text-right font-mono text-stone-700">{bw.economy}</td>
                    <td className="py-3 text-right font-mono text-stone-700">{bw.average}</td>
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

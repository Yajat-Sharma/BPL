"use client";

import { useEffect, useState } from "react";
import { Trophy, HelpCircle, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import { PointsTableEntry } from "@/types";

export default function PointsTablePage() {
  const [standings, setStandings] = useState<PointsTableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTable() {
      try {
        const res = await api.get("/stats/points-table");
        setStandings(res.data);
      } catch (err) {
        console.error("Error loading points table:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTable();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5" /> League Rankings
        </div>
        <h1 className="text-3xl font-black uppercase text-stone-900 tracking-tight flex items-center gap-3">
          Tournament Points Standings
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Automated tournament points table and Net Run Rate (NRR) calculations updated in real-time.
        </p>
      </div>

      {/* Main Points Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-[11px] font-black uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4">Pos</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4 text-center">Played</th>
                <th className="py-3 px-4 text-center">Won</th>
                <th className="py-3 px-4 text-center">Lost</th>
                <th className="py-3 px-4 text-center">Tied</th>
                <th className="py-3 px-4 text-center">N/R</th>
                <th className="py-3 px-4 text-center">PTS</th>
                <th className="py-3 px-4 text-right">NRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {standings.map((t) => {
                const isTopFour = t.position <= 4;
                return (
                  <tr
                    key={t.team_id}
                    className={`hover:bg-stone-50 transition-colors ${
                      isTopFour ? "bg-red-50/20" : ""
                    }`}
                  >
                    <td className="py-4 px-4 font-mono font-black">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${
                          isTopFour
                            ? "bg-red-600 text-white font-black shadow-sm"
                            : "text-stone-400"
                        }`}
                      >
                        {t.position}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-black text-stone-900">{t.team_name}</div>
                      <div className="text-[10px] text-stone-400 font-mono font-semibold">
                        {t.short_code}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-stone-600 font-medium">
                      {t.played}
                    </td>
                    <td className="py-4 px-4 text-center text-stone-900 font-bold">{t.won}</td>
                    <td className="py-4 px-4 text-center text-stone-400 font-medium">
                      {t.lost}
                    </td>
                    <td className="py-4 px-4 text-center text-stone-400">{t.tied}</td>
                    <td className="py-4 px-4 text-center text-stone-400">{t.no_result}</td>
                    <td className="py-4 px-4 text-center font-mono font-black text-base text-red-600">
                      {t.points}
                    </td>
                    <td
                      className={`py-4 px-4 text-right font-mono font-bold text-xs ${
                        t.nrr >= 0 ? "text-emerald-600" : "text-stone-400"
                      }`}
                    >
                      {t.nrr > 0 ? `+${t.nrr.toFixed(3)}` : t.nrr.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend / NRR Note */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Top 4 teams qualify for knockout stage.
          </div>
          <div>Points: Win = 2 pts | Tie/NR = 1 pt | Loss = 0 pts</div>
        </div>
      </div>
    </div>
  );
}

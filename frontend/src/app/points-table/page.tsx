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
      <div className="border-b border-[#1b3827] pb-6">
        <h1 className="text-3xl font-black uppercase text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-bpl-gold" />
          BPL 2026 Points Standings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Automated tournament points table and Net Run Rate (NRR) calculations updated in real-time.
        </p>
      </div>

      {/* Main Points Table */}
      <div className="emerald-card rounded-2xl p-6 sm:p-8 border border-bpl-emerald/40 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1b3827] text-[11px] font-black uppercase tracking-wider text-slate-400">
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
            <tbody className="divide-y divide-[#1b3827]/60">
              {standings.map((t) => {
                const isTopFour = t.position <= 4;
                return (
                  <tr
                    key={t.team_id}
                    className={`hover:bg-[#112217]/60 transition-colors ${
                      isTopFour ? "bg-[#047857]/5" : ""
                    }`}
                  >
                    <td className="py-4 px-4 font-mono font-black">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${
                        isTopFour ? "bg-bpl-gold text-slate-950 font-black" : "text-slate-400"
                      }`}>
                        {t.position}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-base text-white">{t.team_name}</div>
                      <div className="text-xs text-slate-400 font-mono font-semibold">{t.short_code}</div>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-300 font-medium">{t.played}</td>
                    <td className="py-4 px-4 text-center text-bpl-mint font-bold">{t.won}</td>
                    <td className="py-4 px-4 text-center text-rose-400 font-medium">{t.lost}</td>
                    <td className="py-4 px-4 text-center text-slate-400">{t.tied}</td>
                    <td className="py-4 px-4 text-center text-slate-400">{t.no_result}</td>
                    <td className="py-4 px-4 text-center font-mono font-black text-lg text-bpl-gold">
                      {t.points}
                    </td>
                    <td className={`py-4 px-4 text-right font-mono font-bold text-sm ${
                      t.nrr >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {t.nrr > 0 ? `+${t.nrr.toFixed(3)}` : t.nrr.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend / NRR Note */}
        <div className="mt-6 pt-4 border-t border-[#1b3827] flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-bpl-gold inline-block" /> Top 4 teams qualify for the semi-finals knockout stage.
          </div>
          <div>
            Points: Win = 2 pts | Tie/NR = 1 pt | Loss = 0 pts
          </div>
        </div>
      </div>
    </div>
  );
}

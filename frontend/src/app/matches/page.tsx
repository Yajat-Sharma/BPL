"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Radio, Trophy, Clock, CheckCircle2, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { Match } from "@/types";

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState<"ALL" | "LIVE" | "UPCOMING" | "COMPLETED">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await api.get("/matches");
        setMatches(res.data);
      } catch (err) {
        console.error("Error loading matches:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  const filteredMatches = matches.filter((m) => {
    if (filter === "ALL") return true;
    return m.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b3827] pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-bpl-gold" />
            Tournament Fixtures
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete schedule, live games, and past match results for BPL 2026.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#06130d] p-1.5 rounded-xl border border-[#1b3827]">
          {(["ALL", "LIVE", "UPCOMING", "COMPLETED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                filter === tab
                  ? "bg-bpl-forest text-white border border-bpl-gold/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Match Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMatches.map((m) => (
          <div
            key={m.id}
            className="emerald-card rounded-2xl p-6 border border-[#1b3827] hover:border-bpl-emerald/50 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header Badge */}
              <div className="flex justify-between items-center text-xs font-bold uppercase mb-4">
                <span className="font-mono text-bpl-gold">{m.match_number}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                    m.status === "LIVE"
                      ? "bg-red-600 text-white animate-pulse"
                      : m.status === "COMPLETED"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                      : "bg-[#112217] text-slate-400 border border-[#1b3827]"
                  }`}
                >
                  {m.status}
                </span>
              </div>

              {/* Match Description */}
              {m.description && (
                <p className="text-xs text-slate-400 font-medium mb-3 line-clamp-1">
                  {m.description}
                </p>
              )}

              {/* Teams Display */}
              <div className="space-y-3 py-2 border-y border-[#1b3827]/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-white">{m.team_a.name}</span>
                  <span className="text-xs font-mono font-bold text-slate-400">{m.team_a.short_code}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-[#06130d] px-2 py-0.5 rounded border border-[#1b3827]">
                    VS
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-white">{m.team_b.name}</span>
                  <span className="text-xs font-mono font-bold text-slate-400">{m.team_b.short_code}</span>
                </div>
              </div>

              {/* Result Summary */}
              {m.win_margin && (
                <div className="mt-3 text-xs font-bold text-bpl-mint flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-bpl-gold" /> {m.win_margin}
                </div>
              )}
            </div>

            {/* Match Timing & Venue Footer */}
            <div className="mt-5 pt-4 border-t border-[#1b3827] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-bpl-mint" /> {m.venue}
                </span>
                <span className="font-mono text-slate-300">
                  {new Date(m.match_date).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <Link
                  href={`/live/${m.id}`}
                  className="flex-1 text-center py-2 rounded-lg bg-bpl-forest hover:bg-bpl-emerald text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  {m.status === "LIVE" ? "Watch Live" : "View Match Details"}
                </Link>
                {m.status === "LIVE" && (
                  <Link
                    href={`/admin/score/${m.id}`}
                    className="px-3 py-2 rounded-lg bg-bpl-gold text-slate-950 text-xs font-bold uppercase tracking-wider hover:bg-yellow-400 transition-colors"
                    title="Open Admin Scorer"
                  >
                    Score
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

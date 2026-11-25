"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Radio, Trophy, Clock, CheckCircle2, MapPin, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import { Match } from "@/types";
import { ShareMatchButton } from "@/components/ShareMatchButton";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5" /> CRICLIVE Schedule
          </div>
          <h1 className="text-3xl font-black uppercase text-stone-900 tracking-tight flex items-center gap-3">
            Tournament Fixtures
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Complete schedule, live games, and past match results.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm">
          {(["ALL", "LIVE", "UPCOMING", "COMPLETED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                filter === tab
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
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
            className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Header Badge */}
              <div className="flex justify-between items-center text-xs font-bold uppercase mb-3">
                <span className="font-mono text-stone-500 font-bold">{m.match_number}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                    m.status === "LIVE"
                      ? "bg-red-600 text-white animate-pulse"
                      : m.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {m.status}
                </span>
              </div>

              {/* Match Description */}
              {m.description && (
                <p className="text-xs text-stone-400 font-medium mb-3 line-clamp-1">
                  {m.description}
                </p>
              )}

              {/* Teams Display */}
              <div className="space-y-2 py-3 border-y border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="font-black text-base text-stone-900">{m.team_a.name}</span>
                  <span className="text-xs font-mono font-bold text-stone-400">{m.team_a.short_code}</span>
                </div>
                <div className="text-[10px] text-stone-400 font-black uppercase text-center">VS</div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-base text-stone-900">{m.team_b.name}</span>
                  <span className="text-xs font-mono font-bold text-stone-400">{m.team_b.short_code}</span>
                </div>
              </div>

              {/* Venue & Date */}
              <div className="mt-3 space-y-1 text-xs text-stone-500">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                  <span className="truncate">{m.venue}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                  <span>
                    {new Date(m.match_date).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(m.match_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Win Margin if Completed */}
              {m.win_margin && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">{m.win_margin}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions: View Live + Share */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <Link
                href={m.status === "LIVE" ? `/live/${m.id}` : `/live/${m.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider"
              >
                {m.status === "LIVE" ? "Watch Live →" : "View Scorecard →"}
              </Link>

              <ShareMatchButton
                matchId={m.id}
                matchTitle={`${m.team_a.name} vs ${m.team_b.name}`}
                variant="icon"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

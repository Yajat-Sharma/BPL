"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio, Calendar, Trophy, ChevronRight, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Match } from "@/types";

export default function LiveCenterIndexPage() {
  const router = useRouter();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await api.get("/matches");
        const lives = res.data.filter((m: Match) => m.status === "LIVE");
        setLiveMatches(lives);
        // If exactly 1 match is live, automatically redirect to its dedicated live dashboard!
        if (lives.length === 1) {
          router.replace(`/live/${lives[0].id}`);
        }
      } catch (err) {
        console.error("Error loading live matches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-[#1b3827] pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase text-white flex items-center gap-3">
            <Radio className="w-7 h-7 text-red-500 animate-pulse" />
            Live Match Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time ball-by-ball updates, live scorecards, and commentary for active matches.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center text-slate-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-bpl-gold" /> Loading matches...
        </div>
      ) : liveMatches.length === 0 ? (
        <div className="emerald-card rounded-2xl p-12 text-center border border-[#1b3827] max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#112217] flex items-center justify-center mx-auto text-slate-500 border border-[#1b3827]">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">No Match Currently In Progress</h3>
          <p className="text-sm text-slate-400">
            There are no active matches being scored right now. Check upcoming tournament fixtures or review completed scorecards.
          </p>
          <div className="pt-2">
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bpl-forest hover:bg-bpl-emerald text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Calendar className="w-4 h-4 text-bpl-gold" /> View Tournament Fixtures
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveMatches.map((m) => (
            <Link
              key={m.id}
              href={`/live/${m.id}`}
              className="emerald-card rounded-2xl p-6 border border-bpl-emerald/40 hover:border-bpl-gold transition-all block group"
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase mb-4 text-slate-400">
                <span className="text-bpl-gold">{m.match_number}</span>
                <span className="flex items-center gap-1.5 text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" /> LIVE
                </span>
              </div>
              <div className="space-y-3">
                <div className="text-lg font-bold text-white group-hover:text-bpl-gold transition-colors">
                  {m.team_a.name} vs {m.team_b.name}
                </div>
                <p className="text-xs text-slate-400">{m.venue}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#1b3827] flex justify-between items-center text-xs font-bold text-bpl-mint">
                <span>Click to Open Live Scoreboard</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

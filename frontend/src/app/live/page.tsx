"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio, Calendar, Trophy, ChevronRight, RefreshCw, Zap, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import { Match } from "@/types";
import { ShareMatchButton } from "@/components/ShareMatchButton";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Streaming & Scoring Hub
          </div>
          <h1 className="text-3xl font-black uppercase text-stone-900 tracking-tight flex items-center gap-3">
            Active Live Matches
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Real-time ball-by-ball scores, interactive scorecards, and commentary for matches in progress.
          </p>
        </div>

        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md self-start sm:self-auto"
        >
          <Zap className="w-4 h-4 fill-white text-white" /> Start New Match
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center text-stone-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-red-600" /> Loading live matches...
        </div>
      ) : liveMatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400 border border-stone-200">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black uppercase text-stone-900">No Active Matches Right Now</h3>
          <p className="text-sm text-stone-500 leading-relaxed">
            There are no matches being scored currently. Start a quick match or view upcoming tournament fixtures.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <Zap className="w-4 h-4 fill-white text-white" /> Start Match in 10s
            </Link>
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider border border-stone-200 transition-colors"
            >
              <Calendar className="w-4 h-4 text-stone-500" /> View All Fixtures
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveMatches.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md hover:border-red-300 transition-all space-y-4"
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase text-stone-400">
                <span className="font-mono text-stone-700 font-bold">{m.match_number}</span>
                <span className="flex items-center gap-1.5 text-white bg-red-600 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> LIVE
                </span>
              </div>

              <div>
                <Link
                  href={`/live/${m.id}`}
                  className="text-xl font-black uppercase text-red-600 hover:text-red-700 tracking-tight transition-colors block"
                >
                  {m.team_a.name} vs {m.team_b.name}
                </Link>
                <p className="text-xs text-stone-400 mt-1">{m.venue} • {m.overs_per_innings} Overs</p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                <Link
                  href={`/live/${m.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-red-600"
                >
                  <span>Open Live Scoreboard</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <ShareMatchButton
                  matchId={m.id}
                  matchTitle={`${m.team_a.name} vs ${m.team_b.name}`}
                  variant="secondary"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

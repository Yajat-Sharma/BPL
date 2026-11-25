"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Trophy,
  Radio,
  ArrowRight,
  Shield,
  Zap,
  ChevronRight,
  Award,
  Flame,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { Match, LiveMatchState, PointsTableEntry, LeaderboardBatter, LeaderboardBowler } from "@/types";
import { ThisOverDeliveries } from "@/components/ThisOverDeliveries";
import { ShareMatchButton } from "@/components/ShareMatchButton";

export default function HomePage() {
  const [liveMatch, setLiveMatch] = useState<LiveMatchState | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<PointsTableEntry[]>([]);
  const [orangeCap, setOrangeCap] = useState<LeaderboardBatter | null>(null);
  const [purpleCap, setPurpleCap] = useState<LeaderboardBowler | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const matchesRes = await api.get("/matches");
        const allMatches: Match[] = matchesRes.data;
        const live = allMatches.find((m) => m.status === "LIVE");
        if (live) {
          const liveData = await api.get(`/scoring/live/${live.id}`);
          setLiveMatch(liveData.data);
        }
        setUpcomingMatches(allMatches.filter((m) => m.status === "UPCOMING").slice(0, 3));

        const statsRes = await api.get("/stats/summary");
        setStandings(statsRes.data.points_table?.slice(0, 4) || []);
        setOrangeCap(statsRes.data.orange_cap_leader || null);
        setPurpleCap(statsRes.data.purple_cap_leader || null);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Stream & Scorer Banner (Matching Image 2 Aesthetic) */}
      <section className="bg-white border-b border-stone-200 pt-10 pb-12 sm:pt-14 sm:pb-16 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-stone-900 uppercase max-w-4xl leading-tight">
              CRIC<span className="text-red-600">LIVE</span> MATCH SCORER
            </h1>

            <p className="mt-3 text-base sm:text-lg text-stone-500 max-w-2xl font-normal leading-relaxed">
              Instant ball-by-ball cricket scoring, live streams, and zero-friction match sharing for gully cricket, box leagues, and society tournaments.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3.5">
              <Link
                href="/create"
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-red-500/25 transform hover:-translate-y-0.5"
              >
                <Zap className="w-4 h-4 fill-white text-white" />
                Start Match / League
              </Link>
              <Link
                href="/live"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm border border-stone-200 transition-colors"
              >
                <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                Live Center
              </Link>
              <Link
                href="/matches"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 font-bold text-sm border border-stone-200 transition-colors"
              >
                Fixtures
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Prominent Live Match Card (Matching Image 2) */}
        {liveMatch && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
                <h2 className="text-lg font-black uppercase tracking-wider text-stone-900">
                  Match In Progress
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <ShareMatchButton
                  matchId={liveMatch.match_id}
                  matchTitle={`${liveMatch.batting_team.name} vs ${liveMatch.bowling_team.name}`}
                  scoreText={`${liveMatch.total_runs}/${liveMatch.wickets}`}
                  oversText={`${liveMatch.overs} ov`}
                  variant="secondary"
                />
                <Link
                  href={`/live/${liveMatch.match_id}`}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 uppercase"
                >
                  Live Details <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Batting Team Side */}
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider">
                    ● Batting Now
                  </span>
                  <h3 className="text-2xl font-black text-stone-900 uppercase">
                    {liveMatch.batting_team.name}
                  </h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-black text-stone-900 font-mono tracking-tight">
                      {liveMatch.total_runs}/{liveMatch.wickets}
                    </span>
                    <span className="text-sm font-bold text-stone-400 font-mono">
                      ({liveMatch.overs} / {liveMatch.overs_per_innings} ov)
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-stone-500 flex gap-4 pt-1">
                    <span>
                      CRR: <strong className="text-stone-900 font-mono">{liveMatch.crr}</strong>
                    </span>
                    {liveMatch.target && (
                      <span>
                        Target: <strong className="text-red-600 font-mono">{liveMatch.target}</strong>
                      </span>
                    )}
                    {liveMatch.rrr && (
                      <span>
                        RRR: <strong className="text-stone-700 font-mono">{liveMatch.rrr}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Batters on Pitch */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-200 pb-1 flex justify-between">
                    <span>On The Pitch</span>
                    <span className="text-red-600">R (B)</span>
                  </div>
                  {liveMatch.striker && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span className="text-red-600 text-xs">★</span> {liveMatch.striker.name}*
                      </span>
                      <span className="font-mono font-bold text-stone-900">
                        {liveMatch.striker.runs}{" "}
                        <span className="text-xs text-stone-400 font-normal">
                          ({liveMatch.striker.balls})
                        </span>
                      </span>
                    </div>
                  )}
                  {liveMatch.non_striker && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-stone-700">
                        {liveMatch.non_striker.name}
                      </span>
                      <span className="font-mono text-stone-700">
                        {liveMatch.non_striker.runs}{" "}
                        <span className="text-xs text-stone-400 font-normal">
                          ({liveMatch.non_striker.balls})
                        </span>
                      </span>
                    </div>
                  )}
                  {liveMatch.bowler && (
                    <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-xs">
                      <span className="text-stone-500">
                        Bowling: <strong className="text-stone-900">{liveMatch.bowler.name}</strong>
                      </span>
                      <span className="font-mono text-stone-700 font-bold">
                        {liveMatch.bowler.wickets}/{liveMatch.bowler.runs} ({liveMatch.bowler.overs})
                      </span>
                    </div>
                  )}
                </div>

                {/* Over Deliveries & Action */}
                <div className="space-y-4">
                  <div>
                    <ThisOverDeliveries
                      currentOvers={liveMatch.overs}
                      recentBalls={liveMatch.recent_balls}
                    />
                  </div>

                  {liveMatch.last_commentary && (
                    <p className="text-xs italic text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200 line-clamp-2">
                      &quot;{liveMatch.last_commentary}&quot;
                    </p>
                  )}

                  <Link
                    href={`/live/${liveMatch.match_id}`}
                    className="block text-center py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Enter Live Scoring Center
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Standings & Cap Leaders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Points Table Preview */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
              <h3 className="text-base font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-red-600" /> Tournament Standings
              </h3>
              <Link href="/points-table" className="text-xs font-bold text-red-600 hover:text-red-700">
                Full Table →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3 text-center">P</th>
                    <th className="py-2.5 px-3 text-center">W</th>
                    <th className="py-2.5 px-3 text-center">L</th>
                    <th className="py-2.5 px-3 text-center">PTS</th>
                    <th className="py-2.5 px-3 text-right">NRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {standings.map((t) => (
                    <tr key={t.team_id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-stone-400">{t.position}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900">{t.team_name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{t.short_code}</div>
                      </td>
                      <td className="py-3 px-3 text-center text-stone-600">{t.played}</td>
                      <td className="py-3 px-3 text-center text-stone-900 font-bold">{t.won}</td>
                      <td className="py-3 px-3 text-center text-stone-400">{t.lost}</td>
                      <td className="py-3 px-3 text-center font-black text-red-600 font-mono text-sm">
                        {t.points}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono text-xs font-bold ${
                          t.nrr >= 0 ? "text-emerald-600" : "text-stone-400"
                        }`}
                      >
                        {t.nrr > 0 ? `+${t.nrr.toFixed(3)}` : t.nrr.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leaders & Caps */}
          <div className="space-y-4">
            {/* Orange Cap */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-orange-600">
                    Orange Cap
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-stone-400">Most Runs</span>
              </div>
              {orangeCap ? (
                <div>
                  <h4 className="text-lg font-black text-stone-900">{orangeCap.name}</h4>
                  <p className="text-xs text-stone-400 font-mono">{orangeCap.user_id}</p>
                  <div className="mt-3 flex items-baseline justify-between border-t border-stone-100 pt-2">
                    <span className="text-2xl font-black text-orange-600 font-mono">
                      {orangeCap.total_runs}{" "}
                      <span className="text-xs font-normal text-stone-400">Runs</span>
                    </span>
                    <span className="text-xs text-stone-500">
                      SR: <strong className="font-mono text-stone-800">{orangeCap.strike_rate}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 py-2">Leaderboard updating...</p>
              )}
            </div>

            {/* Purple Cap */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-purple-600">
                    Purple Cap
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-stone-400">Most Wickets</span>
              </div>
              {purpleCap ? (
                <div>
                  <h4 className="text-lg font-black text-stone-900">{purpleCap.name}</h4>
                  <p className="text-xs text-stone-400 font-mono">{purpleCap.user_id}</p>
                  <div className="mt-3 flex items-baseline justify-between border-t border-stone-100 pt-2">
                    <span className="text-2xl font-black text-purple-600 font-mono">
                      {purpleCap.wickets}{" "}
                      <span className="text-xs font-normal text-stone-400">Wickets</span>
                    </span>
                    <span className="text-xs text-stone-500">
                      Econ:{" "}
                      <strong className="font-mono text-stone-800">{purpleCap.economy}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 py-2">Leaderboard updating...</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Fixtures */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-wider text-stone-900">
              Upcoming Fixtures
            </h3>
            <Link href="/matches" className="text-xs font-bold text-red-600 hover:text-red-700">
              All Matches →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingMatches.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3">
                    <span className="font-mono">{m.match_number}</span>
                    <span className="text-red-600 font-bold">
                      {new Date(m.match_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="space-y-1 mb-4">
                    <div className="font-black text-stone-900 text-base">{m.team_a.name}</div>
                    <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest text-center py-0.5">
                      VS
                    </div>
                    <div className="font-black text-stone-900 text-base">{m.team_b.name}</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-stone-100 text-xs text-stone-400 flex justify-between items-center">
                  <span className="truncate">{m.venue}</span>
                  <span className="font-bold text-stone-800">{m.overs_per_innings} Ov</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

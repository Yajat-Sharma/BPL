"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trophy, Radio, ArrowRight, Shield, Zap, ChevronRight, Award, Flame } from "lucide-react";
import { api } from "@/lib/api";
import { Match, LiveMatchState, PointsTableEntry, LeaderboardBatter, LeaderboardBowler } from "@/types";
import { ThisOverDeliveries } from "@/components/ThisOverDeliveries";

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
        // Fetch matches
        const matchesRes = await api.get("/matches");
        const allMatches: Match[] = matchesRes.data;
        const live = allMatches.find((m) => m.status === "LIVE");
        if (live) {
          const liveData = await api.get(`/scoring/live/${live.id}`);
          setLiveMatch(liveData.data);
        }
        setUpcomingMatches(allMatches.filter((m) => m.status === "UPCOMING").slice(0, 3));

        // Fetch standings & stats
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
    <div className="space-y-12 pb-16">
      {/* Hero Tournament Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#064e3b]/40 via-[#0a2719]/60 to-[#06130d] border-b border-[#1b3827] pt-12 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-bpl-emerald/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bpl-forest/80 border border-bpl-gold/40 text-bpl-gold text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              <Trophy className="w-3.5 h-3.5" /> Official Tournament Portal
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase max-w-4xl leading-tight">
              BAIRAJESHWAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-bpl-gold via-yellow-300 to-amber-500">PREMIER LEAGUE</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              Experience the excitement of residential cricket with live ball-by-ball score updates, real-time commentary, comprehensive scorecards and interactive leaderboards.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/live"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-bpl-gold to-yellow-500 text-slate-950 font-bold text-sm hover:from-yellow-400 hover:to-amber-400 transition-all shadow-lg hover:shadow-yellow-500/20 transform hover:-translate-y-0.5"
              >
                <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
                Watch Live Score
              </Link>
              <Link
                href="/matches"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#112217] hover:bg-[#1b3827] text-white font-semibold text-sm border border-[#1b3827] hover:border-bpl-emerald/40 transition-colors"
              >
                View All Fixtures
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Prominent Live Match Card */}
        {liveMatch && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <h2 className="text-xl font-black uppercase tracking-wider text-white">
                  Match In Progress
                </h2>
              </div>
              <Link
                href={`/live/${liveMatch.match_id}`}
                className="text-xs font-bold text-bpl-gold hover:text-yellow-300 flex items-center gap-1 uppercase"
              >
                Detailed Live Center <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="emerald-card rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-bpl-emerald/40">
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-bpl-mint/5 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Batting Team Side */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-bpl-mint flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-bpl-mint inline-block" /> Batting Now
                  </span>
                  <h3 className="text-2xl font-black text-white">{liveMatch.batting_team.name}</h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black text-bpl-gold font-mono tracking-tight">
                      {liveMatch.total_runs}/{liveMatch.wickets}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      ({liveMatch.overs} / {liveMatch.overs_per_innings} ov)
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-400 flex gap-4 pt-1">
                    <span>CRR: <strong className="text-white font-mono">{liveMatch.crr}</strong></span>
                    {liveMatch.target && (
                      <span>Target: <strong className="text-bpl-gold font-mono">{liveMatch.target}</strong></span>
                    )}
                    {liveMatch.rrr && (
                      <span>RRR: <strong className="text-red-400 font-mono">{liveMatch.rrr}</strong></span>
                    )}
                  </div>
                </div>

                {/* Live Batters & Bowler in Play */}
                <div className="bg-[#06130d]/80 rounded-xl p-4 border border-[#1b3827] space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#1b3827] pb-1 flex justify-between">
                    <span>On The Pitch</span>
                    <span className="text-bpl-mint">R (B)</span>
                  </div>
                  {liveMatch.striker && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span className="text-bpl-gold text-xs">★</span> {liveMatch.striker.name}*
                      </span>
                      <span className="font-mono font-bold text-bpl-gold">
                        {liveMatch.striker.runs} <span className="text-xs text-slate-400 font-normal">({liveMatch.striker.balls})</span>
                      </span>
                    </div>
                  )}
                  {liveMatch.non_striker && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-300">
                        {liveMatch.non_striker.name}
                      </span>
                      <span className="font-mono text-slate-300">
                        {liveMatch.non_striker.runs} <span className="text-xs text-slate-500 font-normal">({liveMatch.non_striker.balls})</span>
                      </span>
                    </div>
                  )}
                  {liveMatch.bowler && (
                    <div className="pt-2 border-t border-[#1b3827] flex justify-between items-center text-xs">
                      <span className="text-slate-400">Bowling: <strong className="text-white">{liveMatch.bowler.name}</strong></span>
                      <span className="font-mono text-slate-300">{liveMatch.bowler.wickets}/{liveMatch.bowler.runs} ({liveMatch.bowler.overs})</span>
                    </div>
                  )}
                </div>

                {/* Recent Balls & Commentary Preview */}
                <div className="space-y-4">
                  <div>
                    <ThisOverDeliveries currentOvers={liveMatch.overs} recentBalls={liveMatch.recent_balls} />
                  </div>

                  {liveMatch.last_commentary && (
                    <p className="text-xs italic text-slate-300 bg-[#06130d]/50 p-2.5 rounded-lg border border-[#1b3827]/50 line-clamp-2">
                      &quot;{liveMatch.last_commentary}&quot;
                    </p>
                  )}

                  <Link
                    href={`/live/${liveMatch.match_id}`}
                    className="block text-center py-2.5 rounded-lg bg-bpl-forest hover:bg-bpl-emerald text-white text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Enter Live Scoring Center
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Cap Leaders & Points Standings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Points Table Preview */}
          <div className="lg:col-span-2 emerald-card rounded-2xl p-6 border border-[#1b3827]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-bpl-gold" /> Tournament Standings
              </h3>
              <Link href="/points-table" className="text-xs font-bold text-bpl-gold hover:text-yellow-300">
                Full Table →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1b3827] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3 text-center">P</th>
                    <th className="py-2.5 px-3 text-center">W</th>
                    <th className="py-2.5 px-3 text-center">L</th>
                    <th className="py-2.5 px-3 text-center">PTS</th>
                    <th className="py-2.5 px-3 text-right">NRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b3827]/60">
                  {standings.map((t) => (
                    <tr key={t.team_id} className="hover:bg-[#112217]/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-400">{t.position}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{t.team_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{t.short_code}</div>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-300">{t.played}</td>
                      <td className="py-3 px-3 text-center text-bpl-mint font-bold">{t.won}</td>
                      <td className="py-3 px-3 text-center text-slate-400">{t.lost}</td>
                      <td className="py-3 px-3 text-center font-bold text-bpl-gold font-mono">{t.points}</td>
                      <td className={`py-3 px-3 text-right font-mono text-xs font-medium ${t.nrr >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {t.nrr > 0 ? `+${t.nrr.toFixed(3)}` : t.nrr.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tournament Caps Leaders */}
          <div className="space-y-6">
            {/* Orange Cap */}
            <div className="emerald-card rounded-2xl p-5 border border-amber-500/30 relative overflow-hidden bg-gradient-to-br from-[#1a1205] to-[#06130d]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                    <Flame className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">Orange Cap</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Most Runs</span>
              </div>
              {orangeCap ? (
                <div>
                  <h4 className="text-xl font-black text-white">{orangeCap.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">{orangeCap.user_id}</p>
                  <div className="mt-3 flex items-baseline justify-between border-t border-amber-500/20 pt-2">
                    <span className="text-2xl font-black text-amber-400 font-mono">{orangeCap.total_runs} <span className="text-xs font-normal text-slate-400">Runs</span></span>
                    <span className="text-xs text-slate-300">SR: <strong className="font-mono text-white">{orangeCap.strike_rate}</strong></span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">Leaderboard updating...</p>
              )}
            </div>

            {/* Purple Cap */}
            <div className="emerald-card rounded-2xl p-5 border border-purple-500/30 relative overflow-hidden bg-gradient-to-br from-[#180922] to-[#06130d]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
                    <Award className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-purple-400">Purple Cap</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Most Wickets</span>
              </div>
              {purpleCap ? (
                <div>
                  <h4 className="text-xl font-black text-white">{purpleCap.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">{purpleCap.user_id}</p>
                  <div className="mt-3 flex items-baseline justify-between border-t border-purple-500/20 pt-2">
                    <span className="text-2xl font-black text-purple-400 font-mono">{purpleCap.wickets} <span className="text-xs font-normal text-slate-400">Wickets</span></span>
                    <span className="text-xs text-slate-300">Econ: <strong className="font-mono text-white">{purpleCap.economy}</strong></span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">Leaderboard updating...</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Fixtures */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black uppercase tracking-wider text-white">Upcoming Fixtures</h3>
            <Link href="/matches" className="text-xs font-bold text-bpl-gold hover:text-yellow-300">
              All Matches →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingMatches.map((m) => (
              <div key={m.id} className="emerald-card rounded-2xl p-5 border border-[#1b3827] hover:border-bpl-emerald/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <span>{m.match_number}</span>
                    <span className="text-bpl-mint">{new Date(m.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="font-bold text-white text-base">{m.team_a.name}</div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center">VS</div>
                    <div className="font-bold text-white text-base">{m.team_b.name}</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#1b3827] text-xs text-slate-400 flex justify-between items-center">
                  <span className="truncate">{m.venue}</span>
                  <span className="font-semibold text-bpl-gold">{m.overs_per_innings} Ov</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

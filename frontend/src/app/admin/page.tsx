"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Users, Calendar, Radio, Settings, Trophy, UserCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get("/settings/overview");
        setStats(res.data);
      } catch (err) {
        console.error("Error loading admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Registered Residents", value: stats?.total_users || 0, icon: Users, color: "text-bpl-mint" },
    { label: "Participating Teams", value: stats?.total_teams || 8, icon: Trophy, color: "text-bpl-gold" },
    { label: "Squad Players", value: stats?.total_players || 0, icon: UserCheck, color: "text-blue-400" },
    { label: "Matches Live", value: stats?.matches_live || 0, icon: Radio, color: "text-red-500", ping: stats?.matches_live > 0 },
    { label: "Upcoming Matches", value: stats?.matches_upcoming || 0, icon: Calendar, color: "text-amber-400" },
    { label: "Completed Matches", value: stats?.matches_completed || 0, icon: ShieldCheck, color: "text-emerald-400" },
  ];

  const adminNav = [
    { title: "Team & Squad Management", desc: "Manage 8 teams, assign players by User ID, set captains", href: "/admin/teams", icon: Users },
    { title: "Match Scheduling & Fixtures", desc: "Create matches, select venues, overs and team pairings", href: "/admin/matches", icon: Calendar },
    { title: "Live Scoring Console", desc: "Dedicated scoring pad with legal balls, extras, wickets & undo", href: "/live", icon: Radio },
    { title: "Tournament Settings", desc: "Configure tournament name, points rules, and overs per match", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1b3827] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-bpl-gold mb-1">
            <ShieldCheck className="w-4 h-4" /> Super Administrator Portal
          </div>
          <h1 className="text-3xl font-black uppercase text-white">
            Tournament Management Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Control the entire BPL tournament: team rosters, fixtures, live scoring and rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tournament Status:</span>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-bpl-emerald/20 text-bpl-mint border border-bpl-emerald/40 uppercase">
            {stats?.tournament_status || "LIVE"}
          </span>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="emerald-card rounded-2xl p-4 border border-[#1b3827] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <Icon className={`w-4 h-4 ${card.color}`} />
                {card.ping && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                )}
              </div>
              <div>
                <div className="text-2xl font-black font-mono text-white">{card.value}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {card.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Modules */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
          Management Controls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminNav.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className="emerald-card rounded-2xl p-6 border border-[#1b3827] hover:border-bpl-emerald/50 transition-all block group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-bpl-forest flex items-center justify-center border border-bpl-gold/30 text-bpl-gold group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-bpl-gold transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

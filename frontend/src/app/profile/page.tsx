"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User as UserIcon, Shield, Trophy, Users, Crown, Mail, Calendar, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { MemberProfile } from "@/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/auth/me");
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("bpl_token");
    localStorage.removeItem("bpl_user");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        Loading member profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Member Login Required</h2>
        <p className="text-sm text-slate-400">
          Sign in with your email OTP to view your assigned squad and team details.
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-5 py-2.5 rounded-xl bg-bpl-forest hover:bg-bpl-emerald text-white text-xs font-bold uppercase tracking-wider"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header */}
      <div className="emerald-card rounded-3xl p-6 sm:p-8 border border-bpl-emerald/50 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-bpl-forest to-bpl-mint flex items-center justify-center border border-bpl-gold/40 shadow-xl">
            <UserIcon className="w-8 h-8 text-bpl-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{profile.user.username}</h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-bpl-forest text-bpl-gold border border-bpl-gold/30">
                {profile.user.user_id}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <Mail className="w-3.5 h-3.5" /> {profile.user.email} • Role: <strong className="text-bpl-mint">{profile.user.role}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-bold uppercase tracking-wider border border-red-800/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      {/* Team & Teammates Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Team Card */}
        <div className="emerald-card rounded-2xl p-6 border border-[#1b3827] space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-bpl-gold" /> Your Assigned Team
          </h2>

          {profile.team ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow"
                  style={{ backgroundColor: profile.team.primary_color }}
                >
                  {profile.team.short_code.slice(0, 3)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{profile.team.name}</h3>
                  <div className="text-xs text-bpl-gold font-mono">{profile.team.short_code}</div>
                </div>
              </div>

              {profile.captain && (
                <div className="pt-3 border-t border-[#1b3827] text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Team Captain</span>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-bpl-gold" /> {profile.captain.username} ({profile.captain.user_id})
                  </div>
                </div>
              )}

              {profile.is_captain_of_team && (
                <div className="p-3 rounded-xl bg-bpl-gold/10 border border-bpl-gold/30 text-bpl-gold text-xs font-bold flex items-center gap-2">
                  <Crown className="w-4 h-4 text-bpl-gold" /> You are the Captain of this team!
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              You are not yet assigned to a team squad. The tournament administrator will add you using your User ID: <strong className="text-bpl-gold font-mono">{profile.user.user_id}</strong>.
            </div>
          )}
        </div>

        {/* Teammates List */}
        <div className="md:col-span-2 emerald-card rounded-2xl p-6 border border-[#1b3827] space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-bpl-mint" /> Teammates & Squad Roster
          </h2>

          {profile.teammates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.teammates.map((tm) => (
                <div
                  key={tm.id}
                  className="bg-[#06130d] rounded-xl p-3 border border-[#1b3827] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      {tm.username}
                      {tm.is_captain && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-bpl-gold text-slate-950 uppercase">
                          CPT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-bpl-mint font-mono">{tm.user_id}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-[#112217] px-2 py-0.5 rounded border border-[#1b3827]">
                      {tm.player_role.replace("_", " ")}
                    </span>
                    {tm.jersey_number && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">#{tm.jersey_number}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No teammates assigned yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

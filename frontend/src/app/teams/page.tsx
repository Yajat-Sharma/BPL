"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Shield, Crown, UserCheck, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Team } from "@/types";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await api.get("/teams");
        setTeams(res.data);
        if (res.data.length > 0) {
          setSelectedTeam(res.data[0]);
        }
      } catch (err) {
        console.error("Error loading teams:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeams();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1b3827] pb-6">
        <h1 className="text-3xl font-black uppercase text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-bpl-gold" />
          Participating Teams & Squads
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore all 8 residential cricket teams, their assigned captains, and verified squad players.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teams List (8 Teams) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            The 8 Tournament Franchises
          </h2>
          {teams.map((t) => {
            const isSelected = selectedTeam?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-bpl-forest/40 border-bpl-gold text-white shadow-lg"
                    : "emerald-card border-[#1b3827] text-slate-300 hover:border-bpl-emerald/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-slate-950 border border-white/20 shadow-sm"
                    style={{ backgroundColor: t.primary_color || "#047857", color: "#ffffff" }}
                  >
                    {t.short_code.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{t.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Captain: <span className="text-bpl-mint font-semibold">{t.captain?.username || "TBD"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-bpl-gold bg-[#06130d] px-2 py-1 rounded border border-[#1b3827]">
                    {t.players.length} Players
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Team Squad Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <div className="emerald-card rounded-2xl p-6 sm:p-8 border border-bpl-emerald/50 space-y-6">
              {/* Team Hero Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1b3827] pb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl border border-white/20"
                    style={{ backgroundColor: selectedTeam.primary_color }}
                  >
                    {selectedTeam.short_code.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase">{selectedTeam.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-bpl-gold uppercase">
                        {selectedTeam.short_code}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-300 flex items-center gap-1 font-semibold">
                        <Crown className="w-3.5 h-3.5 text-bpl-gold" /> Captain: {selectedTeam.captain?.username || "Not assigned"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Squad Strength</span>
                  <div className="text-2xl font-black text-bpl-mint font-mono">{selectedTeam.players.length}</div>
                </div>
              </div>

              {/* Squad Players Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-bpl-mint" /> Registered Squad Roster
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedTeam.players.map((tp) => (
                    <div
                      key={tp.id}
                      className="bg-[#06130d] rounded-xl p-4 border border-[#1b3827] flex items-center justify-between hover:border-bpl-emerald/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          {tp.user.username}
                          {tp.is_captain && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-bpl-gold text-slate-950 uppercase">
                              CPT
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-bpl-mint font-mono font-semibold">
                          ID: {tp.user.user_id}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-[#112217] px-2 py-0.5 rounded border border-[#1b3827]">
                          {tp.player_role.replace("_", " ")}
                        </span>
                        {tp.jersey_number && (
                          <div className="text-[10px] text-slate-500 font-mono mt-1">
                            #{tp.jersey_number}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="emerald-card rounded-2xl p-12 text-center text-slate-400">
              Select a team to view its squad roster.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

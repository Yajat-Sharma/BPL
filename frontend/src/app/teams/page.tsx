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
      <div className="border-b border-stone-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider mb-2">
          <Users className="w-3.5 h-3.5" /> CRICLIVE Teams
        </div>
        <h1 className="text-3xl font-black uppercase text-stone-900 tracking-tight flex items-center gap-3">
          Participating Squads
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Explore team rosters, verified players, and captain profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teams List */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">
            Tournament Teams ({teams.length})
          </h2>
          {teams.map((t) => {
            const isSelected = selectedTeam?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-red-50/60 border-red-600 text-stone-900 shadow-sm ring-1 ring-red-600"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: t.primary_color || "#EA2B2B" }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-sm text-stone-900">{t.name}</div>
                    <div className="text-[11px] text-stone-400 font-mono font-bold">
                      {t.short_code} • {t.players.length} Players
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 ${isSelected ? "text-red-600" : "text-stone-300"}`}
                />
              </button>
            );
          })}
        </div>

        {/* Selected Team Squad Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
              {/* Team Profile Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md flex-shrink-0"
                    style={{ backgroundColor: selectedTeam.primary_color || "#EA2B2B" }}
                  >
                    {selectedTeam.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase text-stone-900">
                      {selectedTeam.name}
                    </h2>
                    <p className="text-xs font-mono font-bold text-stone-400">
                      Code: {selectedTeam.short_code}
                    </p>
                  </div>
                </div>

                {selectedTeam.captain && (
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
                    <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Team Captain
                      </div>
                      <div className="text-xs font-bold text-stone-800">
                        {selectedTeam.captain.username}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Roster / Squad Players */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">
                  Registered Squad ({selectedTeam.players.length} Players)
                </h3>

                {selectedTeam.players.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-6 text-center">
                    No players registered in this squad yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTeam.players.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold">
                            {p.user.username.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                              {p.user.username}
                              {p.is_captain && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              {p.user.user_id}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600">
                          {p.player_role || "Player"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 text-stone-400">
              Select a team to view squad players.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

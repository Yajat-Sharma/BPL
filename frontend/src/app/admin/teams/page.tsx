"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Crown, Search, UserPlus, Check, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Team, User } from "@/types";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [bplUserId, setBplUserId] = useState("");
  const [playerRole, setPlayerRole] = useState("ALL_ROUNDER");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Team Form state
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamShortCode, setNewTeamShortCode] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#047857");

  const loadTeams = async () => {
    try {
      const res = await api.get("/teams");
      setTeams(res.data);
      if (res.data.length > 0 && !selectedTeam) {
        setSelectedTeam(res.data[0]);
      } else if (selectedTeam) {
        const updated = res.data.find((t: Team) => t.id === selectedTeam.id);
        if (updated) setSelectedTeam(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !bplUserId) return;
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await api.post(`/teams/${selectedTeam.id}/players`, {
        bpl_user_id: bplUserId.trim(),
        player_role: playerRole,
        jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
        is_captain: isCaptain,
      });

      setMessage(`Player added successfully to ${selectedTeam.name}!`);
      setBplUserId("");
      setJerseyNumber("");
      setIsCaptain(false);
      await loadTeams();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add player");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!selectedTeam) return;
    if (!confirm("Are you sure you want to remove this player from the squad?")) return;

    try {
      await api.delete(`/teams/${selectedTeam.id}/players/${playerId}`);
      await loadTeams();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to remove player");
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/teams", {
        name: newTeamName.trim(),
        short_code: newTeamShortCode.trim(),
        primary_color: newTeamColor,
      });
      setShowNewTeamModal(false);
      setNewTeamName("");
      setNewTeamShortCode("");
      await loadTeams();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create team");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1b3827] pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-bpl-gold" />
            Team & Squad Administration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage the 8 tournament franchises, search registered users by User ID (e.g. BPL001), and assemble squads.
          </p>
        </div>

        {teams.length < 8 && (
          <button
            onClick={() => setShowNewTeamModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bpl-forest hover:bg-bpl-emerald text-white text-xs font-bold uppercase tracking-wider transition-colors border border-bpl-gold/30"
          >
            <Plus className="w-4 h-4 text-bpl-gold" /> Create New Team
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" /> {error}
        </div>
      )}

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" /> {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teams List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tournament Teams ({teams.length}/8)
          </h2>
          {teams.map((t) => {
            const isSelected = selectedTeam?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-bpl-forest/50 border-bpl-gold text-white shadow-lg"
                    : "emerald-card border-[#1b3827] text-slate-300 hover:border-bpl-emerald/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: t.primary_color }}
                  >
                    {t.short_code.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{t.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Captain: <span className="text-bpl-mint">{t.captain?.username || "None"}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-bpl-gold">
                  {t.players.length} Players
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Team Detail & Add Player Section */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTeam ? (
            <>
              {/* Add Player Box */}
              <div className="emerald-card rounded-2xl p-6 border border-bpl-emerald/40 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-bpl-gold" />
                  Add Player to {selectedTeam.name} by User ID
                </h3>

                <form onSubmit={handleAddPlayer} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      User ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BPL005"
                      value={bplUserId}
                      onChange={(e) => setBplUserId(e.target.value.toUpperCase())}
                      className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Role
                    </label>
                    <select
                      value={playerRole}
                      onChange={(e) => setPlayerRole(e.target.value)}
                      className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="BATSMAN">Batsman</option>
                      <option value="BOWLER">Bowler</option>
                      <option value="ALL_ROUNDER">All-Rounder</option>
                      <option value="WICKET_KEEPER">Wicket-Keeper</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Jersey #
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 18"
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 rounded-lg bg-bpl-forest hover:bg-bpl-emerald text-white text-xs font-bold uppercase tracking-wider transition-colors border border-bpl-gold/30"
                    >
                      {loading ? "Adding..." : "Add to Squad"}
                    </button>
                  </div>
                </form>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isCaptain"
                    checked={isCaptain}
                    onChange={(e) => setIsCaptain(e.target.checked)}
                    className="rounded border-[#1b3827] bg-[#06130d] text-bpl-gold focus:ring-0"
                  />
                  <label htmlFor="isCaptain" className="text-xs text-slate-300 flex items-center gap-1 font-semibold">
                    <Crown className="w-3.5 h-3.5 text-bpl-gold" /> Make this player Team Captain
                  </label>
                </div>
              </div>

              {/* Current Squad Table */}
              <div className="emerald-card rounded-2xl p-6 border border-[#1b3827] space-y-4">
                <div className="flex justify-between items-center border-b border-[#1b3827] pb-3">
                  <h3 className="text-base font-bold text-white uppercase">
                    {selectedTeam.name} Squad Roster ({selectedTeam.players.length} players)
                  </h3>
                </div>

                <div className="space-y-2">
                  {selectedTeam.players.map((tp) => (
                    <div
                      key={tp.id}
                      className="bg-[#06130d] rounded-xl p-3 border border-[#1b3827] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-bpl-gold bg-[#112217] px-2 py-1 rounded border border-[#1b3827]">
                          {tp.user.user_id}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            {tp.user.username}
                            {tp.is_captain && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-bpl-gold text-slate-950 uppercase flex items-center gap-1">
                                <Crown className="w-3 h-3" /> Captain
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {tp.user.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-bpl-mint uppercase">
                          {tp.player_role.replace("_", " ")}
                        </span>
                        <button
                          onClick={() => handleRemovePlayer(tp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                          title="Remove from squad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="emerald-card rounded-2xl p-12 text-center text-slate-400">
              Select a team to manage its squad.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

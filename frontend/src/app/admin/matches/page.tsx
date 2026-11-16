"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, Play, CheckCircle2, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Match, Team } from "@/types";

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Fixture form
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("Bairajeshwar Cricket Ground (Turf 1)");
  const [overs, setOvers] = useState(10);
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        api.get("/matches"),
        api.get("/teams")
      ]);
      setMatches(mRes.data);
      setTeams(tRes.data);
      if (tRes.data.length >= 2) {
        setTeamAId(tRes.data[0].id);
        setTeamBId(tRes.data[1].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    // Default match date to tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setMatchDate(d.toISOString().slice(0, 16));
  }, []);

  const handleCreateFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamAId === teamBId) {
      setError("Team A and Team B cannot be the same franchise!");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await api.post("/matches", {
        team_a_id: teamAId,
        team_b_id: teamBId,
        match_date: new Date(matchDate).toISOString(),
        venue: venue,
        overs_per_innings: Number(overs),
        description: description,
      });

      setDescription("");
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to schedule fixture");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1b3827] pb-6">
        <h1 className="text-3xl font-black uppercase text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-bpl-gold" />
          Tournament Match Scheduling
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Create new fixtures between teams, set overs, timings, and venues.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Fixture Creator Form */}
      <div className="emerald-card rounded-2xl p-6 sm:p-8 border border-bpl-emerald/40 space-y-4">
        <h2 className="text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-bpl-gold" /> Schedule A New Fixture
        </h2>

        <form onSubmit={handleCreateFixture} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Team A
            </label>
            <select
              value={teamAId}
              onChange={(e) => setTeamAId(e.target.value)}
              className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.short_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Team B
            </label>
            <select
              value={teamBId}
              onChange={(e) => setTeamBId(e.target.value)}
              className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.short_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Match Venue
            </label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Overs Per Innings
            </label>
            <input
              type="number"
              required
              min={1}
              max={50}
              value={overs}
              onChange={(e) => setOvers(parseInt(e.target.value) || 10)}
              className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Description / Round
            </label>
            <input
              type="text"
              placeholder="e.g. Group Stage Round 1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-bpl-gold to-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:from-yellow-400 transition-all shadow"
            >
              {loading ? "Scheduling..." : "Save Match Fixture"}
            </button>
          </div>
        </form>
      </div>

      {/* Scheduled Matches List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          All Fixtures ({matches.length})
        </h2>

        <div className="space-y-3">
          {matches.map((m) => (
            <div
              key={m.id}
              className="emerald-card rounded-2xl p-5 border border-[#1b3827] flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-bold text-bpl-gold bg-[#06130d] px-3 py-1.5 rounded-lg border border-[#1b3827]">
                  {m.match_number}
                </span>
                <div>
                  <div className="font-bold text-base text-white">
                    {m.team_a.name} <span className="text-slate-500 text-xs">VS</span> {m.team_b.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {new Date(m.match_date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} • {m.venue} ({m.overs_per_innings} overs)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    m.status === "LIVE"
                      ? "bg-red-950/60 text-red-400 border border-red-800/50"
                      : m.status === "COMPLETED"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                      : "bg-[#112217] text-slate-400 border border-[#1b3827]"
                  }`}
                >
                  {m.status}
                </span>

                <a
                  href={`/admin/score/${m.id}`}
                  className="px-4 py-2 rounded-xl bg-bpl-forest hover:bg-bpl-emerald text-white text-xs font-bold uppercase tracking-wider transition-colors border border-bpl-gold/30 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-bpl-gold fill-bpl-gold" /> Open Scoring Pad
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

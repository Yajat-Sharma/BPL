"use client";

import { useEffect, useState } from "react";
import { Settings, Save, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminSettingsPage() {
  const [tournamentName, setTournamentName] = useState("");
  const [totalTeams, setTotalTeams] = useState(8);
  const [overs, setOvers] = useState(6);
  const [pointsWin, setPointsWin] = useState(2);
  const [pointsTie, setPointsTie] = useState(1);
  const [status, setStatus] = useState("LIVE");

  // Box Cricket Rules
  const [playersPerTeam, setPlayersPerTeam] = useState(8);
  const [maxWickets, setMaxWickets] = useState(7);
  const [allowLastManBatting, setAllowLastManBatting] = useState(false);
  const [wideRuns, setWideRuns] = useState(1);
  const [noBallRuns, setNoBallRuns] = useState(1);
  const [noBallReball, setNoBallReball] = useState(true);
  const [wideReball, setWideReball] = useState(true);
  const [roofNetHitRule, setRoofNetHitRule] = useState("DEAD_BALL");
  const [directHitWallRule, setDirectHitWallRule] = useState("RUNS_4");
  const [allowLbw, setAllowLbw] = useState(false);
  const [overLimitPerBowler, setOverLimitPerBowler] = useState(2);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get("/settings");
        const d = res.data;
        setTournamentName(d.tournament_name);
        setTotalTeams(d.total_teams);
        setOvers(d.overs_per_match);
        setPointsWin(d.points_win);
        setPointsTie(d.points_tie);
        setStatus(d.status);

        if (d.players_per_team !== undefined) setPlayersPerTeam(d.players_per_team);
        if (d.max_wickets !== undefined) setMaxWickets(d.max_wickets);
        if (d.allow_last_man_batting !== undefined) setAllowLastManBatting(d.allow_last_man_batting);
        if (d.wide_runs !== undefined) setWideRuns(d.wide_runs);
        if (d.no_ball_runs !== undefined) setNoBallRuns(d.no_ball_runs);
        if (d.no_ball_reball !== undefined) setNoBallReball(d.no_ball_reball);
        if (d.wide_reball !== undefined) setWideReball(d.wide_reball);
        if (d.roof_net_hit_rule !== undefined) setRoofNetHitRule(d.roof_net_hit_rule);
        if (d.direct_hit_wall_rule !== undefined) setDirectHitWallRule(d.direct_hit_wall_rule);
        if (d.allow_lbw !== undefined) setAllowLbw(d.allow_lbw);
        if (d.over_limit_per_bowler !== undefined) setOverLimitPerBowler(d.over_limit_per_bowler);
      } catch (err) {
        console.error(err);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.put("/settings", {
        tournament_name: tournamentName,
        total_teams: Number(totalTeams),
        overs_per_match: Number(overs),
        points_win: Number(pointsWin),
        points_tie: Number(pointsTie),
        status: status,
        players_per_team: Number(playersPerTeam),
        max_wickets: Number(maxWickets),
        allow_last_man_batting: allowLastManBatting,
        wide_runs: Number(wideRuns),
        no_ball_runs: Number(noBallRuns),
        no_ball_reball: noBallReball,
        wide_reball: wideReball,
        roof_net_hit_rule: roofNetHitRule,
        direct_hit_wall_rule: directHitWallRule,
        allow_lbw: allowLbw,
        over_limit_per_bowler: Number(overLimitPerBowler),
      });
      setMessage("Tournament & Box Cricket Rules saved successfully!");
    } catch {
      alert("Failed to update tournament settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="border-b border-[#1b3827] pb-6">
        <h1 className="text-3xl font-black uppercase text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-bpl-gold" />
          Box Cricket Rules & Tournament Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize box cricket match rules: player count, wickets allowed, net/roof contact penalties, wide/no-ball runs and bowler quotas.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* BOX CRICKET SPECIFIC CONFIGURATION */}
        <div className="emerald-card rounded-2xl p-6 sm:p-8 border border-bpl-gold/40 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1b3827] pb-3">
            <h2 className="text-lg font-black uppercase text-bpl-gold">
              🏏 Box Cricket Match Regulations
            </h2>
            <span className="text-xs bg-bpl-gold/10 text-bpl-gold px-2.5 py-1 rounded font-bold">
              Active Engine Rules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Players per Team
              </label>
              <input
                type="number"
                min={4}
                max={15}
                value={playersPerTeam}
                onChange={(e) => setPlayersPerTeam(parseInt(e.target.value) || 8)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Standard box cricket is 6 to 8 players</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Wickets Allowed to Fall
              </label>
              <input
                type="number"
                min={3}
                max={14}
                value={maxWickets}
                onChange={(e) => setMaxWickets(parseInt(e.target.value) || 7)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">e.g. 7 wickets = team all out</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Max Overs Per Bowler
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={overLimitPerBowler}
                onChange={(e) => setOverLimitPerBowler(parseInt(e.target.value) || 2)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Quota limit per player</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Wide Ball Penalty
              </label>
              <select
                value={wideRuns}
                onChange={(e) => setWideRuns(parseInt(e.target.value))}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value={1}>1 Run Penalty</option>
                <option value={2}>2 Runs Penalty</option>
                <option value={3}>3 Runs Penalty</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                No-Ball Penalty
              </label>
              <select
                value={noBallRuns}
                onChange={(e) => setNoBallRuns(parseInt(e.target.value))}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value={1}>1 Run + Free Hit</option>
                <option value={2}>2 Runs Penalty</option>
                <option value={4}>4 Runs Penalty</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Roof / Top Net Hit Rule
              </label>
              <select
                value={roofNetHitRule}
                onChange={(e) => setRoofNetHitRule(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="DEAD_BALL">Dead Ball (No runs, no ball count)</option>
                <option value="RUNS_1">Award 1 Run</option>
                <option value="RUNS_2">Award 2 Runs</option>
                <option value="OUT">Declared OUT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Direct Back Wall Strike
              </label>
              <select
                value={directHitWallRule}
                onChange={(e) => setDirectHitWallRule(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="RUNS_4">Automatic 4 Runs</option>
                <option value="RUNS_6">Automatic 6 Runs</option>
                <option value="RUN_PHYSICALLY">Must run physically</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-6 border-t border-[#1b3827]">
            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={allowLastManBatting}
                onChange={(e) => setAllowLastManBatting(e.target.checked)}
                className="rounded border-[#1b3827] bg-[#06130d] text-bpl-gold focus:ring-0"
              />
              Allow Last Man to Bat Alone
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={allowLbw}
                onChange={(e) => setAllowLbw(e.target.checked)}
                className="rounded border-[#1b3827] bg-[#06130d] text-bpl-gold focus:ring-0"
              />
              Enable LBW Dismissals (Default: Off)
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={noBallReball}
                onChange={(e) => setNoBallReball(e.target.checked)}
                className="rounded border-[#1b3827] bg-[#06130d] text-bpl-gold focus:ring-0"
              />
              Re-bowl No Balls
            </label>
          </div>
        </div>

        {/* GENERAL TOURNAMENT SETTINGS */}
        <div className="emerald-card rounded-2xl p-6 sm:p-8 border border-bpl-emerald/40 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            General Tournament Config
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Tournament Name
              </label>
              <input
                type="text"
                required
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Default Match Overs
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={overs}
                  onChange={(e) => setOvers(parseInt(e.target.value) || 6)}
                  className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Tournament Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                >
                  <option value="UPCOMING">Upcoming Tournament</option>
                  <option value="LIVE">Live & In Progress</option>
                  <option value="COMPLETED">Tournament Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-bpl-gold to-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:from-yellow-400 transition-all shadow"
          >
            <Save className="w-4 h-4" /> Save Regulations & Settings
          </button>
        </div>
      </form>
    </div>
  );
}

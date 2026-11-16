import Link from "next/link";
import { Trophy, Shield, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[#1b3827] bg-[#06130d] text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-bpl-forest flex items-center justify-center border border-bpl-gold/40">
                <Trophy className="w-4 h-4 text-bpl-gold" />
              </div>
              <span className="text-base font-black tracking-wider text-white">
                BAIRAJESHWAR PREMIER LEAGUE
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              The premier residential cricket tournament broadcasting platform. Real-time ball-by-ball commentary, live digital scorecards, automated standings and player cap leaderboards.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-bpl-gold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/live" className="hover:text-white transition-colors">Live Match Center</Link></li>
              <li><Link href="/matches" className="hover:text-white transition-colors">Tournament Fixtures</Link></li>
              <li><Link href="/teams" className="hover:text-white transition-colors">Participating Squads</Link></li>
              <li><Link href="/points-table" className="hover:text-white transition-colors">Points Standings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-bpl-gold mb-4">
              Tournament Portal
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Player Login / OTP</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Register as Resident</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">Super Admin Center</Link></li>
              <li><Link href="/stats" className="hover:text-white transition-colors">Orange & Purple Cap</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#1b3827]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Bairajeshwar Premier League (BPL). All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for Bairajeshwar Society with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}

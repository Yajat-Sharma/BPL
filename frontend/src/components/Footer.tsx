import Link from "next/link";
import { Trophy, Shield, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white text-stone-500 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm">
                <span className="text-sm">🏏</span>
              </div>
              <span className="text-lg font-black tracking-tight text-stone-900">
                CRIC<span className="text-red-600">LIVE</span>
              </span>
            </div>
            <p className="text-sm text-stone-500 max-w-md leading-relaxed">
              Real-time ball-by-ball cricket scoring, live streams, interactive digital scorecards, and instant match sharing for gully cricket, box leagues, and society tournaments.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-4">
              Match Center
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/live" className="hover:text-red-600 transition-colors">
                  Live Match Center
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-red-600 transition-colors">
                  Start Match / League
                </Link>
              </li>
              <li>
                <Link href="/matches" className="hover:text-red-600 transition-colors">
                  All Fixtures
                </Link>
              </li>
              <li>
                <Link href="/teams" className="hover:text-red-600 transition-colors">
                  Teams & Squads
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-4">
              Stats & Portal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/points-table" className="hover:text-red-600 transition-colors">
                  Points Table
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-red-600 transition-colors">
                  Leaderboard & Stats
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-red-600 transition-colors">
                  Guest / Google Login
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-red-600 transition-colors">
                  Scorer Admin Console
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© 2026 CRICLIVE. Instant cricket scoring platform.</p>
          <p className="flex items-center gap-1.5">
            Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for gully & box cricket
          </p>
        </div>
      </div>
    </footer>
  );
}

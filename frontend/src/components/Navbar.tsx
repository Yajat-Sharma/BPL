"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Trophy, Radio, Calendar, Users, BarChart3, ShieldCheck, LogIn, LogOut, User as UserIcon, PlusCircle, Zap } from "lucide-react";
import { User } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("bpl_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("bpl_token");
    localStorage.removeItem("bpl_user");
    setUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { label: "Home", href: "/", icon: Trophy },
    { label: "Live Center", href: "/live", icon: Radio, badge: "LIVE" },
    { label: "Fixtures", href: "/matches", icon: Calendar },
    { label: "Teams", href: "/teams", icon: Users },
    { label: "Points Table", href: "/points-table", icon: BarChart3 },
    { label: "Stats", href: "/stats", icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#06130d]/95 backdrop-blur-md border-b border-[#1b3827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-bpl-forest to-bpl-mint flex items-center justify-center border border-bpl-gold/40 shadow-lg group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-bpl-gold" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white flex items-center gap-1.5">
                BAIRAJESHWAR <span className="text-bpl-gold">BPL</span>
              </span>
              <p className="text-[10px] uppercase font-bold text-bpl-mint tracking-widest">
                Box Cricket League 2026
              </p>
            </div>
          </Link>

          {/* Desktop Navigation - 100% PUBLIC ACCESS */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-bpl-gold bg-bpl-emerald/20 border border-bpl-emerald/40"
                      : "text-slate-300 hover:text-white hover:bg-[#112217]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {link.badge && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Auth */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/create"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase rounded-lg bg-gradient-to-r from-bpl-gold to-yellow-500 text-slate-950 hover:from-yellow-400 hover:to-amber-400 transition-all shadow-md"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>New Match</span>
            </Link>

            {user?.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase rounded-lg bg-bpl-gold text-slate-950 hover:bg-yellow-400 transition-colors shadow"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                Admin Panel
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="text-right hidden sm:block p-1.5 rounded-lg hover:bg-[#112217] transition-colors"
                >
                  <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
                    <UserIcon className="w-3 h-3 text-bpl-gold" />
                    {user.username}
                  </div>
                  <div className="text-[10px] text-bpl-mint font-mono font-semibold">
                    {user.user_id}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-800/40"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-bpl-forest/80 hover:bg-bpl-emerald text-white border border-bpl-mint/30 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-bpl-gold" />
                Member Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Trophy,
  Radio,
  Calendar,
  Users,
  BarChart3,
  ShieldCheck,
  LogIn,
  LogOut,
  User as UserIcon,
  Zap,
} from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl">🏏</span>
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-stone-900 leading-none flex items-center gap-0.5">
                CRIC<span className="text-red-600 font-extrabold">LIVE</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mt-0.5">
                Live Cricket & Stream Hub
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "text-red-600 bg-red-50 border border-red-200 shadow-sm font-bold"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-red-600" : "text-stone-400"}`} />
                  {link.label}
                  {link.badge && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
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
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-600/20 hover:-translate-y-0.5"
            >
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>New Match</span>
            </Link>

            {user?.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase rounded-xl bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-stone-600" />
                Admin
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="text-right hidden sm:block px-2.5 py-1 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <div className="text-xs font-bold text-stone-900 flex items-center justify-end gap-1">
                    <UserIcon className="w-3 h-3 text-red-600" />
                    {user.username}
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono font-semibold">
                    {user.user_id}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-stone-500" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // 1-Click Guest Access
  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/guest", { username: "Gully Cricketer" });
      const { access_token, user } = res.data;
      localStorage.setItem("bpl_token", access_token);
      localStorage.setItem("bpl_user", JSON.stringify(user));
      router.push("/create");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Guest login failed");
    } finally {
      setLoading(false);
    }
  };

  // Google Login (instant one-click)
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const gEmail = prompt("Enter your Google Account email (e.g. yourname@gmail.com):", "cricket.player@gmail.com");
      if (!gEmail) {
        setLoading(false);
        return;
      }
      const gName = gEmail.split("@")[0].replace(".", " ");
      const res = await api.post("/auth/google-login", {
        email: gEmail.trim(),
        name: gName,
      });
      const { access_token, user } = res.data;
      localStorage.setItem("bpl_token", access_token);
      localStorage.setItem("bpl_user", JSON.stringify(user));
      router.push("/create");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/send-otp", { email: email.trim() });
      if (res.data.debug_otp) {
        setDebugOtp(res.data.debug_otp);
      }
      setStep("OTP");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send verification OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        email: email.trim(),
        otp: otp.trim(),
      };
      if (username) {
        payload.username = username.trim();
      }

      const res = await api.post("/auth/verify-otp", payload);
      const { access_token, user } = res.data;

      localStorage.setItem("bpl_token", access_token);
      localStorage.setItem("bpl_user", JSON.stringify(user));

      if (user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && detail.includes("Username is required")) {
        setIsNewUser(true);
        setError("New player detected! Please provide your name below to complete registration.");
      } else {
        setError(detail || "Invalid OTP code. Please check and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="emerald-card max-w-md w-full rounded-2xl p-8 border border-bpl-emerald/50 shadow-2xl relative space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-bpl-forest flex items-center justify-center mx-auto border border-bpl-gold/40 shadow-lg mb-3">
            <Trophy className="w-6 h-6 text-bpl-gold" />
          </div>
          <h1 className="text-2xl font-black uppercase text-white tracking-wide">
            Gully Cricket Login
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Choose instant guest access or sign in to save your match records.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {debugOtp && (
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/50 text-amber-300 text-xs font-mono">
            <strong>Development OTP:</strong> {debugOtp} (or use bypass <code>999999</code>)
          </div>
        )}

        {/* Quick Instant Logins */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-bpl-gold via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:from-yellow-400 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-yellow-500/20"
          >
            <Zap className="w-4 h-4 fill-slate-950" /> Play & Score as Guest (1-Click)
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#1b3827]"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-slate-500 uppercase">
            Or With Email
          </span>
          <div className="flex-grow border-t border-[#1b3827]"></div>
        </div>

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none pl-10"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#112217] hover:bg-[#1b3827] text-white font-bold text-sm border border-[#1b3827] hover:border-bpl-gold/40 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Sending OTP..." : "Send Verification OTP"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Enter 6-Digit OTP
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-lg font-mono text-center tracking-widest text-white focus:outline-none pl-10"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Sent to <strong>{email}</strong>
              </p>
            </div>

            {isNewUser && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name / Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#06130d] border border-[#1b3827] focus:border-bpl-gold rounded-xl px-4 py-3 text-sm text-white focus:outline-none pl-10"
                  />
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-bpl-gold to-yellow-500 text-slate-950 font-bold text-sm hover:from-yellow-400 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow"
            >
              {loading ? "Verifying..." : "Verify OTP & Sign In"}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("EMAIL");
                setError(null);
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white py-1"
            >
              Change Email Address
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

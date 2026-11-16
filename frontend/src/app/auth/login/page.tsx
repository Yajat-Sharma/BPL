"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Mail, KeyRound, ArrowRight, ShieldCheck, User as UserIcon } from "lucide-react";
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
        setError("New resident detected! Please provide your name below to complete registration.");
      } else {
        setError(detail || "Invalid OTP code. Please check and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="emerald-card max-w-md w-full rounded-2xl p-8 border border-bpl-emerald/50 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-bpl-forest flex items-center justify-center mx-auto border border-bpl-gold/40 shadow-lg mb-3">
            <Trophy className="w-6 h-6 text-bpl-gold" />
          </div>
          <h1 className="text-2xl font-black uppercase text-white tracking-wide">
            Resident Login & Registration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Bairajeshwar Premier League Official Access
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {debugOtp && (
          <div className="mb-5 p-3 rounded-xl bg-amber-950/60 border border-amber-800/50 text-amber-300 text-xs font-mono">
            <strong>Development OTP:</strong> {debugOtp} (or use bypass <code>999999</code>)
          </div>
        )}

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
              <p className="text-[11px] text-slate-500 mt-1">
                Tip: Use <strong>admin@bpl.com</strong> for Super Admin privileges.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-bpl-gold to-yellow-500 text-slate-950 font-bold text-sm hover:from-yellow-400 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow"
            >
              {loading ? "Sending OTP..." : "Continue with Email"}
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
              onClick={() => { setStep("EMAIL"); setError(null); }}
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

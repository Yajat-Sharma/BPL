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
      const gEmail = prompt(
        "Enter your Google Account email (e.g. yourname@gmail.com):",
        "cricket.player@gmail.com"
      );
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
      <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-stone-200 shadow-xl relative space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center mx-auto text-white shadow-md shadow-red-500/20 mb-3">
            <span className="text-2xl">🏏</span>
          </div>
          <h1 className="text-2xl font-black uppercase text-stone-900 tracking-tight">
            CRIC<span className="text-red-600">LIVE</span> Access
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Play or score as a guest instantly, or sign in to track your matches.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {debugOtp && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono">
            <strong>Development OTP:</strong> {debugOtp} (or use bypass <code>999999</code>)
          </div>
        )}

        {/* Quick Instant Logins */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-red-500/20"
          >
            <Zap className="w-4 h-4 fill-white" /> Play & Score as Guest (1-Click)
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-sm"
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
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-stone-400 uppercase">
            Or With Email
          </span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-4 py-3 text-sm text-stone-900 focus:outline-none pl-10"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? "Sending OTP..." : "Send Verification OTP"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
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
                  className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-4 py-3 text-lg font-mono text-center tracking-widest text-stone-900 focus:outline-none pl-10"
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-4" />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Sent to <strong>{email}</strong>
              </p>
            </div>

            {isNewUser && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Full Name / Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-red-600 rounded-xl px-4 py-3 text-sm text-stone-900 focus:outline-none pl-10"
                  />
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-red-500/20"
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
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800 py-1"
            >
              Change Email Address
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

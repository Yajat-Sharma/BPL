"use client";

import { useState } from "react";
import { Share2, Check, Copy, MessageCircle, X } from "lucide-react";

interface ShareMatchButtonProps {
  matchId: string;
  matchTitle?: string;
  scoreText?: string;
  oversText?: string;
  variant?: "primary" | "secondary" | "icon";
  className?: string;
}

export function ShareMatchButton({
  matchId,
  matchTitle = "Live Cricket Match",
  scoreText,
  oversText,
  variant = "primary",
  className = "",
}: ShareMatchButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/live/${matchId}`;
    }
    return `https://criclive.app/live/${matchId}`;
  };

  const getShareText = () => {
    const url = getShareUrl();
    const scorePart = scoreText ? ` | Score: ${scoreText}` : "";
    const oversPart = oversText ? ` (${oversText})` : "";
    return `🏏 Watch ${matchTitle}${scorePart}${oversPart} LIVE ball-by-ball on CRICLIVE!\n👉 Follow here: ${url}`;
  };

  const handleShareClick = async () => {
    const shareUrl = getShareUrl();
    const shareText = getShareText();

    // If mobile native share is supported, use it first
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${matchTitle} - Live on CRICLIVE`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to modal
      }
    }

    // Fallback: Open share modal
    setShowModal(true);
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={handleShareClick}
          title="Share Live Score Link"
          className={`p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 hover:text-red-600 transition-all shadow-sm ${className}`}
        >
          <Share2 className="w-4 h-4" />
        </button>
      ) : variant === "secondary" ? (
        <button
          type="button"
          onClick={handleShareClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 hover:text-red-600 font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${className}`}
        >
          <Share2 className="w-3.5 h-3.5 text-red-600" />
          <span>Share Score Link</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleShareClick}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-red-500/20 active:scale-95 ${className}`}
        >
          <Share2 className="w-4 h-4" />
          <span>Share Live Score</span>
        </button>
      )}

      {/* Share Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                Live Match Sharing
              </div>
              <h3 className="text-xl font-black text-stone-900 tracking-tight">
                Share Live Match Score
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Anyone with this link can watch real-time ball-by-ball scores without downloading an app.
              </p>
            </div>

            {/* Quick WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Share on WhatsApp</span>
            </button>

            {/* Copy Link Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-stone-500 tracking-wider">
                Direct Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all flex items-center gap-1.5 shadow-sm ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-900 hover:bg-black text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs text-stone-400 hover:text-stone-700 font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";

interface ShareMatchButtonProps {
  matchId: string;
  matchTitle?: string;
  scoreText?: string;
  oversText?: string;
  variant?: "primary" | "secondary" | "whatsapp" | "icon";
  className?: string;
  showCopyCompanion?: boolean;
}

export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.889 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.487-8.413z" />
    </svg>
  );
}

export function ShareMatchButton({
  matchId,
  matchTitle = "Live Cricket Match",
  scoreText,
  oversText,
  variant = "primary",
  className = "",
  showCopyCompanion = true,
}: ShareMatchButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/live/${matchId}`;
    }
    return `https://criclive.app/live/${matchId}`;
  };

  const getWhatsAppMessage = () => {
    const url = getShareUrl();
    if (scoreText) {
      const oversStr = oversText ? ` (${oversText})` : "";
      return `🏏 *CRICLIVE: ${matchTitle}*\n📊 *Score: ${scoreText}*${oversStr}\n\n⚡ Watch live ball-by-ball updates here:\n👉 ${url}\n\n_Scored on CRICLIVE Gully Cricket_`;
    }
    return `🏏 *CRICLIVE: ${matchTitle}*\n⚡ Watch the live match & ball-by-ball scores here:\n👉 ${url}\n\n_Follow live on CRICLIVE_`;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getWhatsAppMessage());
    // Direct WhatsApp share url works across web, Android, and iOS
    const waUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <div className={`inline-flex items-center gap-1 ${className}`}>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            title="Share Score on WhatsApp"
            className="p-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm transition-all transform hover:scale-105 active:scale-95"
          >
            <WhatsAppIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            title={copied ? "Copied!" : "Copy Link"}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-all shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      ) : variant === "secondary" ? (
        <div className={`inline-flex items-center gap-1.5 ${className}`}>
          {/* Direct WhatsApp Share button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Quick Copy Link button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Primary / Default View: High-impact WhatsApp button + Copy companion */
        <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
          {/* Main WhatsApp 1-Click Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-green-500/25 active:scale-95"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>WhatsApp Score Link</span>
          </button>

          {/* Copy Companion Button */}
          {showCopyCompanion && (
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
                copied ? "text-emerald-600 border-emerald-400 bg-emerald-50" : "text-stone-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          )}

          {/* More options button (native share / modal) */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            title="More share options"
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition-all shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Share Modal Dialog for details / QR / full preview */}
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                Live WhatsApp Score Sharing
              </div>
              <h3 className="text-xl font-black text-stone-900 tracking-tight">
                Share Live Match Link
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Share directly to WhatsApp group chats or copy the live link. Anyone can follow real-time scores without logging in!
              </p>
            </div>

            {/* Direct WhatsApp Share Action */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-green-500/25 transition-all transform hover:-translate-y-0.5 active:scale-98"
            >
              <WhatsAppIcon className="w-5 h-5" />
              <span>Share to WhatsApp Chat / Group</span>
            </button>

            {/* Message Preview */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 font-mono whitespace-pre-line leading-relaxed">
              {getWhatsAppMessage()}
            </div>

            {/* Copy Link Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-stone-500 tracking-wider">
                Direct URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 font-mono focus:outline-none select-all"
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

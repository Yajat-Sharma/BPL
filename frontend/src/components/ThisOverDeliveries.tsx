import React from "react";
import { LiveBall } from "@/types";

interface ThisOverDeliveriesProps {
  currentOvers: number; // e.g. 7.1 or 0.0
  recentBalls: LiveBall[]; // All recent balls from backend
}

export function ThisOverDeliveries({ currentOvers, recentBalls }: ThisOverDeliveriesProps) {
  // Extract completed overs and legal balls in current over from currentOvers (e.g. 7.1 -> overIndex = 7, ballsInCurrentOver = 1)
  const currentOverIndex = Math.floor(currentOvers);
  
  // Filter balls that were bowled in this active over, ordered from first ball to latest (left to right)
  const thisOverDeliveries = recentBalls.filter(
    (b) => b.over === currentOverIndex
  );

  // If no balls have been bowled yet in this current over (e.g. 7.0 at start of over), show 6 empty placeholder circles
  // A standard over consists of 6 legal balls (plus extras if any)
  const totalSlots = Math.max(6, thisOverDeliveries.length);
  const slots = Array.from({ length: totalSlots });

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Over:</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {slots.map((_, index) => {
          const ball = thisOverDeliveries[index];

          if (ball) {
            // Ball has been bowled: fill from Left to Right
            const isWicket = ball.is_wicket;
            const isBoundary4 = ball.label === "4" || ball.label === "4D" || ball.label === "4wall";
            const isBoundary6 = ball.label === "6" || ball.label === "6wall";
            const isNoBall = ball.label.includes("nb");
            const isWide = ball.label.includes("wd");

            return (
              <span
                key={ball.sequence || index}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md transition-all animate-in zoom-in-75 ${
                  isWicket
                    ? "bg-red-600 text-white"
                    : isBoundary4
                    ? "bg-blue-600 text-white"
                    : isBoundary6
                    ? "bg-bpl-gold text-slate-950 font-black"
                    : isNoBall
                    ? "bg-rose-950/80 text-rose-300 border border-rose-500"
                    : isWide
                    ? "bg-amber-950/80 text-amber-300 border border-amber-500"
                    : "bg-[#112217] text-slate-200 border border-[#1b3827]"
                }`}
                title={ball.commentary || `${ball.label} runs`}
              >
                {ball.label}
              </span>
            );
          }

          // Future unbowled ball slot in this over: show clean empty dotted circle placeholder
          return (
            <span
              key={`empty-${index}`}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed border-[#1b3827] bg-[#06130d]/50 text-slate-600 text-xs font-mono font-bold"
            >
              •
            </span>
          );
        })}
      </div>
    </div>
  );
}

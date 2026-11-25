import React from "react";
import { LiveBall } from "@/types";

interface ThisOverDeliveriesProps {
  currentOvers: number; // e.g. 7.1 or 0.0
  recentBalls: LiveBall[]; // All recent balls from backend
  theme?: "light" | "dark";
}

export function ThisOverDeliveries({ currentOvers, recentBalls }: ThisOverDeliveriesProps) {
  // Extract completed overs and legal balls in current over from currentOvers
  const currentOverIndex = Math.floor(currentOvers);
  
  // Filter balls that were bowled in this active over, ordered from first ball to latest (left to right)
  const thisOverDeliveries = recentBalls.filter(
    (b) => b.over === currentOverIndex
  );

  // Standard over consists of 6 legal balls (plus extras if any)
  const totalSlots = Math.max(6, thisOverDeliveries.length);
  const slots = Array.from({ length: totalSlots });

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-black uppercase tracking-wider text-stone-500">
        This Over:
      </span>
      <div className="flex items-center gap-2 flex-wrap">
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
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm transition-all animate-in zoom-in-75 ${
                  isWicket
                    ? "bg-red-800 text-white ring-2 ring-red-400"
                    : isBoundary6
                    ? "bg-[#EA2B2B] text-white font-black ring-2 ring-red-300"
                    : isBoundary4
                    ? "bg-[#EA2B2B] text-white font-black"
                    : isNoBall
                    ? "bg-orange-500 text-white"
                    : isWide
                    ? "bg-amber-500 text-white"
                    : "bg-[#EA2B2B] text-white"
                }`}
                title={ball.commentary || `${ball.label} runs`}
              >
                {ball.label}
              </span>
            );
          }

          // Future unbowled ball slot: show clean unfilled outlined circle matching Image 2
          return (
            <span
              key={`empty-${index}`}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-red-300 bg-white/80 text-stone-300 text-xs font-mono font-bold"
            >
              ○
            </span>
          );
        })}
      </div>
    </div>
  );
}

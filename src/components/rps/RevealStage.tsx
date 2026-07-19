"use client";

import { MOVE_EMOJI } from "@/lib/rps/constants";
import type { Move } from "@/lib/rps/types";

interface RevealStageProps {
  myName: string;
  myMove: Move;
  opponentName: string;
  opponentMove: Move;
  outcome: "win" | "lose" | "draw";
}

export function RevealStage({
  myName,
  myMove,
  opponentName,
  opponentMove,
  outcome,
}: RevealStageProps) {
  const iWon = outcome === "win";
  const isDraw = outcome === "draw";

  return (
    <div className="flex items-center justify-center gap-10 sm:gap-16">
      <div className="flex flex-col items-center gap-2">
        <span
          className={`animate-clash-left text-7xl transition-all duration-500 sm:text-8xl ${
            isDraw ? "" : iWon ? "glow-text scale-110" : "scale-90 opacity-40 grayscale"
          }`}
        >
          {MOVE_EMOJI[myMove]}
        </span>
        <span className="text-sm text-muted">{myName} (you)</span>
      </div>
      <span className="text-2xl text-muted">vs</span>
      <div className="flex flex-col items-center gap-2">
        <span
          className={`animate-clash-right text-7xl transition-all duration-500 sm:text-8xl ${
            isDraw ? "" : !iWon ? "glow-text scale-110" : "scale-90 opacity-40 grayscale"
          }`}
        >
          {MOVE_EMOJI[opponentMove]}
        </span>
        <span className="text-sm text-muted">{opponentName}</span>
      </div>
    </div>
  );
}

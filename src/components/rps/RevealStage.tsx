"use client";

import type { Move } from "@/lib/rps/types";
import { HandIcon } from "./HandIcon";

interface RevealStageProps {
  myName: string;
  myMove: Move;
  mySkin: string;
  opponentName: string;
  opponentMove: Move;
  opponentSkin: string;
  outcome: "win" | "lose" | "draw";
}

export function RevealStage({
  myName,
  myMove,
  mySkin,
  opponentName,
  opponentMove,
  opponentSkin,
  outcome,
}: RevealStageProps) {
  const iWon = outcome === "win";
  const isDraw = outcome === "draw";

  return (
    <div className="flex items-center justify-center gap-10 sm:gap-16">
      <div className="flex flex-col items-center gap-2">
        <span
          className={`animate-clash-left flex justify-center text-7xl transition-all duration-500 sm:text-8xl ${
            isDraw ? "" : iWon ? "glow-text scale-110" : "scale-90 opacity-40 grayscale"
          }`}
        >
          <HandIcon move={myMove} skin={mySkin} />
        </span>
        <span className="text-sm text-muted">{myName} (you)</span>
      </div>
      <span className="text-2xl text-muted">vs</span>
      <div className="flex flex-col items-center gap-2">
        <span
          className={`animate-clash-right flex justify-center text-7xl transition-all duration-500 sm:text-8xl ${
            isDraw ? "" : !iWon ? "glow-text scale-110" : "scale-90 opacity-40 grayscale"
          }`}
        >
          <HandIcon move={opponentMove} skin={opponentSkin} />
        </span>
        <span className="text-sm text-muted">{opponentName}</span>
      </div>
    </div>
  );
}

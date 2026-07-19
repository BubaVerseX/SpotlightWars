"use client";

import { AI_DIFFICULTY_LABEL } from "@/lib/rps/ai";
import type { AiDifficulty } from "@/lib/rps/types";

interface ComputerMatchResultBannerProps {
  outcome: "win" | "lose";
  myScore: number;
  opponentScore: number;
  difficulty: AiDifficulty;
  onRematch: () => void;
  onChangeDifficulty: () => void;
}

export function ComputerMatchResultBanner({
  outcome,
  myScore,
  opponentScore,
  difficulty,
  onRematch,
  onChangeDifficulty,
}: ComputerMatchResultBannerProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p
        className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl"
        style={{
          color: outcome === "win" ? "var(--neon-cyan)" : "var(--neon-magenta)",
          textShadow:
            outcome === "win"
              ? "0 0 26px var(--neon-cyan), 0 0 56px var(--neon-cyan-soft)"
              : "0 0 12px var(--neon-magenta-soft)",
          opacity: outcome === "win" ? 1 : 0.75,
        }}
      >
        {outcome === "win" ? "You Win!" : "You Lose"}
      </p>
      <p className="text-lg text-foreground">
        Final score {myScore} — {opponentScore}
      </p>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">
        {AI_DIFFICULTY_LABEL[difficulty]} AI · Practice mode, not ranked
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRematch}
          className="arcade-btn rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide"
        >
          Rematch
        </button>
        <button
          type="button"
          onClick={onChangeDifficulty}
          className="arcade-btn-solid rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide"
        >
          Change Difficulty
        </button>
      </div>
    </div>
  );
}

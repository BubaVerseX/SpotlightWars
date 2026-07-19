"use client";

import { AI_DIFFICULTIES, AI_DIFFICULTY_DESCRIPTION, AI_DIFFICULTY_LABEL } from "@/lib/rps/ai";
import type { AiDifficulty } from "@/lib/rps/types";

interface DifficultyPickerProps {
  onSelect: (difficulty: AiDifficulty) => void;
  onBack: () => void;
}

const DIFFICULTY_COLOR: Record<AiDifficulty, string> = {
  easy: "var(--neon-cyan)",
  medium: "var(--neon-cyan)",
  hard: "var(--neon-magenta)",
  impossible: "var(--neon-gold)",
};

export function DifficultyPicker({ onSelect, onBack }: DifficultyPickerProps) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <p className="text-center text-xs uppercase tracking-[0.3em] text-muted">Choose your opponent</p>
      {AI_DIFFICULTIES.map((difficulty) => (
        <button
          key={difficulty}
          type="button"
          onClick={() => onSelect(difficulty)}
          className="arcade-btn flex flex-col items-start gap-1 rounded-lg px-5 py-3 text-left"
        >
          <span
            className="font-display text-sm font-semibold uppercase tracking-wide"
            style={{ color: DIFFICULTY_COLOR[difficulty] }}
          >
            {AI_DIFFICULTY_LABEL[difficulty]}
          </span>
          <span className="text-xs text-muted">{AI_DIFFICULTY_DESCRIPTION[difficulty]}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
      >
        &larr; Back
      </button>
    </div>
  );
}

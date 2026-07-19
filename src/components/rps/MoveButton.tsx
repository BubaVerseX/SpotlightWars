"use client";

import { MOVE_LABEL } from "@/lib/rps/constants";
import type { Move } from "@/lib/rps/types";
import { HandIcon } from "./HandIcon";

interface MoveButtonProps {
  move: Move;
  skin: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (move: Move) => void;
}

export function MoveButton({ move, skin, selected, disabled, onSelect }: MoveButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(move)}
      className={`flex flex-col items-center gap-2 rounded-2xl border px-6 py-5 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "arcade-panel border-[var(--neon-cyan)]"
          : "border-border bg-background-elevated hover:border-[var(--neon-cyan)] hover:shadow-[0_0_16px_var(--neon-cyan-soft)]"
      }`}
    >
      <span className="flex justify-center text-5xl">
        <HandIcon move={move} skin={skin} />
      </span>
      <span className="text-sm font-medium text-muted">{MOVE_LABEL[move]}</span>
    </button>
  );
}

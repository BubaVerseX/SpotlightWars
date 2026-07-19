"use client";

interface ResultBannerProps {
  outcome: "win" | "lose" | "draw";
  onPrimaryAction: () => void;
  primaryLabel: string;
}

export function ResultBanner({ outcome, onPrimaryAction, primaryLabel }: ResultBannerProps) {
  const heading =
    outcome === "win" ? "You Win!" : outcome === "lose" ? "You Lose!" : "Draw — Rematch?";

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p
        className={`font-display text-4xl font-bold sm:text-5xl ${
          outcome === "win"
            ? "text-accent glow-text"
            : outcome === "lose"
              ? "text-muted"
              : "text-foreground"
        }`}
      >
        {heading}
      </p>
      <button
        type="button"
        onClick={onPrimaryAction}
        className="rounded-xl bg-accent px-6 py-3 font-display font-semibold text-background transition hover:brightness-110"
      >
        {primaryLabel}
      </button>
    </div>
  );
}

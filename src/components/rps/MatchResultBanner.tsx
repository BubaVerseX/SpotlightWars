"use client";

interface MatchResultBannerProps {
  outcome: "win" | "lose";
  myScore: number;
  opponentScore: number;
  eloBefore: number;
  eloAfter: number;
  onPlayAgain: () => void;
  onRematch: () => void;
}

export function MatchResultBanner({
  outcome,
  myScore,
  opponentScore,
  eloBefore,
  eloAfter,
  onPlayAgain,
  onRematch,
}: MatchResultBannerProps) {
  const eloDelta = eloAfter - eloBefore;

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
        {outcome === "win" ? "You Win the Match!" : "You Lose the Match"}
      </p>
      <p className="text-lg text-foreground">
        Final score {myScore} — {opponentScore}
      </p>
      <p className="text-sm text-muted">
        {eloAfter} ELO{" "}
        <span
          style={{ color: eloDelta >= 0 ? "var(--neon-cyan)" : "var(--neon-magenta)" }}
          className="font-semibold"
        >
          ({eloDelta >= 0 ? "+" : ""}
          {eloDelta})
        </span>
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
          onClick={onPlayAgain}
          className="arcade-btn-solid rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

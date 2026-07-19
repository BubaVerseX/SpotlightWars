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
        className={`font-display text-4xl font-bold sm:text-5xl ${
          outcome === "win" ? "text-accent glow-text" : "text-muted"
        }`}
      >
        {outcome === "win" ? "You Win the Match!" : "You Lose the Match"}
      </p>
      <p className="text-lg text-foreground">
        Final score {myScore} — {opponentScore}
      </p>
      <p className="text-sm text-muted">
        {eloAfter} ELO{" "}
        <span className={eloDelta >= 0 ? "text-accent" : "text-red-400"}>
          ({eloDelta >= 0 ? "+" : ""}
          {eloDelta})
        </span>
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRematch}
          className="rounded-xl border border-border bg-background-elevated px-6 py-3 font-display font-semibold text-foreground transition hover:border-accent"
        >
          Rematch
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded-xl bg-accent px-6 py-3 font-display font-semibold text-background transition hover:brightness-110"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

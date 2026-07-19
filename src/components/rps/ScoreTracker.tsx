import { ROUNDS_TO_WIN } from "@/lib/rps/constants";

interface ScoreTrackerProps {
  myName: string;
  myScore: number;
  opponentName: string;
  opponentScore: number;
}

export function ScoreTracker({ myName, myScore, opponentName, opponentScore }: ScoreTrackerProps) {
  const isMatchPoint = myScore === ROUNDS_TO_WIN - 1 || opponentScore === ROUNDS_TO_WIN - 1;

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="font-display text-lg font-semibold text-foreground">
        {myName}{" "}
        <span className="text-[var(--neon-cyan)]" style={{ textShadow: "0 0 10px var(--neon-cyan-soft)" }}>
          {myScore}
        </span>{" "}
        —{" "}
        <span
          className="text-[var(--neon-magenta)]"
          style={{ textShadow: "0 0 10px var(--neon-magenta-soft)" }}
        >
          {opponentScore}
        </span>{" "}
        {opponentName}
      </p>
      {isMatchPoint && (
        <p className="arcade-match-point text-xs font-semibold uppercase tracking-[0.2em]">
          Match Point
        </p>
      )}
    </div>
  );
}

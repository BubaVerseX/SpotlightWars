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
        {myName} <span className="text-accent">{myScore}</span> —{" "}
        <span className="text-accent">{opponentScore}</span> {opponentName}
      </p>
      {isMatchPoint && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent glow-text">
          Match Point
        </p>
      )}
    </div>
  );
}

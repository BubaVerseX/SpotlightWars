import type { LeaderboardEntry } from "@/lib/rps/types";

export function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-center text-sm text-muted">No wins recorded yet — be the first.</p>;
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry, i) => (
        <li
          key={entry.name}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background-elevated px-4 py-2 text-sm"
        >
          <span className="flex items-center gap-3">
            <span className="w-5 text-right font-display text-muted">{i + 1}</span>
            <span className="text-foreground">{entry.name}</span>
          </span>
          <span className="font-display text-accent">{entry.wins}</span>
        </li>
      ))}
    </ol>
  );
}

import type { PlayerProfile } from "@/lib/rps/types";
import { getCosmetic, getRankTier } from "@/lib/rps/cosmetics";

export function LeaderboardList({ entries }: { entries: PlayerProfile[] }) {
  if (entries.length === 0) {
    return <p className="text-center text-sm text-muted">No ranked players yet — be the first.</p>;
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry, i) => {
        const tier = getRankTier(entry.elo);
        const title = getCosmetic(entry.equippedTitle);
        const isTop = i === 0;
        return (
          <li
            key={entry.name}
            className={`flex items-center justify-between gap-3 rounded-lg px-4 py-2 text-sm ${
              isTop ? "arcade-panel" : "border border-border bg-background-elevated"
            }`}
            style={
              isTop
                ? { borderColor: "var(--neon-gold)", boxShadow: "0 0 16px var(--neon-gold-soft)" }
                : undefined
            }
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                className="w-5 shrink-0 text-right font-display"
                style={{ color: isTop ? "var(--neon-gold)" : "var(--muted)" }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 truncate">
                <span
                  className="truncate font-medium"
                  style={{ color: title?.color ?? "var(--foreground)" }}
                >
                  {entry.name}
                </span>
                {title && <span className="ml-1.5 text-xs text-muted">&ldquo;{title.name}&rdquo;</span>}
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: tier.color, borderColor: `${tier.color}66`, borderWidth: 1 }}
              >
                {tier.name}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span
                className="font-display"
                style={{ color: isTop ? "var(--neon-gold)" : "var(--neon-cyan)" }}
              >
                {entry.elo}
              </span>
              <span className="ml-2 text-xs text-muted">
                {entry.wins}-{entry.losses}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

import type { PublicPlayerProfile } from "@/lib/rps/types";
import { getCosmetic, getRankTier } from "@/lib/rps/cosmetics";
import { BannerPreview } from "./BannerPreview";
import { LeaderboardFramePreview } from "./LeaderboardFramePreview";
import { AngledDivider } from "./AngledDivider";
import { PlayerAvatar } from "./PlayerAvatar";

interface LeaderboardListProps {
  entries: PublicPlayerProfile[];
  /**
   * "compact" is the original uniform-row list (used for the small preview
   * on the landing page). "podium" gives the top 3 a distinctly larger,
   * featured treatment with the rest of the field in a compact list below —
   * only used on the full /leaderboard page.
   */
  variant?: "compact" | "podium";
}

export function LeaderboardList({ entries, variant = "compact" }: LeaderboardListProps) {
  if (entries.length === 0) {
    return <p className="text-center text-sm text-muted">No ranked players yet — be the first.</p>;
  }

  if (variant === "podium") {
    const top = entries.slice(0, 3);
    const rest = entries.slice(3);

    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          {top.map((entry, i) => (
            <PodiumCard key={entry.name} entry={entry} rank={i + 1} />
          ))}
        </div>

        {rest.length > 0 && (
          <>
            <AngledDivider color="cyan" size="sm" />
            <ol className="space-y-2">
              {rest.map((entry, i) => (
                <CompactRow key={entry.name} entry={entry} rank={i + 4} />
              ))}
            </ol>
          </>
        )}
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry, i) => (
        <CompactRow key={entry.name} entry={entry} rank={i + 1} />
      ))}
    </ol>
  );
}

const PODIUM_ACCENT: Record<number, string> = {
  1: "var(--neon-gold)",
  2: "var(--neon-cyan)",
  3: "var(--neon-magenta)",
};

function PodiumCard({ entry, rank }: { entry: PublicPlayerProfile; rank: number }) {
  const tier = getRankTier(entry.elo);
  const title = getCosmetic(entry.equippedTitle);
  const accent = PODIUM_ACCENT[rank];
  const isChamp = rank === 1;

  return (
    <div className={`relative ${isChamp ? "sm:-translate-y-3" : ""}`}>
      {isChamp && (
        <span className="rps-breakout-badge text-3xl" aria-hidden="true">
          🏆
        </span>
      )}
      <LeaderboardFramePreview frameId={entry.equippedLeaderboardFrame} className="rounded-lg">
        <div
          className="rps-depth-float arcade-panel overflow-hidden rounded-lg"
          style={{ borderColor: accent, boxShadow: `0 0 16px ${accent}55` }}
        >
          <BannerPreview bannerId={entry.equippedBanner} className={isChamp ? "px-4 py-6" : "px-3 py-4"}>
            <div className="flex flex-col items-center gap-1 text-center">
              <span
                className="font-display text-xs font-semibold uppercase tracking-[0.25em]"
                style={{ color: accent }}
              >
                #{rank}
              </span>
              <PlayerAvatar
                equippedAvatar={entry.equippedAvatar}
                walletAddress={entry.walletAddress}
                name={entry.name}
                size={isChamp ? 48 : 36}
              />
              <span
                className={`truncate font-display font-bold ${isChamp ? "text-2xl" : "text-lg"} ${
                  title?.exclusive ? "rps-title-exclusive" : ""
                }`}
                style={title?.exclusive ? undefined : { color: title?.color ?? "var(--foreground)" }}
              >
                {entry.name}
              </span>
              {entry.walletAddress && (
                <span
                  className="text-xs"
                  style={{ color: "var(--neon-cyan)" }}
                  title="Verified wallet — signed in with Ethereum"
                >
                  ✓ verified
                </span>
              )}
              {title && (
                <span className="text-xs text-muted">
                  {title.exclusive && <span style={{ color: "var(--neon-gold)" }}>◆ </span>}
                  &ldquo;{title.name}&rdquo;
                </span>
              )}
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: tier.color, borderColor: `${tier.color}66`, borderWidth: 1 }}
              >
                {tier.name}
              </span>
              <span
                className={`font-display font-black ${isChamp ? "text-4xl" : "text-2xl"}`}
                style={{ color: accent }}
              >
                {entry.elo}
              </span>
              <span className="text-xs text-muted">
                {entry.wins}-{entry.losses}
              </span>
            </div>
          </BannerPreview>
        </div>
      </LeaderboardFramePreview>
    </div>
  );
}

function CompactRow({ entry, rank }: { entry: PublicPlayerProfile; rank: number }) {
  const tier = getRankTier(entry.elo);
  const title = getCosmetic(entry.equippedTitle);
  const isTop = rank === 1;

  return (
    <li
      className={`overflow-hidden rounded-lg text-sm ${
        isTop ? "arcade-panel" : "border border-border bg-background-elevated"
      }`}
      style={isTop ? { borderColor: "var(--neon-gold)", boxShadow: "0 0 16px var(--neon-gold-soft)" } : undefined}
    >
      <LeaderboardFramePreview frameId={entry.equippedLeaderboardFrame}>
        <BannerPreview
          bannerId={entry.equippedBanner}
          className="flex items-center justify-between gap-3 px-4 py-2"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className="w-5 shrink-0 text-right font-display"
              style={{ color: isTop ? "var(--neon-gold)" : "var(--muted)" }}
            >
              {rank}
            </span>
            <PlayerAvatar
              equippedAvatar={entry.equippedAvatar}
              walletAddress={entry.walletAddress}
              name={entry.name}
              size={24}
            />
            <span className="min-w-0 truncate">
              <span
                className={`truncate font-medium ${title?.exclusive ? "rps-title-exclusive" : ""}`}
                style={title?.exclusive ? undefined : { color: title?.color ?? "var(--foreground)" }}
              >
                {entry.name}
              </span>
              {entry.walletAddress && (
                <span
                  className="ml-1.5 text-xs"
                  style={{ color: "var(--neon-cyan)" }}
                  title="Verified wallet — signed in with Ethereum"
                >
                  ✓
                </span>
              )}
              {title && (
                <span className="ml-1.5 text-xs text-muted">
                  {title.exclusive && <span style={{ color: "var(--neon-gold)" }}>◆ </span>}
                  &ldquo;{title.name}&rdquo;
                </span>
              )}
            </span>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: tier.color, borderColor: `${tier.color}66`, borderWidth: 1 }}
            >
              {tier.name}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="font-display" style={{ color: isTop ? "var(--neon-gold)" : "var(--neon-cyan)" }}>
              {entry.elo}
            </span>
            <span className="ml-2 text-xs text-muted">
              {entry.wins}-{entry.losses}
            </span>
          </span>
        </BannerPreview>
      </LeaderboardFramePreview>
    </li>
  );
}

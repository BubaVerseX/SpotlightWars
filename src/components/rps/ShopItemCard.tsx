import { useEffect, useState } from "react";
import { getSeasonalStatus, type AchievementDefinition, type CosmeticDefinition } from "@/lib/rps/cosmetics";
import type { PublicPlayerProfile } from "@/lib/rps/types";
import { CosmeticPreview } from "./CosmeticPreview";
import { BuyButton } from "./BuyButton";

/** Live "Xd Yh left" / "Xm Ys left" countdown to a seasonal item's endsAt,
 * ticking every second — only mounted on visible cards, so the cost is
 * bounded to whatever's on screen. */
function useCountdown(endsAt: string | undefined, active: boolean): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!endsAt || !active) {
      setLabel(null);
      return;
    }
    const update = () => {
      const diffMs = new Date(endsAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setLabel("Ending...");
        return;
      }
      const days = Math.floor(diffMs / 86_400_000);
      const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
      const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
      const seconds = Math.floor((diffMs % 60_000) / 1000);
      if (days > 0) setLabel(`${days}d ${hours}h left`);
      else if (hours > 0) setLabel(`${hours}h ${minutes}m left`);
      else setLabel(`${minutes}m ${seconds}s left`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt, active]);

  return label;
}

interface ShopItemCardProps {
  cosmetic: CosmeticDefinition;
  isUnlocked: boolean;
  achievement?: AchievementDefinition;
  achievementProgress: number;
  priceEth: string | null;
  ethUsdRate: number | null;
  isWalletVerified: boolean;
  verifiedAddress: string | null;
  onUnlocked: (profile: PublicPlayerProfile) => void;
  featured?: boolean;
}

export function ShopItemCard({
  cosmetic,
  isUnlocked,
  achievement,
  achievementProgress,
  priceEth,
  ethUsdRate,
  isWalletVerified,
  verifiedAddress,
  onUnlocked,
  featured = false,
}: ShopItemCardProps) {
  const usdEstimate = priceEth && ethUsdRate ? (parseFloat(priceEth) * ethUsdRate).toFixed(2) : null;
  const seasonalStatus = getSeasonalStatus(cosmetic);
  const countdown = useCountdown(cosmetic.availability?.endsAt, seasonalStatus === "active");
  const expiredAndLocked = seasonalStatus === "expired" && !isUnlocked;

  return (
    <div
      className={`rps-depth-float relative flex h-full flex-col gap-3 rounded-lg ${
        featured ? "arcade-panel-magenta p-5 pt-8" : "arcade-panel p-4"
      }`}
    >
      {featured && (
        <span
          className="rps-breakout-badge rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{
            color: "#1a0a1f",
            background: "var(--neon-magenta)",
            boxShadow: "0 0 14px var(--neon-magenta), 0 0 28px var(--neon-magenta-soft)",
          }}
        >
          Featured
        </span>
      )}
      {seasonalStatus && (
        <span className="rps-limited-badge absolute left-2 top-2 z-[2] rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
          Limited Time
        </span>
      )}
      <div className={featured ? "flex justify-center" : undefined}>
        <div className={featured ? "rps-breakout-icon" : undefined}>
          <CosmeticPreview id={cosmetic.id} category={cosmetic.category} size={featured ? "lg" : "md"} />
        </div>
      </div>

      <div className={featured ? "text-center" : undefined}>
        <p
          className={`font-display font-semibold uppercase tracking-wide text-foreground ${
            featured ? "text-base" : "text-sm"
          }`}
        >
          {cosmetic.name}
        </p>
        <p className="text-xs text-muted">{cosmetic.description}</p>
      </div>

      {isUnlocked ? (
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--neon-cyan)" }}>
          ✓ Unlocked
        </p>
      ) : cosmetic.unlockMethod === "achievement" ? (
        <div className="text-xs text-muted">
          <p style={{ color: "var(--neon-gold)" }}>{achievement?.name ?? "Achievement"}</p>
          <p>
            {achievement?.description}
            {achievement && ` — ${Math.min(achievementProgress, achievement.target)}/${achievement.target}`}
          </p>
        </div>
      ) : expiredAndLocked ? (
        <div className="border-t border-border pt-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--neon-magenta)" }}>
            No longer available
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 border-t border-border pt-3">
          <p className="text-sm">
            <span className="font-display font-semibold" style={{ color: "var(--neon-cyan)" }}>
              {priceEth} ETH
            </span>
            {usdEstimate && <span className="ml-1.5 text-xs text-muted">(≈ ${usdEstimate})</span>}
          </p>
          {countdown && (
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--neon-gold)" }}>
              {countdown}
            </p>
          )}
          {!isWalletVerified ? (
            <p className="text-center text-xs text-muted">Connect wallet to purchase</p>
          ) : priceEth && verifiedAddress ? (
            <BuyButton
              itemId={cosmetic.id}
              priceEth={priceEth}
              verifiedAddress={verifiedAddress}
              onUnlocked={onUnlocked}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

import type { AchievementDefinition, CosmeticDefinition } from "@/lib/rps/cosmetics";
import type { PublicPlayerProfile } from "@/lib/rps/types";
import { CosmeticPreview } from "./CosmeticPreview";
import { BuyButton } from "./BuyButton";

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
}: ShopItemCardProps) {
  const usdEstimate = priceEth && ethUsdRate ? (parseFloat(priceEth) * ethUsdRate).toFixed(2) : null;

  return (
    <div className="arcade-panel flex flex-col gap-3 rounded-lg p-4">
      <CosmeticPreview id={cosmetic.id} category={cosmetic.category} />

      <div>
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
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
      ) : (
        <div className="flex flex-col items-center gap-2 border-t border-border pt-3">
          <p className="text-sm">
            <span className="font-display font-semibold" style={{ color: "var(--neon-cyan)" }}>
              {priceEth} ETH
            </span>
            {usdEstimate && <span className="ml-1.5 text-xs text-muted">(≈ ${usdEstimate})</span>}
          </p>
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

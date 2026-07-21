"use client";

import { useState } from "react";
import { getCosmetic } from "@/lib/rps/cosmetics";
import { getShopPriceEth } from "@/lib/rps/shop";
import { CONSOLATION_SHARDS, type MysteryBoxDefinition } from "@/lib/rps/mysteryBoxes";
import type { PublicPlayerProfile } from "@/lib/rps/types";
import { MysteryBoxBuyButton } from "./MysteryBoxBuyButton";

interface MysteryBoxCardProps {
  box: MysteryBoxDefinition;
  ethUsdRate: number | null;
  isWalletVerified: boolean;
  verifiedAddress: string | null;
  onUnlocked: (profile: PublicPlayerProfile) => void;
}

/** Distinct UI from ShopItemCard on purpose — a mystery box's whole pitch is
 * "here's exactly what you might get and how likely each thing is", shown
 * plainly before any purchase button, never hidden. */
export function MysteryBoxCard({ box, ethUsdRate, isWalletVerified, verifiedAddress, onUnlocked }: MysteryBoxCardProps) {
  const [reveal, setReveal] = useState<{ grantedItemId: string | null; grantedShards: number } | null>(null);
  const priceEth = getShopPriceEth(box.id);
  const usdEstimate = priceEth && ethUsdRate ? (parseFloat(priceEth) * ethUsdRate).toFixed(2) : null;

  return (
    <div className="rps-depth-float arcade-panel-magenta flex h-full flex-col gap-3 rounded-lg p-4">
      <div>
        <p className="font-display text-base font-semibold uppercase tracking-wide text-foreground">{box.name}</p>
        <p className="text-xs text-muted">{box.description}</p>
      </div>

      <div className="rounded-lg border border-border bg-background-elevated p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Odds — every item in the pool</p>
        <ul className="space-y-1.5">
          {box.pool.map((entry) => {
            const item = getCosmetic(entry.cosmeticId);
            return (
              <li key={entry.cosmeticId} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-foreground">{item?.name ?? entry.cosmeticId}</span>
                <span className="shrink-0 font-display" style={{ color: "var(--neon-cyan)" }}>
                  {entry.oddsPercent}%
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[10px] text-muted">
          Already own everything above? You&apos;ll get {CONSOLATION_SHARDS} Shards instead of a duplicate — never a
          wasted purchase.
        </p>
      </div>

      {reveal ? (
        <div className="rounded-lg border border-border bg-background-elevated p-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">You got</p>
          <p className="font-display text-lg font-bold" style={{ color: "var(--neon-gold)" }}>
            {reveal.grantedItemId
              ? (getCosmetic(reveal.grantedItemId)?.name ?? reveal.grantedItemId)
              : `${reveal.grantedShards} Shards`}
          </p>
        </div>
      ) : (
        <div className="mt-auto flex flex-col items-center gap-2 border-t border-border pt-3">
          <p className="text-sm">
            <span className="font-display font-semibold" style={{ color: "var(--neon-cyan)" }}>
              {priceEth} ETH
            </span>
            {usdEstimate && <span className="ml-1.5 text-xs text-muted">(≈ ${usdEstimate})</span>}
          </p>
          {!isWalletVerified ? (
            <p className="text-center text-xs text-muted">Connect wallet to purchase</p>
          ) : priceEth && verifiedAddress ? (
            <MysteryBoxBuyButton
              boxId={box.id}
              priceEth={priceEth}
              verifiedAddress={verifiedAddress}
              onOpened={(profile, result) => {
                onUnlocked(profile);
                setReveal(result);
              }}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * ---------------------------------------------------------------------
 * MYSTERY BOXES — a purchasable box that grants ONE random item from a
 * disclosed pool. Full odds are always shown before purchase (see
 * MysteryBoxCard.tsx) — nothing here is hidden.
 * ---------------------------------------------------------------------
 * Boxes are priced (in shop.ts, same SHOP_PRICES map as every other
 * purchasable id) at/slightly above the pool's expected value, so they're
 * a fair-ish gamble rather than a strict discount or rip-off.
 */

export interface MysteryBoxPoolEntry {
  cosmeticId: string;
  /** Percent chance, 0-100. All entries in a pool's odds must sum to 100. */
  oddsPercent: number;
}

export interface MysteryBoxDefinition {
  id: string;
  name: string;
  description: string;
  pool: MysteryBoxPoolEntry[];
}

/** Small consolation payout when a buyer already owns every item in the
 * pool — so a purchase is never a wasted click, per the "no true dead end"
 * requirement. Not spendable anywhere yet, just tracked on the profile. */
export const CONSOLATION_SHARDS = 15;

export const MYSTERY_BOXES: MysteryBoxDefinition[] = [
  {
    id: "mysterybox:standard",
    name: "Standard Cache",
    description: "Mostly common skins and taunts, with a shot at a rarer aura or an exclusive title.",
    pool: [
      { cosmeticId: "skin:chrome", oddsPercent: 30 },
      { cosmeticId: "skin:wireframe", oddsPercent: 25 },
      { cosmeticId: "taunt:fire", oddsPercent: 15 },
      { cosmeticId: "aura:pulsingRing", oddsPercent: 15 },
      { cosmeticId: "banner:magentaPulse", oddsPercent: 10 },
      { cosmeticId: "title:patron", oddsPercent: 5 },
    ],
  },
  {
    id: "mysterybox:premium",
    name: "Premium Cache",
    description: "Weighted toward rarer auras, frames, and effects, with real odds at the top-tier titles.",
    pool: [
      { cosmeticId: "aura:lightningAura", oddsPercent: 25 },
      { cosmeticId: "aura:prismHalo", oddsPercent: 20 },
      { cosmeticId: "leaderboardFrame:moltenBorder", oddsPercent: 20 },
      { cosmeticId: "vsEffect:explosiveImpact", oddsPercent: 15 },
      { cosmeticId: "title:whale", oddsPercent: 12 },
      { cosmeticId: "title:founder", oddsPercent: 8 },
    ],
  },
];

export function getMysteryBox(id: string): MysteryBoxDefinition | undefined {
  return MYSTERY_BOXES.find((b) => b.id === id);
}

/**
 * Weighted-random pick among pool entries the profile doesn't already own,
 * preserving the *relative* odds of whatever's left (rather than a flat
 * reroll) so the disclosed percentages stay meaningfully informative even
 * after some items are owned. Returns `null` only when every pool entry is
 * already owned — the caller should grant CONSOLATION_SHARDS in that case.
 */
export function drawMysteryBoxItem(box: MysteryBoxDefinition, unlockedCosmetics: string[]): string | null {
  const available = box.pool.filter((entry) => !unlockedCosmetics.includes(entry.cosmeticId));
  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, entry) => sum + entry.oddsPercent, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of available) {
    roll -= entry.oddsPercent;
    if (roll <= 0) return entry.cosmeticId;
  }
  // Floating-point rounding safety net — should be unreachable.
  return available[available.length - 1].cosmeticId;
}

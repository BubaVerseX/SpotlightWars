import { getAddress, type Address } from "viem";
import { COSMETICS } from "./cosmetics";

/**
 * ---------------------------------------------------------------------
 * SHOP CONFIG — the one place to look for/edit prices and payment setup.
 * ---------------------------------------------------------------------
 * Every "purchase"-unlockMethod cosmetic in cosmetics.ts must have an entry
 * here, keyed by its id. Prices are a fixed ETH amount (not a live USD
 * conversion) — that's a deliberate choice: converting a USD price to ETH
 * at "time of purchase" would require the server to independently know
 * what exchange rate the client used in order to validate the expected wei
 * amount, which is a much more fragile design (rate-source disagreements,
 * staleness, oracle trust) for a cosmetics shop that doesn't need it. A
 * plain fixed ETH price is unambiguous on both sides and trivial to verify
 * exactly on-chain. The USD figure shown in the UI is just an
 * approximation for the player's convenience, refreshed client-side —
 * never used in the actual on-chain check.
 */

/** Where purchase payments are sent. A plain ETH transfer to this address
 * — no contract involved. */
export const SHOP_WALLET_ADDRESS: Address = getAddress("0x6208483e0b0351B124Eb048877df50DD7fbbf917");

/** How many confirmations (blocks including the one the tx landed in) to
 * require before treating a payment as final. 1 is the task's spec;
 * bump this if you want extra reorg safety. */
export const REQUIRED_CONFIRMATIONS = BigInt(1);

/** Fixed ETH price per purchasable cosmetic id. Edit prices here — nowhere
 * else. */
export const SHOP_PRICES: Record<string, string> = {
  "skin:chrome": "0.0004",
  "skin:wireframe": "0.0004",
  "animation:glitchBurst": "0.0006",
  "banner:magentaPulse": "0.0003",
  "banner:deepVoid": "0.0003",
  "banner:auroraDrift": "0.0005",
  "intro:gridWarp": "0.0004",
  "taunt:fire": "0.0002",
  "taunt:tilted": "0.0002",
  "taunt:watchThis": "0.0002",
};

export function getShopPriceEth(cosmeticId: string): string | null {
  return SHOP_PRICES[cosmeticId] ?? null;
}

/** Every cosmetic marked unlockMethod: "purchase" that's missing a price —
 * used by a startup/dev-time sanity check, not runtime logic. */
export function findPricelessPurchaseCosmetics(): string[] {
  return COSMETICS.filter((c) => c.unlockMethod === "purchase" && !SHOP_PRICES[c.id]).map((c) => c.id);
}

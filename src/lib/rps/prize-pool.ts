import type { RpsStore } from "./store";

const AMOUNT_KEY = "rps:prize-pool:amount";
const TARGET_KEY = "rps:prize-pool:target";

const DEFAULT_TARGET_USD = 1000;

// The generic store primitives are TTL-only (no "persist forever" option) —
// reusing them here with a ~10-year TTL is simpler than adding a new method
// to both RpsStore implementations just for this. Re-set on every admin
// write, so in practice it never actually expires under normal use.
const PERSIST_TTL_SECONDS = 10 * 365 * 24 * 60 * 60;

export interface PrizePoolState {
  amount: number;
  target: number;
}

function toFiniteNonNegative(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/** Reads the current amount + target, seeding the target in Redis on first
 * read if it isn't there yet (setNX — never clobbers a value an admin may
 * have already customized). */
export async function getPrizePoolState(store: RpsStore): Promise<PrizePoolState> {
  const [amountRaw, targetRaw] = await Promise.all([store.get(AMOUNT_KEY), store.get(TARGET_KEY)]);

  if (targetRaw === null) {
    await store.setNX(TARGET_KEY, String(DEFAULT_TARGET_USD), PERSIST_TTL_SECONDS);
  }

  return {
    amount: toFiniteNonNegative(amountRaw, 0),
    target: toFiniteNonNegative(targetRaw, DEFAULT_TARGET_USD) || DEFAULT_TARGET_USD,
  };
}

/** Sets the pool to an absolute amount (admin-only caller). */
export async function setPrizePoolAmount(store: RpsStore, amount: number): Promise<number> {
  const clamped = Math.max(0, amount);
  await store.set(AMOUNT_KEY, String(clamped), PERSIST_TTL_SECONDS);
  return clamped;
}

/** Adjusts the pool by a delta (admin-only caller) — convenient for "just
 * add today's cut" without having to know the running total first. */
export async function incrementPrizePoolAmount(store: RpsStore, delta: number): Promise<number> {
  const { amount } = await getPrizePoolState(store);
  const next = Math.max(0, amount + delta);
  await store.set(AMOUNT_KEY, String(next), PERSIST_TTL_SECONDS);
  return next;
}

/** The only thing ever safe to expose publicly — see the /api/rps/prize-pool
 * route, which computes this and discards amount/target before responding. */
export function computePercent(amount: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((amount / target) * 100)));
}

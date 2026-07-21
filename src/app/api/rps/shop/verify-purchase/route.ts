import { NextRequest, NextResponse } from "next/server";
import { parseEther, TransactionReceiptNotFoundError, type Hash } from "viem";
import { getRpsStore } from "@/lib/rps/store";
import { resolveIdentity } from "@/lib/rps/session";
import { getCosmetic, isCosmeticCurrentlyAvailable } from "@/lib/rps/cosmetics";
import { getShopPriceEth, REQUIRED_CONFIRMATIONS, SHOP_WALLET_ADDRESS } from "@/lib/rps/shop";
import { CONSOLATION_SHARDS, drawMysteryBoxItem, getMysteryBox } from "@/lib/rps/mysteryBoxes";
import { toPublicProfile } from "@/lib/rps/name-claim";
import { mainnetPublicClient } from "@/lib/wallet/public-client";

const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

// Never truly permanent in the store's own terms (its set() always wants a
// ttlSeconds), but 50 years is functionally forever for a used-tx record.
const CONFIRMED_TTL_SECONDS = 60 * 60 * 24 * 365 * 50;
// How long a claim attempt holds the "verifying" lock before it
// self-expires — generous, since mainnet confirmation can occasionally take
// several minutes under congestion, but bounded so a crashed request can't
// wedge the tx hash forever.
const PENDING_TTL_SECONDS = 60 * 30;

interface UsedTxRecord {
  status: "pending" | "confirmed";
  itemId: string;
  address: string;
  /** Only set once status is "confirmed" — what this tx actually granted,
   * so a retry of the same tx (e.g. a page reload mid-flow) can return the
   * original result instead of a dead-end "already used" error. For a
   * mystery box this is what makes the reveal reproducible on retry. */
  grantedItemId?: string;
  grantedShards?: number;
}

function usedTxKey(txHash: string): string {
  return `rps:shop:used-tx:${txHash.toLowerCase()}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const itemId = typeof body?.itemId === "string" ? body.itemId : "";
  const txHash = typeof body?.txHash === "string" ? (body.txHash as string) : "";

  if (!itemId || !txHash) {
    return NextResponse.json({ error: "itemId and txHash are required." }, { status: 400 });
  }
  if (!TX_HASH_PATTERN.test(txHash)) {
    return NextResponse.json({ error: "That doesn't look like a transaction hash." }, { status: 400 });
  }

  // The shop is wallet-only — resolveIdentity still prioritizes a verified
  // session over any client-supplied name, so passing "" as the fallback
  // name just means "no session -> reject", never a name-based identity.
  const identity = resolveIdentity(req, "");
  if (!identity || identity.kind !== "wallet") {
    return NextResponse.json(
      { error: "Connect and verify a wallet to purchase shop items." },
      { status: 403 }
    );
  }

  // A mystery box isn't a cosmetic — it's a purchasable *action* that grants
  // one. itemId resolves to exactly one of the two.
  const mysteryBox = getMysteryBox(itemId);
  const cosmetic = mysteryBox ? undefined : getCosmetic(itemId);
  if (!mysteryBox && (!cosmetic || cosmetic.unlockMethod !== "purchase")) {
    return NextResponse.json({ error: "That item isn't purchasable." }, { status: 400 });
  }
  if (cosmetic && !isCosmeticCurrentlyAvailable(cosmetic)) {
    return NextResponse.json({ error: "That item is no longer available for purchase." }, { status: 400 });
  }
  const priceEth = getShopPriceEth(itemId);
  if (!priceEth) {
    return NextResponse.json({ error: "That item has no price configured." }, { status: 500 });
  }

  const store = getRpsStore();
  const address = identity.address.toLowerCase();

  // Already owned — nothing to verify, just confirm success (idempotent;
  // e.g. the client retrying after a dropped response). Doesn't apply to
  // mystery boxes — they aren't things you "own", each purchase is a fresh
  // draw.
  const existingProfile = await store.getOrCreatePlayer(identity);
  if (cosmetic && existingProfile.unlockedCosmetics.includes(itemId)) {
    return NextResponse.json({ ok: true, profile: toPublicProfile(existingProfile) });
  }

  const lockKey = usedTxKey(txHash);
  const pendingRecord: UsedTxRecord = { status: "pending", itemId, address };
  const wonLock = await store.setNX(lockKey, JSON.stringify(pendingRecord), PENDING_TTL_SECONDS);

  if (!wonLock) {
    const raw = await store.get(lockKey);
    const record: UsedTxRecord | null = raw ? JSON.parse(raw) : null;

    if (record?.status === "confirmed") {
      if (record.itemId === itemId && record.address === address) {
        // This exact claim already went through (e.g. a reloaded page
        // re-polling) — return the same result rather than a dead end.
        const profile = await store.getOrCreatePlayer(identity);
        return NextResponse.json({
          ok: true,
          profile: toPublicProfile(profile),
          mysteryBox: mysteryBox
            ? { grantedItemId: record.grantedItemId ?? null, grantedShards: record.grantedShards ?? 0 }
            : undefined,
        });
      }
      return NextResponse.json(
        { error: "This transaction has already been used to unlock an item." },
        { status: 409 }
      );
    }
    if (!record || record.itemId !== itemId || record.address !== address) {
      return NextResponse.json(
        { error: "This transaction is already being used for a different claim." },
        { status: 409 }
      );
    }
    // Same item + same claimant already holds the lock (e.g. this is the
    // client's own retry/poll) — fall through and re-attempt verification
    // below rather than re-claiming the lock.
  }

  // --- On-chain verification. Every check below must pass. ---

  let receipt;
  try {
    receipt = await mainnetPublicClient.getTransactionReceipt({ hash: txHash as Hash });
  } catch (err) {
    if (err instanceof TransactionReceiptNotFoundError) {
      // Not mined yet — keep the lock (so this exact claim can keep being
      // retried) and tell the client to wait, not fail.
      return NextResponse.json(
        { status: "pending", message: "Transaction not yet confirmed on-chain. Try again shortly." },
        { status: 202 }
      );
    }
    // Unexpected RPC error — don't burn the lock on something transient.
    return NextResponse.json(
      { status: "pending", message: "Couldn't reach the chain to verify yet. Try again shortly." },
      { status: 202 }
    );
  }

  if (receipt.status !== "success") {
    await store.del(lockKey);
    return NextResponse.json({ error: "That transaction failed on-chain." }, { status: 400 });
  }

  const currentBlock = await mainnetPublicClient.getBlockNumber();
  const confirmations = currentBlock - receipt.blockNumber + BigInt(1);
  if (confirmations < REQUIRED_CONFIRMATIONS) {
    return NextResponse.json(
      { status: "pending", message: "Waiting for enough confirmations. Try again shortly." },
      { status: 202 }
    );
  }

  const tx = await mainnetPublicClient.getTransaction({ hash: txHash as Hash });

  if (!tx.to || tx.to.toLowerCase() !== SHOP_WALLET_ADDRESS.toLowerCase()) {
    await store.del(lockKey);
    return NextResponse.json({ error: "That transaction wasn't sent to the shop wallet." }, { status: 400 });
  }
  if (tx.from.toLowerCase() !== address) {
    await store.del(lockKey);
    return NextResponse.json(
      { error: "That transaction wasn't sent from your verified wallet." },
      { status: 400 }
    );
  }
  const expectedWei = parseEther(priceEth);
  if (tx.value < expectedWei) {
    await store.del(lockKey);
    return NextResponse.json(
      { error: `Insufficient payment — this item costs ${priceEth} ETH.` },
      { status: 400 }
    );
  }

  // All checks passed — grant the item, then lock this tx hash to this
  // exact claim (with what it granted) permanently.
  const profile = await store.getOrCreatePlayer(identity);

  if (mysteryBox) {
    const grantedItemId = drawMysteryBoxItem(mysteryBox, profile.unlockedCosmetics);
    let grantedShards = 0;
    if (grantedItemId) {
      profile.unlockedCosmetics.push(grantedItemId);
    } else {
      grantedShards = CONSOLATION_SHARDS;
      profile.shards += CONSOLATION_SHARDS;
    }
    await store.savePlayer(profile);

    const confirmedRecord: UsedTxRecord = {
      status: "confirmed",
      itemId,
      address,
      grantedItemId: grantedItemId ?? undefined,
      grantedShards,
    };
    await store.set(lockKey, JSON.stringify(confirmedRecord), CONFIRMED_TTL_SECONDS);

    return NextResponse.json({
      ok: true,
      profile: toPublicProfile(profile),
      mysteryBox: { grantedItemId, grantedShards },
    });
  }

  if (!profile.unlockedCosmetics.includes(itemId)) {
    profile.unlockedCosmetics.push(itemId);
    await store.savePlayer(profile);
  }

  const confirmedRecord: UsedTxRecord = { status: "confirmed", itemId, address, grantedItemId: itemId };
  await store.set(lockKey, JSON.stringify(confirmedRecord), CONFIRMED_TTL_SECONDS);

  return NextResponse.json({ ok: true, profile: toPublicProfile(profile) });
}

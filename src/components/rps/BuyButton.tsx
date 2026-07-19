"use client";

import { useCallback, useState } from "react";
import { useConnection, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { SHOP_WALLET_ADDRESS } from "@/lib/rps/shop";
import type { PublicPlayerProfile } from "@/lib/rps/types";

type BuyState = "idle" | "awaitingWallet" | "verifying" | "success" | "error";

interface BuyButtonProps {
  itemId: string;
  priceEth: string;
  /** The player's SIWE-verified address (from the session, not necessarily
   * whatever wagmi's live connector reports) — the server only accepts a
   * payment sent *from* this exact address. */
  verifiedAddress: string;
  onUnlocked: (profile: PublicPlayerProfile) => void;
}

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 45; // ~3 minutes of polling before telling the player to check back later

function describeSendError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/reject|denied|cancel/i.test(message)) {
    return "You rejected the transaction in your wallet.";
  }
  return "Couldn't send the transaction. Try again.";
}

export function BuyButton({ itemId, priceEth, verifiedAddress, onUnlocked }: BuyButtonProps) {
  const { address: connectedAddress, isConnected } = useConnection();
  const { sendTransactionAsync } = useSendTransaction();

  const [state, setState] = useState<BuyState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (txHash: string, attempt: number) => {
      try {
        const res = await fetch("/api/rps/shop/verify-purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, txHash }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.status === 202) {
          setStatusMessage(data.message ?? "Confirming on-chain...");
          if (attempt >= MAX_POLLS) {
            setState("error");
            setError(
              "Still not confirmed after a few minutes. Your payment isn't lost — reload this page and it'll pick back up from this same transaction."
            );
            return;
          }
          setTimeout(() => verify(txHash, attempt + 1), POLL_INTERVAL_MS);
          return;
        }

        if (!res.ok) {
          setState("error");
          setError(data.error ?? "Purchase verification failed.");
          return;
        }

        setState("success");
        onUnlocked(data.profile);
      } catch {
        if (attempt >= MAX_POLLS) {
          setState("error");
          setError("Couldn't verify the purchase. Reload and try again.");
          return;
        }
        setTimeout(() => verify(txHash, attempt + 1), POLL_INTERVAL_MS);
      }
    },
    [itemId, onUnlocked]
  );

  const handleBuy = async () => {
    setError(null);
    setState("awaitingWallet");
    setStatusMessage("Confirm in your wallet...");
    try {
      const txHash = await sendTransactionAsync({
        to: SHOP_WALLET_ADDRESS,
        value: parseEther(priceEth),
      });
      setState("verifying");
      setStatusMessage("Transaction sent — confirming on-chain...");
      verify(txHash, 0);
    } catch (err) {
      setState("error");
      setError(describeSendError(err));
    }
  };

  if (state === "success") {
    return (
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--neon-cyan)" }}>
        Unlocked!
      </p>
    );
  }

  const walletMismatch =
    isConnected && connectedAddress && connectedAddress.toLowerCase() !== verifiedAddress.toLowerCase();

  if (walletMismatch) {
    return (
      <p className="text-xs text-muted">
        Switch your wallet extension back to {verifiedAddress.slice(0, 6)}...{verifiedAddress.slice(-4)} (the
        address you verified with) to purchase.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={handleBuy}
        disabled={state === "awaitingWallet" || state === "verifying"}
        className="arcade-btn-solid rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "idle" && `Buy — ${priceEth} ETH`}
        {state === "awaitingWallet" && "Confirm in wallet..."}
        {state === "verifying" && "Confirming on-chain..."}
        {state === "error" && "Try again"}
      </button>
      {statusMessage && (state === "awaitingWallet" || state === "verifying") && (
        <p className="text-[11px] text-muted">{statusMessage}</p>
      )}
      {error && (
        <p className="max-w-[14rem] text-[11px]" style={{ color: "var(--neon-magenta)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

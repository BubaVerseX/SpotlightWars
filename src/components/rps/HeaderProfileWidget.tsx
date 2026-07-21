"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDisconnect } from "wagmi";
import { PlayerAvatar } from "./PlayerAvatar";
import { WalletConnect } from "./WalletConnect";
import { NameGate } from "./NameGate";
import type { ClaimNameResult } from "@/lib/rps/use-identity";

interface HeaderProfileWidgetProps {
  loading: boolean;
  name: string;
  isWalletVerified: boolean;
  walletAddress: string | null;
  equippedAvatar: string | null;
  claimName: (name: string) => Promise<ClaimNameResult>;
  checkNameAvailability: (name: string) => Promise<boolean>;
  clearName: () => void;
}

/** The far-right corner of the header — resolves to one of three states:
 * loading skeleton, "connect wallet or play as guest" for a brand new
 * visitor, or an avatar+name trigger that opens a dropdown for anyone with
 * an identity already (wallet-verified or a claimed name). */
export function HeaderProfileWidget({
  loading,
  name,
  isWalletVerified,
  walletAddress,
  equippedAvatar,
  claimName,
  checkNameAvailability,
  clearName,
}: HeaderProfileWidgetProps) {
  const [open, setOpen] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const { disconnect } = useDisconnect();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) setGuestMode(false);
  }, [open]);

  // Both actions change server-attested session/identity state that other,
  // already-mounted pages have their own independent copy of (each calls
  // useRpsIdentity() separately) — a full reload is the simplest way to
  // guarantee everything on screen (not just this header) reflects it.
  const handleDisconnect = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    disconnect();
    window.location.reload();
  };

  const handleChangeName = () => {
    clearName();
    window.location.reload();
  };

  const handleGuestClaim = async (candidate: string) => {
    setClaimError(null);
    setClaiming(true);
    const result = await claimName(candidate);
    setClaiming(false);
    if (!result.ok) {
      setClaimError(result.error);
      return;
    }
    window.location.reload();
  };

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-background-elevated" aria-hidden="true" />;
  }

  const hasIdentity = isWalletVerified || !!name;

  return (
    <div className="relative" ref={containerRef}>
      {hasIdentity ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rps-header-profile-trigger flex items-center gap-2 rounded-full py-1 pl-1 pr-3"
        >
          <PlayerAvatar equippedAvatar={equippedAvatar} walletAddress={walletAddress} name={name} size={28} />
          <span className="hidden max-w-[8rem] truncate text-xs font-semibold text-foreground sm:inline">
            {name}
          </span>
          {isWalletVerified && (
            <span style={{ color: "var(--neon-cyan)" }} title="Verified wallet — signed in with Ethereum">
              ✓
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="arcade-btn rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide"
        >
          Connect Wallet
        </button>
      )}

      {open && (
        <div className="rps-header-dropdown arcade-panel rounded-lg p-3">
          {hasIdentity ? (
            <div className="flex w-48 flex-col gap-1">
              <div className="mb-1 flex items-center gap-2 border-b border-border pb-2">
                <PlayerAvatar equippedAvatar={equippedAvatar} walletAddress={walletAddress} name={name} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    {isWalletVerified ? "Wallet verified ✓" : "Guest"}
                  </p>
                </div>
              </div>
              <Link href="/profile" onClick={() => setOpen(false)} className="rps-header-dropdown-item">
                View Profile
              </Link>
              <Link href="/settings" onClick={() => setOpen(false)} className="rps-header-dropdown-item">
                Settings
              </Link>
              <button
                type="button"
                onClick={isWalletVerified ? handleDisconnect : handleChangeName}
                className="rps-header-dropdown-item"
                style={{ color: "var(--neon-magenta)" }}
              >
                {isWalletVerified ? "Disconnect Wallet" : "Change Name"}
              </button>
            </div>
          ) : guestMode ? (
            <div className="w-64">
              <NameGate
                title="Play as Guest"
                subtitle="Pick a name — you can connect a wallet later."
                onSubmit={handleGuestClaim}
                submitLabel={claiming ? "Checking..." : "Let's go"}
                disabled={claiming}
                error={claimError}
                onCheckAvailability={checkNameAvailability}
              />
              <button
                type="button"
                onClick={() => setGuestMode(false)}
                className="mt-3 w-full text-center text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
              >
                &larr; Back
              </button>
            </div>
          ) : (
            <div className="flex w-64 flex-col items-center gap-3 py-1">
              <WalletConnect isWalletVerified={false} walletAddress={null} onChange={() => window.location.reload()} />
              <button
                type="button"
                onClick={() => setGuestMode(true)}
                className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
              >
                or play as guest
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { RPS_CLAIM_TOKEN_STORAGE_KEY, RPS_NAME_STORAGE_KEY } from "./constants";
import { shortenAddress } from "./wallet";

interface WalletSessionInfo {
  address: string;
  ensName: string | null;
}

export type ClaimNameResult = { ok: true } | { ok: false; error: string };

/**
 * Resolves to a verified wallet session when one exists (source of truth is
 * the server, via the signed cookie — never trust a locally-cached
 * "verified" flag), falling back to a plain typed-name/localStorage identity
 * otherwise. Returns the same `{ name, setName }` shape either way, so
 * existing call sites don't need to branch on which identity is active;
 * `setName`'s effect is masked while a wallet session is active, since
 * `name` prefers the wallet identity whenever one exists.
 *
 * The anonymous path also carries a `claimToken`: a long random string
 * generated once per browser and reused for every name this device ever
 * claims. It's the only thing standing between "pick a name" and "silently
 * take over whoever already has that name" — see name-claim.ts for the
 * server-side half of this.
 */
export function useRpsIdentity() {
  const [typedName, setTypedNameState] = useState("");
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setWallet(data.session ?? null);
    } catch {
      setWallet(null);
    }
  }, []);

  useEffect(() => {
    const storedName = window.localStorage.getItem(RPS_NAME_STORAGE_KEY);
    if (storedName) setTypedNameState(storedName);

    let storedToken = window.localStorage.getItem(RPS_CLAIM_TOKEN_STORAGE_KEY);
    if (!storedToken) {
      storedToken = crypto.randomUUID();
      window.localStorage.setItem(RPS_CLAIM_TOKEN_STORAGE_KEY, storedToken);
    }
    setClaimToken(storedToken);

    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const setName = useCallback((value: string) => {
    setTypedNameState(value);
    window.localStorage.setItem(RPS_NAME_STORAGE_KEY, value);
  }, []);

  /** Forgets the locally-remembered name (but keeps the device's claim
   * token — picking a new, or a previous, name from this browser still
   * proves ownership the same way) so the UI falls back to the name-entry
   * form. Used by "Not you? Change name". */
  const clearName = useCallback(() => {
    setTypedNameState("");
    window.localStorage.removeItem(RPS_NAME_STORAGE_KEY);
  }, []);

  /** The authoritative claim attempt — always re-checked server-side, never
   * trust a client-side "looks available" result alone. Only persists the
   * name locally (via setName) on success. */
  const claimName = useCallback(
    async (candidateName: string): Promise<ClaimNameResult> => {
      try {
        const res = await fetch("/api/rps/claim-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: candidateName, claimToken }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { ok: false, error: data.error ?? "That name isn't available. Try another." };
        }
        setName(candidateName);
        return { ok: true };
      } catch {
        return { ok: false, error: "Something went wrong. Try again." };
      }
    },
    [claimToken, setName]
  );

  const checkNameAvailability = useCallback(
    async (candidateName: string): Promise<boolean> => {
      try {
        const params = new URLSearchParams({ name: candidateName });
        if (claimToken) params.set("claimToken", claimToken);
        const res = await fetch(`/api/rps/name-availability?${params}`);
        if (!res.ok) return true; // don't block typing on a flaky check
        const data = await res.json();
        return data.available !== false;
      } catch {
        return true;
      }
    },
    [claimToken]
  );

  const displayName = wallet ? (wallet.ensName ?? shortenAddress(wallet.address)) : typedName;

  return {
    name: displayName,
    setName,
    clearName,
    claimName,
    checkNameAvailability,
    claimToken,
    loading,
    isWalletVerified: wallet !== null,
    walletAddress: wallet?.address ?? null,
    ensName: wallet?.ensName ?? null,
    refreshSession,
  };
}

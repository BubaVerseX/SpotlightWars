"use client";

import { useCallback, useEffect, useState } from "react";
import { RPS_NAME_STORAGE_KEY } from "./constants";
import { shortenAddress } from "./wallet";

interface WalletSessionInfo {
  address: string;
  ensName: string | null;
}

/**
 * Resolves to a verified wallet session when one exists (source of truth is
 * the server, via the signed cookie — never trust a locally-cached
 * "verified" flag), falling back to a plain typed-name/localStorage identity
 * otherwise. Returns the same `{ name, setName }` shape either way, so
 * existing call sites don't need to branch on which identity is active;
 * `setName`'s effect is masked while a wallet session is active, since
 * `name` prefers the wallet identity whenever one exists.
 */
export function useRpsIdentity() {
  const [typedName, setTypedNameState] = useState("");
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
    const stored = window.localStorage.getItem(RPS_NAME_STORAGE_KEY);
    if (stored) setTypedNameState(stored);
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const setName = useCallback((value: string) => {
    setTypedNameState(value);
    window.localStorage.setItem(RPS_NAME_STORAGE_KEY, value);
  }, []);

  const displayName = wallet ? (wallet.ensName ?? shortenAddress(wallet.address)) : typedName;

  return {
    name: displayName,
    setName,
    loading,
    isWalletVerified: wallet !== null,
    walletAddress: wallet?.address ?? null,
    ensName: wallet?.ensName ?? null,
    refreshSession,
  };
}

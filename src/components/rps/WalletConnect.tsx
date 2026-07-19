"use client";

import { useState } from "react";
import { useConnect, useConnectors, useConnection, useDisconnect, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";

interface WalletConnectProps {
  isWalletVerified: boolean;
  walletAddress: string | null;
  onChange: () => void;
}

export function WalletConnect({ isWalletVerified, walletAddress, onChange }: WalletConnectProps) {
  const { address, isConnected } = useConnection();
  const connectors = useConnectors();
  const { connectAsync, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();

  const [showPicker, setShowPicker] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (connector: (typeof connectors)[number]) => {
    setError(null);
    try {
      await connectAsync({ connector });
      setShowPicker(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect wallet.");
    }
  };

  const handleSignIn = async () => {
    if (!address) return;
    setError(null);
    setVerifying(true);
    try {
      const nonceRes = await fetch("/api/auth/nonce");
      if (!nonceRes.ok) throw new Error("Couldn't start sign-in. Try again.");
      const { nonce } = await nonceRes.json();

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement:
          "Sign this message to verify your identity for Rock Paper Scissors - no gas, no transaction, just a signature.",
        uri: window.location.origin,
        version: "1",
        chainId: 1,
        nonce,
      });
      const preparedMessage = siweMessage.prepareMessage();
      const signature = await signMessageAsync({ message: preparedMessage });

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: preparedMessage, signature }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Verification failed.");
      }
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't verify signature.");
    } finally {
      setVerifying(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    disconnect();
    onChange();
  };

  // The verified session (server-attested, persists up to 7 days) is the
  // source of truth for "is this player signed in" — independent of whether
  // wagmi's live connector still reports connected, which matters for
  // returning visitors whose wallet extension hasn't auto-reconnected yet.
  if (isWalletVerified) {
    return (
      <div className="flex flex-col items-center gap-2 text-xs text-muted">
        <span style={{ color: "var(--neon-cyan)" }}>
          Wallet verified ✓ {walletAddress && `(${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)})`}
        </span>
        <button type="button" onClick={handleDisconnect} className="underline-offset-2 hover:text-accent hover:underline">
          Disconnect Wallet
        </button>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleSignIn}
          disabled={verifying || isSigning}
          className="arcade-btn rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
        >
          {verifying || isSigning ? "Waiting for signature..." : "Sign In With Ethereum"}
        </button>
        <p className="text-xs text-muted">No gas, no transaction — just a signature to prove you own this wallet.</p>
        {error && (
          <p className="text-xs" style={{ color: "var(--neon-magenta)" }}>
            {error}
          </p>
        )}
        <button type="button" onClick={handleDisconnect} className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline">
          Use a different wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setShowPicker((v) => !v)}
        className="arcade-btn rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-wide"
      >
        Connect Wallet
      </button>
      {showPicker && (
        <div className="arcade-panel flex w-56 flex-col gap-2 rounded-lg p-3">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              onClick={() => handleConnect(connector)}
              disabled={isConnecting}
              className="arcade-btn rounded-md px-4 py-2 text-xs font-medium uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connector.name}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="text-xs" style={{ color: "var(--neon-magenta)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

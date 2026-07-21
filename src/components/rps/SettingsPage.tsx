"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDisconnect } from "wagmi";
import { useRpsIdentity } from "@/lib/rps/use-identity";
import { useBumpHeaderRefresh } from "@/lib/rps/header-refresh-context";
import { AVATARS } from "@/lib/rps/avatars";
import { shortenAddress } from "@/lib/rps/wallet";
import type { PlayerProfile } from "@/lib/rps/types";
import { NameGate } from "./NameGate";
import { WalletConnect } from "./WalletConnect";
import { PlayerAvatar } from "./PlayerAvatar";
import { AvatarIcon } from "./AvatarIcon";
import { AngledDivider } from "./AngledDivider";
import { Footer } from "@/components/Footer";

const SOUND_PREF_KEY = "rps:sound-enabled";
const AUTO_AVATAR_KEY = "__auto__";

export function SettingsPage() {
  const {
    name,
    clearName,
    claimName,
    checkNameAvailability,
    claimToken,
    loading: identityLoading,
    isWalletVerified,
    walletAddress,
    refreshSession,
  } = useRpsIdentity();
  const { disconnect } = useDisconnect();
  const bumpHeaderRefresh = useBumpHeaderRefresh();

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState<string | null>(null);

  useEffect(() => {
    setSoundEnabled(window.localStorage.getItem(SOUND_PREF_KEY) !== "off");
  }, []);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    const params = new URLSearchParams({ name });
    if (claimToken) params.set("claimToken", claimToken);
    fetch(`/api/rps/profile?${params}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile ?? null))
      .finally(() => setLoading(false));
  }, [name, claimToken]);

  const handleClaimName = async (candidateName: string) => {
    setClaimError(null);
    setClaiming(true);
    const result = await claimName(candidateName);
    setClaiming(false);
    if (!result.ok) setClaimError(result.error);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    window.localStorage.setItem(SOUND_PREF_KEY, next ? "on" : "off");
  };

  const handleEquipAvatar = async (avatarId: string | null) => {
    if (!name) return;
    setSavingAvatar(avatarId ?? AUTO_AVATAR_KEY);
    try {
      const res = await fetch("/api/rps/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, claimToken, equippedAvatar: avatarId }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        bumpHeaderRefresh();
      }
    } finally {
      setSavingAvatar(null);
    }
  };

  // Same reasoning as the header's dropdown — these change server-attested
  // identity, and a full reload is the simplest way to make sure the rest
  // of the app (including the persistent header) picks it up.
  const handleDisconnect = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    disconnect();
    window.location.href = "/";
  };

  const handleChangeName = () => {
    clearName();
    window.location.href = "/";
  };

  if (identityLoading) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  if (!name) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
        <div className="arcade-panel w-full max-w-sm rounded-lg p-6">
          <NameGate
            title="Settings"
            subtitle="Enter your name to manage your avatar and preferences."
            onSubmit={handleClaimName}
            submitLabel={claiming ? "Checking..." : "Continue"}
            disabled={claiming}
            error={claimError}
            onCheckAvailability={checkNameAvailability}
          />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">or</p>
        <WalletConnect isWalletVerified={isWalletVerified} walletAddress={walletAddress} onChange={refreshSession} />
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16">
        <div className="text-center">
          <Link href="/profile" className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline">
            &larr; Back to Profile
          </Link>
          <h1
            className="mt-4 font-display text-3xl font-bold uppercase tracking-wide"
            style={{ color: "var(--neon-cyan)", textShadow: "0 0 20px var(--neon-cyan-soft)" }}
          >
            Settings
          </h1>
        </div>

        <section>
          <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-muted">Avatar</p>
          {loading || !profile ? (
            <p className="text-center text-sm text-muted">Loading...</p>
          ) : (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              <AvatarOption
                label="Auto"
                selected={!profile.equippedAvatar}
                saving={savingAvatar === AUTO_AVATAR_KEY}
                onClick={() => handleEquipAvatar(null)}
              >
                <PlayerAvatar walletAddress={profile.walletAddress} name={profile.name} size={40} />
              </AvatarOption>
              {AVATARS.map((avatar) => (
                <AvatarOption
                  key={avatar.id}
                  label={avatar.name}
                  selected={profile.equippedAvatar === avatar.id}
                  saving={savingAvatar === avatar.id}
                  onClick={() => handleEquipAvatar(avatar.id)}
                >
                  <AvatarIcon id={avatar.id} size={40} />
                </AvatarOption>
              ))}
            </div>
          )}
        </section>

        <AngledDivider color="cyan" size="sm" />

        <section className="arcade-panel flex items-center justify-between gap-4 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">Sound Effects</p>
            <p className="text-xs text-muted">
              No sounds are wired up yet — this just saves your preference for later.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleSound}
            className={`rps-toggle ${soundEnabled ? "on" : ""}`}
            role="switch"
            aria-checked={soundEnabled}
            aria-label="Toggle sound effects"
          >
            <span className="rps-toggle-thumb" />
          </button>
        </section>

        <AngledDivider color="magenta" size="sm" />

        <section className="flex flex-col items-center gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Account</p>
          {isWalletVerified ? (
            <>
              <p className="text-xs text-muted">
                Wallet verified ✓ {walletAddress && `(${shortenAddress(walletAddress)})`}
              </p>
              <button
                type="button"
                onClick={handleDisconnect}
                className="arcade-btn rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--neon-magenta)" }}
              >
                Disconnect Wallet
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted">Playing as a guest under &ldquo;{name}&rdquo;.</p>
              <button
                type="button"
                onClick={handleChangeName}
                className="arcade-btn rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--neon-magenta)" }}
              >
                Clear Name
              </button>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function AvatarOption({
  label,
  selected,
  saving,
  onClick,
  children,
}: {
  label: string;
  selected: boolean;
  saving: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      title={label}
      className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "arcade-panel"
          : "border border-border bg-background-elevated hover:border-[var(--neon-cyan)]"
      }`}
    >
      {children}
      <span className="max-w-full truncate text-[10px] uppercase tracking-wide text-muted">{label}</span>
    </button>
  );
}

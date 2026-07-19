"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NameGate } from "./NameGate";
import { WalletConnect } from "./WalletConnect";
import { BannerPreview } from "./BannerPreview";
import { useRpsIdentity } from "@/lib/rps/use-identity";
import type { PlayerProfile } from "@/lib/rps/types";
import {
  ACHIEVEMENTS,
  getCosmeticsByCategory,
  getRankTier,
  type CosmeticCategory,
} from "@/lib/rps/cosmetics";
import { Footer } from "@/components/Footer";
import { AI_DIFFICULTIES, AI_DIFFICULTY_LABEL } from "@/lib/rps/ai";

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "var(--neon-cyan)",
  medium: "var(--neon-cyan)",
  hard: "var(--neon-magenta)",
  impossible: "var(--neon-gold)",
};

export function ProfilePage() {
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
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ name });
    if (claimToken) params.set("claimToken", claimToken);
    fetch(`/api/rps/profile?${params}`)
      .then(async (res) => {
        if (res.status === 409) {
          clearName();
          return;
        }
        const data = await res.json();
        setProfile(data.profile ?? null);
      })
      .catch(() => setError("Couldn't load your profile."))
      .finally(() => setLoading(false));
  }, [name, claimToken, clearName]);

  const handleClaimName = async (candidateName: string) => {
    setClaimError(null);
    setClaiming(true);
    const result = await claimName(candidateName);
    setClaiming(false);
    if (!result.ok) setClaimError(result.error);
  };

  const equip = async (
    field: "equippedSkin" | "equippedAnimation" | "equippedTitle" | "equippedBanner" | "equippedIntro",
    value: string | null
  ) => {
    if (!name) return;
    const res = await fetch("/api/rps/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, claimToken, [field]: value }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
    }
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
            title="Your Profile"
            subtitle="Enter your name to see your stats and cosmetics."
            onSubmit={handleClaimName}
            submitLabel={claiming ? "Checking..." : "View Profile"}
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

  if (loading || !profile) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-muted">{error ?? "Loading profile..."}</p>
      </main>
    );
  }

  const tier = getRankTier(profile.elo);

  return (
    <>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16">
        <BannerPreview bannerId={profile.equippedBanner} className="arcade-panel rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-3 text-xs">
            <Link
              href="/"
              className="text-muted underline-offset-2 hover:text-[var(--neon-cyan)] hover:underline"
            >
              &larr; Back to Rock Paper Scissors
            </Link>
            <span className="text-muted">·</span>
            <Link href="/shop" className="text-muted underline-offset-2 hover:text-[var(--neon-cyan)] hover:underline">
              Visit the Shop
            </Link>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted">Player Card</p>
          <h1
            className="mt-2 font-display text-3xl font-bold uppercase tracking-wide"
            style={{ color: "var(--neon-cyan)", textShadow: "0 0 16px var(--neon-cyan-soft)" }}
          >
            {profile.name}
          </h1>
          <p
            className="mt-1 text-sm font-semibold uppercase tracking-wide"
            style={{ color: tier.color }}
          >
            {tier.name}
          </p>
          {!isWalletVerified && (
            <button
              type="button"
              onClick={clearName}
              className="mt-2 text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
            >
              Not you? Change name
            </button>
          )}
          <div className="mt-4 flex justify-center">
            <WalletConnect isWalletVerified={isWalletVerified} walletAddress={walletAddress} onChange={refreshSession} />
          </div>
        </BannerPreview>

        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="ELO" value={profile.elo} color="var(--neon-cyan)" />
          <Stat label="Wins" value={profile.wins} color="var(--neon-cyan)" />
          <Stat label="Losses" value={profile.losses} color="var(--neon-magenta)" />
        </div>

        <div>
          <p className="mb-1 text-center text-xs uppercase tracking-[0.3em] text-muted">
            Practice Mode (vs Computer)
          </p>
          <p className="mb-3 text-center text-[10px] uppercase tracking-wide text-muted">
            Not ranked — doesn&apos;t affect ELO
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {AI_DIFFICULTIES.map((difficulty) => (
              <div key={difficulty} className="arcade-panel rounded-lg px-2 py-3">
                <p
                  className="font-display text-xl font-bold"
                  style={{ color: DIFFICULTY_COLOR[difficulty] }}
                >
                  {profile.vsComputer?.wins[difficulty] ?? 0}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  {AI_DIFFICULTY_LABEL[difficulty]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <CosmeticSection
          title="Hand Skin"
          category="skin"
          equipped={profile.equippedSkin}
          unlocked={profile.unlockedCosmetics}
          onEquip={(id) => equip("equippedSkin", id)}
        />
        <CosmeticSection
          title="Victory Animation"
          category="animation"
          equipped={profile.equippedAnimation}
          unlocked={profile.unlockedCosmetics}
          onEquip={(id) => equip("equippedAnimation", id)}
        />
        <CosmeticSection
          title="Title"
          category="title"
          equipped={profile.equippedTitle}
          unlocked={profile.unlockedCosmetics}
          onEquip={(id) => equip("equippedTitle", id)}
          allowNone
        />
        <CosmeticSection
          title="Profile Banner"
          category="banner"
          equipped={profile.equippedBanner}
          unlocked={profile.unlockedCosmetics}
          onEquip={(id) => equip("equippedBanner", id)}
          allowNone
        />
        <CosmeticSection
          title="Match Intro"
          category="intro"
          equipped={profile.equippedIntro}
          unlocked={profile.unlockedCosmetics}
          onEquip={(id) => equip("equippedIntro", id)}
          allowNone
        />

        <div>
          <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-muted">
            Taunts — usable between rounds in any match
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {getCosmeticsByCategory("taunt").map((taunt) => {
              const isUnlocked = profile.unlockedCosmetics.includes(taunt.id);
              return (
                <span
                  key={taunt.id}
                  title={taunt.description}
                  className={`rounded-lg border px-3 py-2 font-display text-sm ${
                    isUnlocked
                      ? "border-border bg-background-elevated"
                      : "border-border bg-background-elevated opacity-40"
                  }`}
                >
                  {taunt.name}
                  {!isUnlocked && <span className="ml-1">🔒</span>}
                </span>
              );
            })}
          </div>
        </div>

        <div>
          <p
            className="mb-3 text-center text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--neon-gold)" }}
          >
            Achievements
          </p>
          <ul className="space-y-2">
            {ACHIEVEMENTS.map((a) => {
              const progress = profile.achievementProgress[a.id] ?? 0;
              const done = progress >= a.target;
              return (
                <li
                  key={a.id}
                  className={`rounded-lg border px-4 py-2 text-sm ${
                    done ? "" : "border-border bg-background-elevated"
                  }`}
                  style={
                    done
                      ? {
                          borderColor: "var(--neon-gold)",
                          background: "rgba(255, 216, 74, 0.06)",
                          boxShadow: "0 0 12px var(--neon-gold-soft)",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={done ? "font-medium" : "text-muted"}
                      style={done ? { color: "var(--neon-gold)" } : undefined}
                    >
                      {a.name}
                    </span>
                    <span className="text-xs text-muted">
                      {Math.min(progress, a.target)}/{a.target}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{a.description}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="arcade-panel rounded-lg px-4 py-3">
      <p className="font-display text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function CosmeticSection({
  title,
  category,
  equipped,
  unlocked,
  onEquip,
  allowNone,
}: {
  title: string;
  category: CosmeticCategory;
  equipped: string | null;
  unlocked: string[];
  onEquip: (id: string | null) => void;
  allowNone?: boolean;
}) {
  const options = getCosmeticsByCategory(category);
  return (
    <div>
      <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-muted">{title}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {allowNone && (
          <button
            type="button"
            onClick={() => onEquip(null)}
            className={`rounded-lg px-3 py-2 text-sm uppercase tracking-wide transition ${
              equipped === null
                ? "arcade-panel"
                : "border border-border bg-background-elevated text-muted hover:border-[var(--neon-cyan)] hover:text-foreground"
            }`}
          >
            None
          </button>
        )}
        {options.map((option) => {
          const isUnlocked = unlocked.includes(option.id);
          const isEquipped = equipped === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={!isUnlocked}
              onClick={() => onEquip(option.id)}
              title={option.description}
              className={`rounded-lg px-3 py-2 text-sm uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isEquipped
                  ? "arcade-panel"
                  : "border border-border bg-background-elevated text-muted hover:border-[var(--neon-cyan)] hover:text-foreground"
              }`}
            >
              {option.name}
              {!isUnlocked && <span className="ml-1">🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

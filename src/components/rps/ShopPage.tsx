"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRpsIdentity } from "@/lib/rps/use-identity";
import { ACHIEVEMENTS, COSMETICS, type CosmeticCategory } from "@/lib/rps/cosmetics";
import { getShopPriceEth } from "@/lib/rps/shop";
import { MYSTERY_BOXES } from "@/lib/rps/mysteryBoxes";
import type { PublicPlayerProfile } from "@/lib/rps/types";
import { WalletConnect } from "./WalletConnect";
import { ShopItemCard } from "./ShopItemCard";
import { MysteryBoxCard } from "./MysteryBoxCard";
import { AngledDivider } from "./AngledDivider";
import { Footer } from "@/components/Footer";

const MYSTERY_BOX_TAB = "mysteryBox" as const;

const CATEGORY_TABS: { id: CosmeticCategory; label: string }[] = [
  { id: "skin", label: "Hand Skins" },
  { id: "animation", label: "Victory Animations" },
  { id: "title", label: "Titles" },
  { id: "banner", label: "Profile Banners" },
  { id: "intro", label: "Match Intros" },
  { id: "taunt", label: "Taunts" },
  { id: "arenaTheme", label: "Arena Themes" },
  { id: "aura", label: "Player Auras" },
  { id: "vsEffect", label: "VS-Screen Effects" },
  { id: "soundPack", label: "Sound Packs" },
  { id: "leaderboardFrame", label: "Leaderboard Frames" },
];

export function ShopPage() {
  const { name, claimToken, loading, isWalletVerified, walletAddress, refreshSession } = useRpsIdentity();
  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [category, setCategory] = useState<CosmeticCategory | typeof MYSTERY_BOX_TAB>("skin");
  const [ethUsdRate, setEthUsdRate] = useState<number | null>(null);

  useEffect(() => {
    if (!name) return;
    const params = new URLSearchParams({ name });
    if (claimToken) params.set("claimToken", claimToken);
    fetch(`/api/rps/profile?${params}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile ?? null))
      .catch(() => setProfile(null));
  }, [name, claimToken]);

  // Best-effort, display-only — never used to decide what's actually
  // charged (that's always the fixed ETH price in shop.ts, checked exactly
  // on-chain). If this fails, cards just show the ETH price alone.
  useEffect(() => {
    fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot")
      .then((res) => res.json())
      .then((data) => {
        const rate = parseFloat(data?.data?.amount);
        if (!Number.isNaN(rate)) setEthUsdRate(rate);
      })
      .catch(() => {});
  }, []);

  const itemsInCategory = category === MYSTERY_BOX_TAB ? [] : COSMETICS.filter((c) => c.category === category);

  return (
    <>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-16">
        <div className="text-center">
          <Link href="/" className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline">
            &larr; Back to Rock Paper Scissors
          </Link>
          <h1
            className="mt-4 font-display text-3xl font-bold uppercase tracking-wide"
            style={{ color: "var(--neon-cyan)", textShadow: "0 0 20px var(--neon-cyan-soft)" }}
          >
            Shop
          </h1>
          <p className="mt-2 text-sm text-muted">
            Unlock cosmetics by playing, or buy them outright with a real on-chain payment.
          </p>
        </div>

        {!loading && (
          <div className="flex justify-center">
            <WalletConnect isWalletVerified={isWalletVerified} walletAddress={walletAddress} onChange={refreshSession} />
          </div>
        )}

        <AngledDivider color="cyan" size="sm" />

        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                category === tab.id
                  ? "arcade-btn-solid"
                  : "border border-border bg-background-elevated text-muted hover:border-[var(--neon-cyan)] hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCategory(MYSTERY_BOX_TAB)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              category === MYSTERY_BOX_TAB
                ? "arcade-btn-solid"
                : "border border-border bg-background-elevated text-muted hover:border-[var(--neon-cyan)] hover:text-foreground"
            }`}
          >
            Mystery Boxes
          </button>
        </div>

        {!name ? (
          <p className="text-center text-sm text-muted">
            <Link href="/" className="underline-offset-2 hover:text-accent hover:underline">
              Pick a name or connect a wallet
            </Link>{" "}
            on the home page to see your unlock progress here.
          </p>
        ) : category === MYSTERY_BOX_TAB ? (
          <>
            <AngledDivider color="magenta" size="sm" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {MYSTERY_BOXES.map((box) => (
                <MysteryBoxCard
                  key={box.id}
                  box={box}
                  ethUsdRate={ethUsdRate}
                  isWalletVerified={isWalletVerified}
                  verifiedAddress={walletAddress}
                  onUnlocked={setProfile}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <AngledDivider color="magenta" size="sm" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 [grid-auto-flow:dense]">
              {itemsInCategory.map((cosmetic, index) => {
                const isUnlocked = profile?.unlockedCosmetics.includes(cosmetic.id) ?? false;
                const achievement = ACHIEVEMENTS.find((a) => a.id === cosmetic.achievementId);
                const achievementProgress = achievement
                  ? (profile?.achievementProgress[achievement.id] ?? 0)
                  : 0;
                const priceEth = getShopPriceEth(cosmetic.id);
                const featured = index === 0;

                return (
                  <div
                    key={cosmetic.id}
                    className={`h-full ${featured ? "col-span-2 sm:col-span-2 sm:row-span-2" : "col-span-1"}`}
                  >
                    <ShopItemCard
                      cosmetic={cosmetic}
                      isUnlocked={isUnlocked}
                      achievement={achievement}
                      achievementProgress={achievementProgress}
                      priceEth={priceEth}
                      ethUsdRate={ethUsdRate}
                      isWalletVerified={isWalletVerified}
                      verifiedAddress={walletAddress}
                      onUnlocked={setProfile}
                      featured={featured}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

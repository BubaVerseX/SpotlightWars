"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NameGate } from "./NameGate";
import { useRpsName } from "@/lib/rps/use-name";
import type { PlayerProfile } from "@/lib/rps/types";
import {
  ACHIEVEMENTS,
  getCosmeticsByCategory,
  getRankTier,
  type CosmeticCategory,
} from "@/lib/rps/cosmetics";
import { Footer } from "@/components/Footer";

export function ProfilePage() {
  const { name, setName } = useRpsName();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    setError(null);
    fetch(`/api/rps/profile?name=${encodeURIComponent(name)}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile))
      .catch(() => setError("Couldn't load your profile."))
      .finally(() => setLoading(false));
  }, [name]);

  const equip = async (
    field: "equippedSkin" | "equippedAnimation" | "equippedTitle",
    value: string | null
  ) => {
    if (!name) return;
    const res = await fetch("/api/rps/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, [field]: value }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
    }
  };

  if (!name) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
        <NameGate
          title="Your Profile"
          subtitle="Enter your name to see your stats and cosmetics."
          onSubmit={setName}
          submitLabel="View Profile"
        />
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
        <div className="text-center">
          <Link href="/rps" className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline">
            &larr; Back to Rock Paper Scissors
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted">Profile</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{profile.name}</h1>
          <p className="mt-1 text-sm font-semibold" style={{ color: tier.color }}>
            {tier.name}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="ELO" value={profile.elo} />
          <Stat label="Wins" value={profile.wins} />
          <Stat label="Losses" value={profile.losses} />
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

        <div>
          <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-muted">
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
                    done ? "border-accent/40 bg-accent/10" : "border-border bg-background-elevated"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={done ? "text-foreground" : "text-muted"}>{a.name}</span>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background-elevated px-4 py-3">
      <p className="font-display text-2xl font-bold text-accent">{value}</p>
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
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              equipped === null
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-background-elevated text-muted hover:border-accent/60"
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
              className={`rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isEquipped
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-background-elevated text-muted hover:border-accent/60"
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

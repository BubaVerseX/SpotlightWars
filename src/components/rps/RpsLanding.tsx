"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NameGate } from "./NameGate";
import { LeaderboardList } from "./LeaderboardList";
import { PlayerBadge } from "./PlayerBadge";
import { DifficultyPicker } from "./DifficultyPicker";
import { WalletConnect } from "./WalletConnect";
import { useRpsIdentity } from "@/lib/rps/use-identity";
import type { AiDifficulty, PublicPlayerProfile } from "@/lib/rps/types";
import { Footer } from "@/components/Footer";

interface RpsLandingProps {
  initialLeaderboard: PublicPlayerProfile[];
}

type Panel = "menu" | "challengeLink" | "difficultyPicker";

export function RpsLanding({ initialLeaderboard }: RpsLandingProps) {
  const {
    name,
    clearName,
    claimName,
    checkNameAvailability,
    claimToken,
    loading,
    isWalletVerified,
    walletAddress,
    refreshSession,
  } = useRpsIdentity();
  const router = useRouter();
  const [busy, setBusy] = useState<"queue" | "challenge" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [challengeLink, setChallengeLink] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("menu");
  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    const params = new URLSearchParams({ name });
    if (claimToken) params.set("claimToken", claimToken);
    fetch(`/api/rps/profile?${params}`)
      .then(async (res) => {
        if (res.status === 409) {
          // Someone else already owns this name now (rare cross-device
          // conflict) — fall back to the name-entry form instead of
          // silently showing the wrong/stale data.
          clearName();
          setProfile(null);
          return;
        }
        const data = await res.json();
        setProfile(data.profile ?? null);
      })
      .catch(() => setProfile(null));
  }, [name, claimToken, clearName]);

  const handleClaimName = async (candidateName: string) => {
    setClaimError(null);
    setClaiming(true);
    const result = await claimName(candidateName);
    setClaiming(false);
    if (!result.ok) setClaimError(result.error);
  };

  const handleFindRandom = async () => {
    setError(null);
    setBusy("queue");
    try {
      const res = await fetch("/api/rps/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Matchmaking failed. Try again.");
      const data = await res.json();
      router.push(`/match/${data.matchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(null);
    }
  };

  const handleCreateChallenge = async () => {
    setError(null);
    setBusy("challenge");
    try {
      const res = await fetch("/api/rps/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Couldn't create a challenge link. Try again.");
      const data = await res.json();
      setChallengeLink(`${window.location.origin}/challenge/${data.matchId}`);
      setPanel("challengeLink");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const handleSelectDifficulty = (difficulty: AiDifficulty) => {
    router.push(`/computer/${difficulty}`);
  };

  if (loading) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  if (!name) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
        <NameGate
          title="Rock Paper Scissors"
          subtitle="Pick a name. Everyone will see it when they play you."
          onSubmit={handleClaimName}
          submitLabel={claiming ? "Checking..." : "Let's go"}
          disabled={claiming}
          error={claimError}
          onCheckAvailability={checkNameAvailability}
        />
        <p className="text-xs uppercase tracking-[0.3em] text-muted">or</p>
        <WalletConnect isWalletVerified={isWalletVerified} walletAddress={walletAddress} onChange={refreshSession} />
      </main>
    );
  }

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Welcome back</p>
          <PlayerBadge name={name} elo={profile?.elo} equippedTitle={profile?.equippedTitle} />
          <div className="flex items-center gap-3 text-xs text-muted">
            <Link href="/profile" className="underline-offset-2 hover:text-accent hover:underline">
              View profile &amp; cosmetics
            </Link>
            <span>·</span>
            <Link href="/shop" className="underline-offset-2 hover:text-accent hover:underline">
              Shop
            </Link>
            {!isWalletVerified && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={clearName}
                  className="underline-offset-2 hover:text-accent hover:underline"
                >
                  Not you? Change name
                </button>
              </>
            )}
          </div>
        </div>

        <WalletConnect isWalletVerified={isWalletVerified} walletAddress={walletAddress} onChange={refreshSession} />

        {panel === "menu" && (
          <div className="flex w-full max-w-sm flex-col gap-3">
            <button
              type="button"
              onClick={handleFindRandom}
              disabled={busy !== null}
              className="arcade-btn-solid arcade-pulse w-full rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "queue" ? "Finding opponent..." : "Find Random Opponent"}
            </button>
            <button
              type="button"
              onClick={handleCreateChallenge}
              disabled={busy !== null}
              className="arcade-btn w-full rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "challenge" ? "Creating link..." : "Challenge a Friend"}
            </button>
            <button
              type="button"
              onClick={() => setPanel("difficultyPicker")}
              disabled={busy !== null}
              className="arcade-btn w-full rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
            >
              Play vs Computer
            </button>
          </div>
        )}

        {panel === "difficultyPicker" && (
          <DifficultyPicker onSelect={handleSelectDifficulty} onBack={() => setPanel("menu")} />
        )}

        {panel === "challengeLink" && challengeLink && (
          <ChallengeLinkPanel
            link={challengeLink}
            onEnterMatch={() => router.push(`/match/${challengeLink.split("/").pop()}`)}
          />
        )}

        {error && (
          <p className="text-sm" style={{ color: "var(--neon-magenta)" }}>
            {error}
          </p>
        )}

        <div className="arcade-panel w-full max-w-sm rounded-lg p-4">
          <p
            className="mb-3 text-center text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--neon-cyan)", textShadow: "0 0 10px var(--neon-cyan-soft)" }}
          >
            High Scores
          </p>
          <LeaderboardList entries={initialLeaderboard} />
        </div>
      </main>
      <Footer extraLink={{ href: "/spotlight", label: "Check out Spotlight Throne" }} />
    </>
  );
}

function ChallengeLinkPanel({ link, onEnterMatch }: { link: string; onEnterMatch: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="w-full max-w-sm space-y-4 text-center">
      <p className="text-sm text-muted">Share this link with a friend:</p>
      <div className="arcade-input flex items-center gap-2 rounded-lg px-3 py-2">
        <span className="flex-1 truncate text-left font-mono text-xs text-muted">{link}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="arcade-btn shrink-0 rounded-md px-3 py-1 text-xs font-medium uppercase tracking-wide"
        >
          {copied ? "Copied" : "Copy Link"}
        </button>
      </div>
      <button
        type="button"
        onClick={onEnterMatch}
        className="arcade-btn-solid w-full rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide"
      >
        Enter Match Room
      </button>
    </div>
  );
}

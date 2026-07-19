"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NameGate } from "./NameGate";
import { LeaderboardList } from "./LeaderboardList";
import { useRpsName } from "@/lib/rps/use-name";
import type { LeaderboardEntry } from "@/lib/rps/types";
import { Footer } from "@/components/Footer";

interface RpsLandingProps {
  initialLeaderboard: LeaderboardEntry[];
}

export function RpsLanding({ initialLeaderboard }: RpsLandingProps) {
  const { name, setName } = useRpsName();
  const router = useRouter();
  const [busy, setBusy] = useState<"queue" | "challenge" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [challengeLink, setChallengeLink] = useState<string | null>(null);

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
      router.push(`/rps/match/${data.matchId}`);
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
      setChallengeLink(`${window.location.origin}/rps/challenge/${data.matchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  if (!name) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
        <NameGate
          title="Rock Paper Scissors"
          subtitle="Pick a name. Everyone will see it when they play you."
          onSubmit={setName}
          submitLabel="Let's go"
        />
      </main>
    );
  }

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Playing as</p>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">{name}</p>
        </div>

        {!challengeLink ? (
          <div className="flex w-full max-w-sm flex-col gap-3">
            <button
              type="button"
              onClick={handleFindRandom}
              disabled={busy !== null}
              className="w-full rounded-xl bg-accent px-6 py-3 font-display font-semibold text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "queue" ? "Finding opponent..." : "Find Random Opponent"}
            </button>
            <button
              type="button"
              onClick={handleCreateChallenge}
              disabled={busy !== null}
              className="w-full rounded-xl border border-border bg-background-elevated px-6 py-3 font-display font-semibold text-foreground transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "challenge" ? "Creating link..." : "Challenge a Friend"}
            </button>
          </div>
        ) : (
          <ChallengeLinkPanel
            link={challengeLink}
            onEnterMatch={() => router.push(`/rps/match/${challengeLink.split("/").pop()}`)}
          />
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="w-full max-w-sm">
          <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-muted">
            Leaderboard
          </p>
          <LeaderboardList entries={initialLeaderboard} />
        </div>
      </main>
      <Footer />
    </>
  );
}

function ChallengeLinkPanel({ link, onEnterMatch }: { link: string; onEnterMatch: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="w-full max-w-sm space-y-4 text-center">
      <p className="text-sm text-muted">Share this link with a friend:</p>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background-elevated px-3 py-2">
        <span className="flex-1 truncate text-left font-mono text-xs text-muted">{link}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="shrink-0 rounded-lg bg-background px-3 py-1 text-xs font-medium text-accent hover:brightness-110"
        >
          {copied ? "Copied" : "Copy Link"}
        </button>
      </div>
      <button
        type="button"
        onClick={onEnterMatch}
        className="w-full rounded-xl bg-accent px-6 py-3 font-display font-semibold text-background transition hover:brightness-110"
      >
        Enter Match Room
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NameGate } from "./NameGate";
import { LeaderboardList } from "./LeaderboardList";
import { PlayerBadge } from "./PlayerBadge";
import { DifficultyPicker } from "./DifficultyPicker";
import { useRpsName } from "@/lib/rps/use-name";
import type { AiDifficulty, PlayerProfile } from "@/lib/rps/types";
import { Footer } from "@/components/Footer";

interface RpsLandingProps {
  initialLeaderboard: PlayerProfile[];
}

type Panel = "menu" | "challengeLink" | "difficultyPicker";

export function RpsLanding({ initialLeaderboard }: RpsLandingProps) {
  const { name, setName } = useRpsName();
  const router = useRouter();
  const [busy, setBusy] = useState<"queue" | "challenge" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [challengeLink, setChallengeLink] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("menu");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (!name) return;
    fetch(`/api/rps/profile?name=${encodeURIComponent(name)}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile))
      .catch(() => setProfile(null));
  }, [name]);

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
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Playing as</p>
          <PlayerBadge name={name} elo={profile?.elo} equippedTitle={profile?.equippedTitle} />
          <Link href="/profile" className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline">
            View profile &amp; cosmetics
          </Link>
        </div>

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

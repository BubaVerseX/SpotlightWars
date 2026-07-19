"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NameGate } from "./NameGate";
import { useRpsName } from "@/lib/rps/use-name";

export function ChallengeJoin({ matchId }: { matchId: string }) {
  const { name, setName } = useRpsName();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const handleJoin = async (chosenName: string) => {
    setName(chosenName);
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/rps/challenge/${matchId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: chosenName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't join this challenge.");
      }
      router.push(`/rps/match/${matchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setJoining(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <NameGate
        title="You've been challenged!"
        subtitle="Enter a name to join the match."
        onSubmit={handleJoin}
        submitLabel={joining ? "Joining..." : "Join Match"}
        defaultValue={name}
        disabled={joining}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </main>
  );
}

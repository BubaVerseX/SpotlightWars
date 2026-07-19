"use client";

import { useEffect, useState } from "react";
import { HandIcon } from "./HandIcon";
import { VictoryAnimation } from "./VictoryAnimation";
import { MatchIntroOverlay } from "./MatchIntroOverlay";
import { BannerPreview } from "./BannerPreview";
import { getCosmetic, type CosmeticCategory } from "@/lib/rps/cosmetics";

// Animations and intros are one-shot CSS animations (fill-mode: forwards) —
// fine mid-match, but a shop card just showing a frozen end-frame forever
// isn't a useful preview. Remounting on an interval restarts them so
// browsers actually get to see the effect.
const REPLAY_INTERVAL_MS = 2800;

interface CosmeticPreviewProps {
  id: string;
  category: CosmeticCategory;
}

export function CosmeticPreview({ id, category }: CosmeticPreviewProps) {
  const [replayKey, setReplayKey] = useState(0);
  const needsReplay = category === "animation" || category === "intro";

  useEffect(() => {
    if (!needsReplay) return;
    const interval = setInterval(() => setReplayKey((k) => k + 1), REPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [needsReplay]);

  if (category === "skin") {
    return (
      <div className="flex h-16 items-center justify-center text-4xl">
        <HandIcon move="rock" skin={id} />
      </div>
    );
  }

  if (category === "animation") {
    return (
      <div className="relative h-16 overflow-hidden rounded bg-background">
        <VictoryAnimation key={replayKey} animation={id} />
      </div>
    );
  }

  if (category === "banner") {
    return <BannerPreview bannerId={id} className="h-16 rounded" />;
  }

  if (category === "intro") {
    return (
      <div className="relative h-16 overflow-hidden rounded bg-background">
        <MatchIntroOverlay key={replayKey} introId={id} contained />
      </div>
    );
  }

  const cosmetic = getCosmetic(id);

  if (category === "taunt") {
    return (
      <div
        className="flex h-16 items-center justify-center font-display text-2xl"
        style={{ color: "var(--neon-cyan)" }}
      >
        {cosmetic?.name}
      </div>
    );
  }

  // "title"
  return (
    <div
      className="flex h-16 items-center justify-center font-display text-lg font-bold uppercase tracking-wide"
      style={{ color: cosmetic?.color ?? "var(--foreground)" }}
    >
      {cosmetic?.name}
    </div>
  );
}

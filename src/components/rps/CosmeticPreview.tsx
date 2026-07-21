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
  size?: "md" | "lg";
}

export function CosmeticPreview({ id, category, size = "md" }: CosmeticPreviewProps) {
  const [replayKey, setReplayKey] = useState(0);
  const needsReplay = category === "animation" || category === "intro";
  const heightClass = size === "lg" ? "h-24" : "h-16";

  useEffect(() => {
    if (!needsReplay) return;
    const interval = setInterval(() => setReplayKey((k) => k + 1), REPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [needsReplay]);

  if (category === "skin") {
    return (
      <div className={`flex ${heightClass} items-center justify-center ${size === "lg" ? "text-6xl" : "text-4xl"}`}>
        <HandIcon move="rock" skin={id} />
      </div>
    );
  }

  if (category === "animation") {
    return (
      <div className={`relative ${heightClass} overflow-hidden rounded bg-background`}>
        <VictoryAnimation key={replayKey} animation={id} />
      </div>
    );
  }

  if (category === "banner") {
    return <BannerPreview bannerId={id} className={`${heightClass} rounded`} />;
  }

  if (category === "intro") {
    return (
      <div className={`relative ${heightClass} overflow-hidden rounded bg-background`}>
        <MatchIntroOverlay key={replayKey} introId={id} contained />
      </div>
    );
  }

  const cosmetic = getCosmetic(id);

  if (category === "taunt") {
    return (
      <div
        className={`flex ${heightClass} items-center justify-center font-display ${size === "lg" ? "text-4xl" : "text-2xl"}`}
        style={{ color: "var(--neon-cyan)" }}
      >
        {cosmetic?.name}
      </div>
    );
  }

  // "title"
  return (
    <div
      className={`flex ${heightClass} items-center justify-center font-display font-bold uppercase tracking-wide ${size === "lg" ? "text-2xl" : "text-lg"}`}
      style={{ color: cosmetic?.color ?? "var(--foreground)" }}
    >
      {cosmetic?.name}
    </div>
  );
}

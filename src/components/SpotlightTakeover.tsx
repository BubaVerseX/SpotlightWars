"use client";

import { useEffect, useState } from "react";
import type { SpotlightPayload } from "@/types/spotlight";
import { TAKEOVER_EXIT_MS } from "@/lib/constants";

interface SpotlightTakeoverProps {
  spotlight: SpotlightPayload;
  durationMs: number;
}

export function SpotlightTakeover({ spotlight, durationMs }: SpotlightTakeoverProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setLeaving(false);
    const timer = setTimeout(() => setLeaving(true), Math.max(durationMs - TAKEOVER_EXIT_MS, 0));
    return () => clearTimeout(timer);
  }, [spotlight.id, durationMs]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background px-6 text-center transition-opacity duration-500 ${
        leaving ? "opacity-0" : "animate-takeover-in opacity-100"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, var(--accent-soft) 0%, transparent 60%)",
        }}
      />
      <div className="relative max-w-4xl">
        <p className="break-words font-display text-4xl font-bold leading-tight text-foreground glow-text sm:text-6xl">
          {spotlight.message}
        </p>
        <p className="mt-6 text-lg font-medium tracking-wide text-accent sm:text-xl">
          — {spotlight.name}
        </p>
      </div>
    </div>
  );
}

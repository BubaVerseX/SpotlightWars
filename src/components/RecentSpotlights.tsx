"use client";

import type { SpotlightPayload } from "@/types/spotlight";

function timeAgo(timestamp: number): string {
  const seconds = Math.max(Math.floor((Date.now() - timestamp) / 1000), 0);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function RecentSpotlights({ spotlights }: { spotlights: SpotlightPayload[] }) {
  if (spotlights.length === 0) return null;

  return (
    <div className="w-full max-w-md">
      <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-muted">
        Recent Spotlights
      </p>
      <ul className="space-y-2">
        {spotlights.map((s) => (
          <li
            key={s.id}
            className="flex items-baseline justify-between gap-3 rounded-lg border border-border bg-background-elevated px-4 py-2 text-sm"
          >
            <span className="truncate text-foreground">
              <span className="text-accent">{s.name}:</span> {s.message}
            </span>
            <span className="shrink-0 text-xs text-muted">{timeAgo(s.timestamp)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

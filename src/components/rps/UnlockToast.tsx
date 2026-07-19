"use client";

import { useEffect } from "react";
import { getCosmetic } from "@/lib/rps/cosmetics";

interface UnlockToastProps {
  cosmeticIds: string[];
  onDismiss: () => void;
}

export function UnlockToast({ cosmeticIds, onDismiss }: UnlockToastProps) {
  useEffect(() => {
    if (cosmeticIds.length === 0) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [cosmeticIds, onDismiss]);

  if (cosmeticIds.length === 0) return null;

  return (
    <div className="fixed inset-x-0 top-6 z-50 flex flex-col items-center gap-2 px-4">
      {cosmeticIds.map((id) => {
        const cosmetic = getCosmetic(id);
        if (!cosmetic) return null;
        return (
          <div
            key={id}
            className="animate-takeover-in flex items-center gap-3 rounded-xl border border-accent/40 bg-background-elevated px-4 py-3 shadow-lg"
          >
            <span className="text-2xl">🔓</span>
            <div>
              <p className="font-display text-sm font-semibold text-accent">New Unlock!</p>
              <p className="text-xs text-muted">{cosmetic.name}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

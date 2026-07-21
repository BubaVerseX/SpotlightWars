"use client";

import { useEffect, useState } from "react";

interface PoolState {
  percent: number;
  full: boolean;
}

/** Shows only a fill percentage — the API this reads from
 * (/api/rps/prize-pool) deliberately never returns the raw dollar amount or
 * target, so there's nothing here to leak either. */
export function PrizePoolBar() {
  const [state, setState] = useState<PoolState | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rps/prize-pool")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.percent === "number") {
          setState({ percent: data.percent, full: !!data.full });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Skip rendering rather than flash an empty/zero-width bar before the
  // real percentage loads.
  if (!state) return null;

  const { percent, full } = state;

  return (
    <div className={`rps-depth-float arcade-panel w-full rounded-lg p-5 ${full ? "rps-prize-pool-full" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p
          className="font-display text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: "var(--neon-gold)", textShadow: "0 0 10px var(--neon-gold-soft)" }}
        >
          Community Prize Pool
        </p>
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          className="text-[10px] uppercase tracking-wide text-muted underline-offset-2 hover:text-accent hover:underline"
        >
          {showInfo ? "Close" : "Learn more"}
        </button>
      </div>

      <div className="rps-prize-pool-track mt-4" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className={`rps-prize-pool-fill ${full ? "full" : ""}`} style={{ width: `${percent}%` }} />
      </div>

      <p className="mt-2 text-center text-xs">
        {full ? (
          <span className="font-display font-semibold uppercase tracking-wide" style={{ color: "var(--neon-gold)" }}>
            Pool Full — Winners Coming Soon
          </span>
        ) : (
          <span className="text-muted">{percent}% funded</span>
        )}
      </p>

      <p className="mt-1 text-center text-xs text-muted">
        Funded by the game. Distributed to top players when it&apos;s full.
      </p>

      {showInfo && (
        <p className="mt-3 rounded-md border border-border bg-background-elevated p-3 text-left text-xs text-muted">
          This pool is funded from the game&apos;s own revenue — never from player entry fees or
          purchases. Once it fills, winners are chosen from the leaderboard at our discretion. No
          purchase is required to be eligible: leaderboard rank comes purely from playing, not
          spending.
        </p>
      )}
    </div>
  );
}

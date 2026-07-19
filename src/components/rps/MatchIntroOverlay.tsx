interface MatchIntroOverlayProps {
  introId: string | null | undefined;
  /** Renders scoped to the nearest `relative` ancestor instead of the whole
   * viewport — used by the shop's preview cards, which need this contained
   * to a small box rather than covering the page. */
  contained?: boolean;
}

/** A brief (<1.5s), self-dismissing flourish played once when a player first
 * sees their opponent in a match room. By default a `position: fixed`
 * overlay — it never blocks or delays the room's real content, which
 * renders underneath immediately. */
export function MatchIntroOverlay({ introId, contained }: MatchIntroOverlayProps) {
  const positionClass = contained ? "absolute inset-0" : "pointer-events-none fixed inset-0 z-40";

  if (introId === "intro:powerUpFlash") {
    return (
      <div className={`${positionClass} flex items-center justify-center overflow-hidden`}>
        <div className="animate-intro-power-up-flash absolute inset-0 bg-[#eaf6ff]" />
      </div>
    );
  }

  if (introId === "intro:gridWarp") {
    return (
      <div className={`${positionClass} flex items-center justify-center overflow-hidden`}>
        <div
          className="animate-intro-grid-warp absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>
    );
  }

  if (introId === "intro:neonBootup") {
    return (
      <div className={`${positionClass} flex items-center justify-center overflow-hidden`}>
        <p
          className="animate-intro-neon-bootup font-display text-4xl font-black uppercase tracking-[0.3em]"
          style={{ color: "var(--neon-cyan)", textShadow: "0 0 24px var(--neon-cyan), 0 0 60px var(--neon-cyan-soft)" }}
        >
          Ready
        </p>
      </div>
    );
  }

  return null;
}

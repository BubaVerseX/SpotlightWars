const VS_EFFECT_CLASS: Record<string, string> = {
  "vsEffect:energyClash": "animate-vsEffect-energyClash",
  "vsEffect:lightningCollision": "animate-vsEffect-lightningCollision",
  "vsEffect:explosiveImpact": "animate-vsEffect-explosiveImpact",
};

interface VsScreenOverlayProps {
  vsEffectId: string | null | undefined;
  myName: string;
  opponentName: string;
  /** Renders scoped to the nearest `relative` ancestor instead of the whole
   * viewport — used by the shop's preview cards. Same convention as
   * MatchIntroOverlay's `contained` prop. */
  contained?: boolean;
}

/** A brief clash flourish showing both names, played alongside (not instead
 * of) the existing MatchIntroOverlay — driven by the *local* player's own
 * equipped effect, same non-synced convention as ArenaBackdrop. */
export function VsScreenOverlay({ vsEffectId, myName, opponentName, contained }: VsScreenOverlayProps) {
  const effectClass = vsEffectId ? VS_EFFECT_CLASS[vsEffectId] : undefined;
  if (!effectClass) return null;

  const positionClass = contained ? "absolute inset-0" : "pointer-events-none fixed inset-0 z-40";

  return (
    <div className={`${positionClass} flex items-center justify-center overflow-hidden`}>
      <div className={`absolute inset-0 ${effectClass}`} aria-hidden="true" />
      <div className="relative z-10 flex items-center gap-3 font-display text-xl font-black uppercase tracking-wide sm:text-2xl">
        <span
          className="truncate"
          style={{ color: "var(--neon-cyan)", textShadow: "0 0 14px var(--neon-cyan-soft)" }}
        >
          {myName}
        </span>
        <span className="text-xs text-muted">VS</span>
        <span
          className="truncate"
          style={{ color: "var(--neon-magenta)", textShadow: "0 0 14px var(--neon-magenta-soft)" }}
        >
          {opponentName}
        </span>
      </div>
    </div>
  );
}

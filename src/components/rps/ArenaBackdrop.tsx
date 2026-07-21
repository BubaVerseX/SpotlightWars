const ARENA_CLASS: Record<string, string> = {
  "arenaTheme:cyberGrid": "rps-arena-cyberGrid",
  "arenaTheme:volcanicCore": "rps-arena-volcanicCore",
  "arenaTheme:deepSpace": "rps-arena-deepSpace",
  "arenaTheme:neonCity": "rps-arena-neonCity",
  "arenaTheme:solsticeBloom": "rps-arena-solsticeBloom",
};

interface ArenaBackdropProps {
  arenaThemeId: string | null | undefined;
  /** Renders scoped to the nearest `relative` ancestor instead of the whole
   * viewport — used by the shop's preview cards. Same convention as
   * MatchIntroOverlay's `contained` prop. */
  contained?: boolean;
}

/** A full-bleed background layer behind the match room, driven by the
 * *local* player's own equipped arena theme — deliberately not synced with
 * the opponent (each player just sees their own choice, same as e.g. hand
 * skins don't have to match). Renders nothing (falls back to the plain
 * site-wide grid) when no theme is equipped or unrecognized. */
export function ArenaBackdrop({ arenaThemeId, contained }: ArenaBackdropProps) {
  const arenaClass = arenaThemeId ? ARENA_CLASS[arenaThemeId] : undefined;
  if (!arenaClass) return null;

  const positionClass = contained ? "absolute inset-0 overflow-hidden pointer-events-none" : "rps-arena-layer";
  return <div className={`${positionClass} ${arenaClass}`} aria-hidden="true" />;
}

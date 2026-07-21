interface AvatarIconProps {
  id: string;
  size?: number | string;
  className?: string;
}

interface GlyphSpec {
  color: string;
  glow: string;
  path: React.ReactNode;
}

const GLYPHS: Record<string, GlyphSpec> = {
  "avatar:hexCore": {
    color: "#00f0ff",
    glow: "#00f0ff",
    path: (
      <>
        <path d="M32 10 L52 21 L52 43 L32 54 L12 43 L12 21 Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="32" cy="32" r="6" fill="currentColor" />
      </>
    ),
  },
  "avatar:delta": {
    color: "#ff2ee6",
    glow: "#ff2ee6",
    path: <path d="M32 12 L54 50 L10 50 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />,
  },
  "avatar:prism": {
    color: "#ffd84a",
    glow: "#ffd84a",
    path: (
      <path d="M32 8 L54 32 L32 56 L10 32 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    ),
  },
  "avatar:orbit": {
    color: "#00f0ff",
    glow: "#00f0ff",
    path: (
      <>
        <circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="32" cy="12" r="4.5" fill="currentColor" />
        <circle cx="32" cy="32" r="3" fill="currentColor" />
      </>
    ),
  },
  "avatar:circuit": {
    color: "#39ff88",
    glow: "#39ff88",
    path: (
      <>
        <path
          d="M14 32 H24 M40 32 H50 M32 14 V24 M32 40 V50 M24 32 L32 24 L40 32 L32 40 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="32" r="3" fill="currentColor" />
        <circle cx="50" cy="32" r="3" fill="currentColor" />
        <circle cx="32" cy="14" r="3" fill="currentColor" />
        <circle cx="32" cy="50" r="3" fill="currentColor" />
      </>
    ),
  },
  "avatar:aegis": {
    color: "#ff2ee6",
    glow: "#ff2ee6",
    path: (
      <path
        d="M32 9 L52 17 V31 C52 44 44 52 32 56 C20 52 12 44 12 31 V17 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    ),
  },
  "avatar:spark": {
    color: "#ffd84a",
    glow: "#ffd84a",
    path: <path d="M34 8 L16 34 H28 L24 56 L48 26 H35 Z" fill="currentColor" />,
  },
  "avatar:rock": {
    color: "#00f0ff",
    glow: "#00f0ff",
    path: <circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="3" />,
  },
  "avatar:paper": {
    color: "#00f0ff",
    glow: "#00f0ff",
    path: <rect x="12" y="12" width="40" height="40" rx="9" fill="none" stroke="currentColor" strokeWidth="3" />,
  },
  "avatar:scissors": {
    color: "#ff2ee6",
    glow: "#ff2ee6",
    path: (
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="14" y1="18" x2="50" y2="46" />
        <line x1="14" y1="46" x2="50" y2="18" />
      </g>
    ),
  },
};

/** One of the curated, always-available avatar icons — see AVATARS in
 * lib/rps/avatars.ts. Falls back to a plain ring if `id` isn't recognized
 * (defensive only; callers should have already validated against AVATARS). */
export function AvatarIcon({ id, size = "1em", className }: AvatarIconProps) {
  const glyph = GLYPHS[id];
  if (!glyph) {
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
        <circle cx="32" cy="32" r="20" fill="none" stroke="var(--muted)" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={{ color: glyph.color, filter: `drop-shadow(0 0 4px ${glyph.glow})` }}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.03)" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      {glyph.path}
    </svg>
  );
}

import { generateBlockie } from "@/lib/rps/blockie";

interface BlockieAvatarProps {
  seed: string;
  size?: number | string;
  className?: string;
}

/** Deterministic generated-pattern avatar — the default look for anyone who
 * hasn't picked one of the curated AVATARS icons. */
export function BlockieAvatar({ seed, size = "1em", className }: BlockieAvatarProps) {
  const { bg, fg, cells } = generateBlockie(seed);
  const n = cells.length;

  return (
    <svg
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width={n} height={n} fill={bg} />
      {cells.map((row, y) =>
        row.map((on, x) => (on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fg} /> : null))
      )}
    </svg>
  );
}

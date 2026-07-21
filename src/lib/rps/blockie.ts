/**
 * Dependency-free deterministic "identicon" generator — same idea as
 * blockies/jazzicons (stable per-seed pattern + colors) without pulling in
 * an external package. Used as the default avatar for wallet-connected
 * players (seeded by address) and as a stable fallback for anyone who
 * hasn't picked one of the curated AVATARS icons (seeded by display name).
 */

function hashString(seed: string): number {
  // FNV-1a 32-bit.
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Small deterministic PRNG (splitmix32) seeded from the hash above, so a
 * single string seed can still drive several independent-looking draws
 * (hue, saturation, each grid cell...). */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x9e3779b9) | 0;
    let t = state ^ (state >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    t ^= t >>> 15;
    return (t >>> 0) / 4294967296;
  };
}

export interface BlockiePattern {
  bg: string;
  fg: string;
  cells: boolean[][];
}

const GRID_SIZE = 5;

export function generateBlockie(seed: string): BlockiePattern {
  const rng = makeRng(hashString(seed || "guest"));

  const hue = Math.floor(rng() * 360);
  const bgHue = (hue + 140 + Math.floor(rng() * 80)) % 360;
  const fg = `hsl(${hue}, ${70 + Math.floor(rng() * 20)}%, 58%)`;
  const bg = `hsl(${bgHue}, 35%, 14%)`;

  // Mirror the left half onto the right for a symmetric identicon look.
  const half = Math.ceil(GRID_SIZE / 2);
  const cells: boolean[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < half; x++) row[x] = rng() > 0.55;
    for (let x = half; x < GRID_SIZE; x++) row[x] = row[GRID_SIZE - 1 - x];
    cells.push(row);
  }

  return { bg, fg, cells };
}

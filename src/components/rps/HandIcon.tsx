import { MOVE_EMOJI } from "@/lib/rps/constants";
import type { Move } from "@/lib/rps/types";

const PIXEL_GRIDS: Record<Move, string[]> = {
  rock: [
    "00111100",
    "01111110",
    "11111111",
    "11111111",
    "11111111",
    "11111111",
    "01111110",
    "00111100",
  ],
  paper: [
    "01111110",
    "11111111",
    "10111101",
    "10111101",
    "10111101",
    "10111101",
    "11111111",
    "01111110",
  ],
  scissors: [
    "11000011",
    "01100110",
    "00111100",
    "00011000",
    "00011000",
    "00111100",
    "01100110",
    "11000011",
  ],
};

function ShapeGlyph({ move }: { move: Move }) {
  if (move === "rock") return <circle cx="32" cy="32" r="22" />;
  if (move === "paper") return <rect x="10" y="10" width="44" height="44" rx="10" />;
  return (
    <g>
      <rect x="8" y="29" width="48" height="6" rx="3" transform="rotate(20 32 32)" />
      <rect x="8" y="29" width="48" height="6" rx="3" transform="rotate(-20 32 32)" />
    </g>
  );
}

function PixelGlyph({ move }: { move: Move }) {
  const grid = PIXEL_GRIDS[move];
  const cell = 8;
  return (
    <>
      {grid.map((row, y) =>
        [...row].map((bit, x) =>
          bit === "1" ? (
            <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} />
          ) : null
        )
      )}
    </>
  );
}

interface HandIconProps {
  move: Move;
  skin: string;
}

export function HandIcon({ move, skin }: HandIconProps) {
  if (skin === "skin:retro8bit") {
    return (
      <svg
        viewBox="0 0 64 64"
        width="1em"
        height="1em"
        shapeRendering="crispEdges"
        fill="#4dffb8"
        style={{ filter: "drop-shadow(0 0 4px #4dffb8)" }}
        aria-hidden="true"
      >
        <PixelGlyph move={move} />
      </svg>
    );
  }

  if (skin === "skin:minimalLine") {
    return (
      <svg
        viewBox="0 0 64 64"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <ShapeGlyph move={move} />
      </svg>
    );
  }

  if (skin === "skin:neon") {
    return (
      <svg
        viewBox="0 0 64 64"
        width="1em"
        height="1em"
        fill="none"
        stroke="#00f0ff"
        strokeWidth="3"
        style={{ filter: "drop-shadow(0 0 6px #00f0ff) drop-shadow(0 0 14px #00f0ff)" }}
        aria-hidden="true"
      >
        <ShapeGlyph move={move} />
      </svg>
    );
  }

  // "skin:default" (or anything unrecognized) falls back to the original emoji.
  return <>{MOVE_EMOJI[move]}</>;
}

import { useId } from "react";
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
  // SVG gradient/pattern <defs> ids are global to the document, so two hands
  // on screen at once (self + opponent, or the 3 MoveButtons) would collide
  // on a hardcoded id — useId() keeps each instance's defs unique.
  const uid = useId();

  if (skin === "skin:chrome") {
    return (
      <svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-chrome`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef3f6" />
            <stop offset="35%" stopColor="#9fb0bb" />
            <stop offset="55%" stopColor="#ffffff" />
            <stop offset="80%" stopColor="#7c8b95" />
            <stop offset="100%" stopColor="#c9d4da" />
          </linearGradient>
        </defs>
        <g
          fill={`url(#${uid}-chrome)`}
          stroke="#4a5a63"
          strokeWidth="1"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
        >
          <ShapeGlyph move={move} />
        </g>
      </svg>
    );
  }

  if (skin === "skin:plasma") {
    return (
      <svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-plasma`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff2ee6" />
            <stop offset="50%" stopColor="#a239ff" />
            <stop offset="100%" stopColor="#00f0ff" />
          </linearGradient>
        </defs>
        <g
          fill={`url(#${uid}-plasma)`}
          style={{
            filter: "drop-shadow(0 0 6px #ff2ee6) drop-shadow(0 0 14px #a239ff)",
          }}
        >
          <ShapeGlyph move={move} />
        </g>
      </svg>
    );
  }

  if (skin === "skin:wireframe") {
    return (
      <svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true">
        <defs>
          <pattern
            id={`${uid}-mesh`}
            width="8"
            height="8"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="8" stroke="#7bdcff" strokeWidth="1" opacity="0.55" />
          </pattern>
        </defs>
        <g fill={`url(#${uid}-mesh)`} stroke="#7bdcff" strokeWidth="1.5">
          <ShapeGlyph move={move} />
        </g>
      </svg>
    );
  }

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

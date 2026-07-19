import type { Move } from "./types";

export function decideWinner(moveA: Move, moveB: Move): "A" | "B" | "draw" {
  if (moveA === moveB) return "draw";
  const beats: Record<Move, Move> = { rock: "scissors", paper: "rock", scissors: "paper" };
  return beats[moveA] === moveB ? "A" : "B";
}

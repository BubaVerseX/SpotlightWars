import { MOVES } from "./constants";
import type { AiDifficulty, Move } from "./types";

export const AI_DIFFICULTIES: AiDifficulty[] = ["easy", "medium", "hard", "impossible"];

export const AI_DIFFICULTY_LABEL: Record<AiDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  impossible: "Impossible",
};

export const AI_DIFFICULTY_DESCRIPTION: Record<AiDifficulty, string> = {
  easy: "Fully random moves — no strategy at all.",
  medium: "Tracks your favorite move and sometimes counters it.",
  hard: "Aggressively counters your recent pattern. Humans repeat more than they think.",
  impossible: "Never sees your current move — reads your patterns ruthlessly across the match instead.",
};

function randomMove(): Move {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

function counterTo(move: Move): Move {
  const counters: Record<Move, Move> = { rock: "paper", paper: "scissors", scissors: "rock" };
  return counters[move];
}

function mostFrequent(history: Move[]): Move | null {
  if (history.length === 0) return null;
  const counts: Record<Move, number> = { rock: 0, paper: 0, scissors: 0 };
  for (const move of history) counts[move] += 1;
  return (Object.keys(counts) as Move[]).sort((a, b) => counts[b] - counts[a])[0];
}

/**
 * Predicts the player's next move from what typically follows their last
 * move (a first-order transition table) once there's enough evidence,
 * falling back to plain frequency otherwise.
 */
function predictNextMove(history: Move[]): Move | null {
  if (history.length === 0) return null;
  if (history.length < 3) return mostFrequent(history);

  const last = history[history.length - 1];
  const transitionCounts: Record<Move, number> = { rock: 0, paper: 0, scissors: 0 };
  for (let i = 0; i < history.length - 1; i++) {
    if (history[i] === last) transitionCounts[history[i + 1]] += 1;
  }
  const totalTransitions = transitionCounts.rock + transitionCounts.paper + transitionCounts.scissors;
  if (totalTransitions >= 2) {
    return (Object.keys(transitionCounts) as Move[]).sort((a, b) => transitionCounts[b] - transitionCounts[a])[0];
  }
  return mostFrequent(history);
}

/**
 * Chooses the AI's move for the round using only `playerHistory` — moves
 * from rounds the player has already completed. The move the player is
 * currently deciding on is never an input here, so no difficulty can "peek"
 * at what's about to be submitted; higher difficulties just get better at
 * exploiting the player's past tendencies.
 */
export function pickAiMove(difficulty: AiDifficulty, playerHistory: Move[]): Move {
  switch (difficulty) {
    case "easy":
      return randomMove();

    case "medium": {
      if (Math.random() >= 0.45) return randomMove();
      const predicted = mostFrequent(playerHistory);
      return predicted ? counterTo(predicted) : randomMove();
    }

    case "hard": {
      if (Math.random() >= 0.75) return randomMove();
      const predicted = mostFrequent(playerHistory.slice(-2)) ?? mostFrequent(playerHistory);
      return predicted ? counterTo(predicted) : randomMove();
    }

    case "impossible": {
      const predicted = predictNextMove(playerHistory);
      if (!predicted) return randomMove();
      return Math.random() < 0.9 ? counterTo(predicted) : randomMove();
    }
  }
}

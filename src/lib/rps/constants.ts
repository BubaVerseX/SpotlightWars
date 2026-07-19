import type { Move } from "./types";

export const RPS_CHANNEL_PREFIX = "presence-rps-match-";
export const RPS_REVEAL_EVENT = "rps:reveal";
export const RPS_REMATCH_EVENT = "rps:rematch";

export const RPS_NAME_STORAGE_KEY = "rps:display-name";
export const MAX_NAME_LENGTH = 24;

export const COUNTDOWN_SECONDS = 3;
export const CHOOSE_SECONDS = 10;
export const REVEAL_DURATION_MS = 2600;
export const NEXT_ROUND_DELAY_MS = 1800;
export const ROUNDS_TO_WIN = 2;
/** How long to wait in the random-matchmaking queue before giving up and
 * showing "no opponents found" instead of hanging silently forever. */
export const QUEUE_WAIT_TIMEOUT_SECONDS = 40;

export function rpsMatchChannel(matchId: string): string {
  return `${RPS_CHANNEL_PREFIX}${matchId}`;
}

export const MOVES: Move[] = ["rock", "paper", "scissors"];

export const MOVE_EMOJI: Record<Move, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};

export const MOVE_LABEL: Record<Move, string> = {
  rock: "Rock",
  paper: "Paper",
  scissors: "Scissors",
};

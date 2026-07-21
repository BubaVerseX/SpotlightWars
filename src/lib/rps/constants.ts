import type { Move } from "./types";

export const RPS_CHANNEL_PREFIX = "presence-rps-match-";
export const RPS_REVEAL_EVENT = "rps:reveal";
export const RPS_REMATCH_EVENT = "rps:rematch";
export const RPS_TAUNT_EVENT = "rps:taunt";

export const RPS_NAME_STORAGE_KEY = "rps:display-name";
export const RPS_CLAIM_TOKEN_STORAGE_KEY = "rps:claim-token";
export const MAX_NAME_LENGTH = 24;
/** localStorage key for the sound on/off preference — shared between
 * SettingsPage.tsx (writes it) and sound.ts (reads it before playing). */
export const SOUND_PREF_KEY = "rps:sound-enabled";
export const MAX_CUSTOM_TAUNT_LENGTH = 24;

export const COUNTDOWN_SECONDS = 3;
export const CHOOSE_SECONDS = 10;
export const REVEAL_DURATION_MS = 2600;
export const NEXT_ROUND_DELAY_MS = 1800;
export const ROUNDS_TO_WIN = 2;
/** How long to wait in the random-matchmaking queue before giving up and
 * showing "no opponents found" instead of hanging silently forever. */
export const QUEUE_WAIT_TIMEOUT_SECONDS = 40;

/** How long a taunt bubble stays on screen before fading out. */
export const TAUNT_DISPLAY_MS = 2200;
/** How long a match-intro flourish plays before the room settles into its
 * normal state — kept short by design so it never delays match start. */
export const MATCH_INTRO_DURATION_MS = 1400;
/** How long the VS-screen clash effect plays, shown alongside the match
 * intro — same "never delays anything" design. */
export const VS_EFFECT_DURATION_MS = 1400;

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

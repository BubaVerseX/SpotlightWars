export type Move = "rock" | "paper" | "scissors";

export type AiDifficulty = "easy" | "medium" | "hard" | "impossible";

/** Wins/losses vs the computer, kept separate from ranked human stats and
 * excluded from ELO entirely. */
export interface VsComputerStats {
  wins: Record<AiDifficulty, number>;
  losses: Record<AiDifficulty, number>;
}

export interface MoveEntry {
  name: string;
  move: Move;
}

export interface PlayerProfile {
  name: string;
  elo: number;
  peakElo: number;
  wins: number;
  losses: number;
  currentWinStreak: number;
  bestWinStreak: number;
  unlockedCosmetics: string[];
  equippedSkin: string;
  equippedAnimation: string;
  equippedTitle: string | null;
  achievementProgress: Record<string, number>;
  vsComputer: VsComputerStats;
}

export interface MatchStats {
  name: string;
  eloBefore: number;
  eloAfter: number;
  newUnlocks: string[];
}

export interface RoundRevealPayload {
  moves: Record<string, Move>;
  roundWinnerId: string | null;
  scoreByMemberId: Record<string, number>;
  matchWinnerId: string | null;
  matchStats?: Record<string, MatchStats>;
  timestamp: number;
}

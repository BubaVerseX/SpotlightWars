export type Move = "rock" | "paper" | "scissors";

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

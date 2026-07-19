export type Move = "rock" | "paper" | "scissors";

export interface LeaderboardEntry {
  name: string;
  wins: number;
}

export interface MoveEntry {
  name: string;
  move: Move;
}

export interface RevealPayload {
  moves: Record<string, Move>;
  winnerId: string | null;
  timestamp: number;
}

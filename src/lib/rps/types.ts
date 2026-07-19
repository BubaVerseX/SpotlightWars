export type Move = "rock" | "paper" | "scissors";

export type AiDifficulty = "easy" | "medium" | "hard" | "impossible";

/** Wins/losses vs the computer, kept separate from ranked human stats and
 * excluded from ELO entirely. */
export interface VsComputerStats {
  wins: Record<AiDifficulty, number>;
  losses: Record<AiDifficulty, number>;
}

/** Identity resolved server-side for a single request — either a
 * SIWE-verified wallet session (trusted, from the signed cookie) or a
 * client-typed display name (unverified, trusted only for anonymous play).
 * Never construct the "wallet" variant from a client-supplied string; it
 * must only ever come from `resolveIdentity` reading the session cookie. */
export type PlayerIdentity = { kind: "wallet"; address: string; ensName?: string | null } | { kind: "name"; name: string };

export interface MoveEntry {
  move: Move;
  /** What to show for this move in the reveal/results UI — ENS name or
   * shortened address for wallet players, the typed name otherwise. */
  displayName: string;
  /** Set only when this move came from a SIWE-verified session, resolved
   * server-side at submission time (never trust a client-supplied address
   * string directly — see PlayerIdentity). */
  walletAddress: string | null;
}

export interface PlayerProfile {
  name: string;
  /** Lowercased wallet address; presence of this field is what makes a
   * profile "verified" on the leaderboard. Only ever set by server code that
   * has independently checked a SIWE session — never client-supplied. */
  walletAddress: string | null;
  ensName: string | null;
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

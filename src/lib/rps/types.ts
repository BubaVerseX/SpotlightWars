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
  /** The submitting device's claim token, captured at submission time —
   * only meaningful when walletAddress is null. Lets match resolution
   * verify (not just trust) that this player still owns `displayName`
   * before touching that profile's stats — see name-claim.ts. */
  claimToken: string | null;
}

export interface PlayerProfile {
  name: string;
  /** Lowercased wallet address; presence of this field is what makes a
   * profile "verified" on the leaderboard. Only ever set by server code that
   * has independently checked a SIWE session — never client-supplied. */
  walletAddress: string | null;
  ensName: string | null;
  /** Lightweight anti-collision protection for name-based (non-wallet)
   * profiles — a long random string the claiming device generated and keeps
   * in localStorage. `null` means unclaimed: either brand new, or a legacy
   * profile from before this field existed (auto-claimed by whoever next
   * loads it — see name-claim.ts). Never sent to any client; strip it via
   * toPublicProfile() before returning a profile anywhere. Always null for
   * wallet profiles, which use the SIWE session as their real claim. */
  claimToken: string | null;
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
  /** Background shown behind the player's stats on their profile/leaderboard
   * row. `null` means no banner (the plain default background). */
  equippedBanner: string | null;
  /** Brief flourish played when this player enters a match room. `null`
   * means no intro (the room just appears, as it always used to). */
  equippedIntro: string | null;
  /** Manually-picked avatar icon id, or `null` to fall back to a
   * deterministically generated pattern (see blockie.ts) seeded from the
   * wallet address, or the display name for name-based players. Unlike
   * skins/animations/titles, avatars aren't achievement-gated — every id in
   * AVATARS is available to everyone from the start. */
  equippedAvatar: string | null;
  /** Match-room background/environment. `null` means the plain default. */
  equippedArenaTheme: string | null;
  /** Glow/ring/particle effect shown around this player's name+avatar during
   * a match — visible to the opponent too (threaded through Pusher presence,
   * unlike most of the fields below). `null` means no aura. */
  equippedAura: string | null;
  /** Alternate "you vs opponent" clash animation played at match start,
   * alongside (not replacing) equippedIntro. `null` means the plain default. */
  equippedVsEffect: string | null;
  /** Always has a value — every player has at least the free default pack,
   * mirroring equippedSkin/equippedAnimation. */
  equippedSoundPack: string;
  /** Decorative animated border around this player's leaderboard row,
   * visible to everyone browsing the leaderboard. `null` means none. */
  equippedLeaderboardFrame: string | null;
  /** Player-authored taunt text, only settable once "taunt:custom" is
   * unlocked. Filtered + length-capped server-side at save time (see
   * profanity.ts) — never re-validated at send time, the stored value is
   * already trusted. `null` means not set (or unlock not owned). */
  customTaunt: string | null;
  /** Lightweight consolation currency, currently only granted when a mystery
   * box's pool is fully owned already. Not spendable anywhere yet — just
   * tracked and displayed. */
  shards: number;
  achievementProgress: Record<string, number>;
  vsComputer: VsComputerStats;
}

/** What's safe to ever send to a client — every PlayerProfile that crosses
 * an API/page boundary should be this shape, never the raw PlayerProfile
 * (which carries claimToken, a bearer secret). See toPublicProfile(). */
export type PublicPlayerProfile = Omit<PlayerProfile, "claimToken">;

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

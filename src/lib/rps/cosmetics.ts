import type { AiDifficulty, PlayerProfile, VsComputerStats } from "./types";
import { shortenAddress } from "./wallet";

export type CosmeticCategory = "skin" | "animation" | "title" | "banner" | "intro" | "taunt";

export interface CosmeticDefinition {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  unlockMethod: "achievement" | "purchase";
  achievementId?: string;
  /** Only set for "title" cosmetics — recolors the player's name. */
  color?: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  metric: "matchWins" | "winStreak" | "eloReached" | "vsComputerWin";
  target: number;
  /** Only set when metric is "vsComputerWin" — which difficulty must be beaten. */
  vsComputerDifficulty?: AiDifficulty;
}

export const DEFAULT_SKIN = "skin:default";
export const DEFAULT_ANIMATION = "animation:default";

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-win",
    name: "First Blood",
    description: "Win your first match",
    metric: "matchWins",
    target: 1,
  },
  {
    id: "five-wins",
    name: "High Roller",
    description: "Win 5 matches",
    metric: "matchWins",
    target: 5,
  },
  {
    id: "fifteen-wins",
    name: "Grandmaster Grip",
    description: "Win 15 matches",
    metric: "matchWins",
    target: 15,
  },
  {
    id: "three-streak",
    name: "On Fire",
    description: "Win 3 matches in a row",
    metric: "winStreak",
    target: 3,
  },
  {
    id: "elo-1100",
    name: "Making Moves",
    description: "Reach 1100 ELO",
    metric: "eloReached",
    target: 1100,
  },
  {
    id: "elo-1300",
    name: "Elite Status",
    description: "Reach 1300 ELO",
    metric: "eloReached",
    target: 1300,
  },
  {
    id: "beat-hard-ai",
    name: "Outmaneuvered",
    description: "Beat the Hard AI in practice mode",
    metric: "vsComputerWin",
    target: 1,
    vsComputerDifficulty: "hard",
  },
  {
    id: "beat-impossible-ai",
    name: "Ghost In The Machine",
    description: "Beat the Impossible AI in practice mode",
    metric: "vsComputerWin",
    target: 1,
    vsComputerDifficulty: "impossible",
  },
  {
    id: "beat-easy-ai",
    name: "Warm-Up",
    description: "Beat the Easy AI in practice mode",
    metric: "vsComputerWin",
    target: 1,
    vsComputerDifficulty: "easy",
  },
  {
    id: "beat-medium-ai",
    name: "Getting Serious",
    description: "Beat the Medium AI in practice mode",
    metric: "vsComputerWin",
    target: 1,
    vsComputerDifficulty: "medium",
  },
  {
    id: "ten-streak",
    name: "Unstoppable",
    description: "Win 10 matches in a row",
    metric: "winStreak",
    target: 10,
  },
  {
    id: "thirty-wins",
    name: "Champion",
    description: "Win 30 matches",
    metric: "matchWins",
    target: 30,
  },
  {
    id: "elo-1500",
    name: "Transcendent",
    description: "Reach 1500 ELO",
    metric: "eloReached",
    target: 1500,
  },
];

export const COSMETICS: CosmeticDefinition[] = [
  {
    id: DEFAULT_SKIN,
    category: "skin",
    name: "Classic",
    description: "The original hand emoji.",
    unlockMethod: "achievement",
  },
  {
    id: "skin:minimalLine",
    category: "skin",
    name: "Minimal Line Art",
    description: "Clean single-stroke hands.",
    unlockMethod: "achievement",
    achievementId: "first-win",
  },
  {
    id: "skin:neon",
    category: "skin",
    name: "Neon",
    description: "Glowing neon-outline hands.",
    unlockMethod: "achievement",
    achievementId: "five-wins",
  },
  {
    id: "skin:retro8bit",
    category: "skin",
    name: "Retro 8-Bit",
    description: "Pixel-art hands.",
    unlockMethod: "achievement",
    achievementId: "fifteen-wins",
  },

  {
    id: DEFAULT_ANIMATION,
    category: "animation",
    name: "Classic Clash",
    description: "The original reveal animation.",
    unlockMethod: "achievement",
  },
  {
    id: "animation:confetti",
    category: "animation",
    name: "Confetti Burst",
    description: "Confetti rains down when you win a round.",
    unlockMethod: "achievement",
    achievementId: "first-win",
  },
  {
    id: "animation:lightning",
    category: "animation",
    name: "Lightning Strike",
    description: "Lightning flashes when you win a round.",
    unlockMethod: "achievement",
    achievementId: "three-streak",
  },

  {
    id: "title:sharpshooter",
    category: "title",
    name: "Sharpshooter",
    description: "Awarded for your first match win.",
    unlockMethod: "achievement",
    achievementId: "first-win",
    color: "#00f0ff",
  },
  {
    id: "title:unbeaten",
    category: "title",
    name: "Unbeaten",
    description: "Awarded for a 3-match win streak.",
    unlockMethod: "achievement",
    achievementId: "three-streak",
    color: "#ff2ee6",
  },
  {
    id: "title:veteran",
    category: "title",
    name: "Veteran",
    description: "Awarded for reaching 1100 ELO.",
    unlockMethod: "achievement",
    achievementId: "elo-1100",
    color: "#7bdcff",
  },
  {
    id: "title:legend",
    category: "title",
    name: "Legend",
    description: "Awarded for reaching 1300 ELO.",
    unlockMethod: "achievement",
    achievementId: "elo-1300",
    color: "#ffd84a",
  },
  {
    id: "title:aiSlayer",
    category: "title",
    name: "AI Slayer",
    description: "Awarded for beating the Impossible AI in practice mode.",
    unlockMethod: "achievement",
    achievementId: "beat-impossible-ai",
    color: "#39ff88",
  },

  // --- Skins (purchase/achievement mix) ---
  {
    id: "skin:chrome",
    category: "skin",
    name: "Chrome",
    description: "Polished metallic hands with a hard specular highlight.",
    unlockMethod: "purchase",
  },
  {
    id: "skin:plasma",
    category: "skin",
    name: "Plasma",
    description: "Superheated gradient hands with a soft plasma glow.",
    unlockMethod: "achievement",
    achievementId: "beat-medium-ai",
  },
  {
    id: "skin:wireframe",
    category: "skin",
    name: "Wireframe",
    description: "Faceted 3D wireframe hands, CAD-viewport style.",
    unlockMethod: "purchase",
  },

  // --- Victory animations ---
  {
    id: "animation:shockwave",
    category: "animation",
    name: "Shockwave",
    description: "A concussive ring blasts out from your winning hand.",
    unlockMethod: "achievement",
    achievementId: "ten-streak",
  },
  {
    id: "animation:glitchBurst",
    category: "animation",
    name: "Glitch Burst",
    description: "The screen glitches and tears for a beat on your win.",
    unlockMethod: "purchase",
  },
  {
    id: "animation:supernova",
    category: "animation",
    name: "Supernova",
    description: "Your win detonates the screen in a blinding white-out.",
    unlockMethod: "achievement",
    achievementId: "elo-1500",
  },

  // --- Profile banners (shown behind stats on profile + leaderboard row) ---
  {
    id: "banner:cyberGrid",
    category: "banner",
    name: "Cyber Grid",
    description: "A scrolling cyan grid horizon.",
    unlockMethod: "achievement",
    achievementId: "first-win",
  },
  {
    id: "banner:magentaPulse",
    category: "banner",
    name: "Magenta Pulse",
    description: "A slow-breathing magenta radial glow.",
    unlockMethod: "purchase",
  },
  {
    id: "banner:goldRush",
    category: "banner",
    name: "Gold Rush",
    description: "Diagonal gold streaks for players who've made it.",
    unlockMethod: "achievement",
    achievementId: "elo-1300",
  },
  {
    id: "banner:deepVoid",
    category: "banner",
    name: "Deep Void",
    description: "A near-black starfield with a faint drift.",
    unlockMethod: "purchase",
  },
  {
    id: "banner:auroraDrift",
    category: "banner",
    name: "Aurora Drift",
    description: "Slow-shifting cyan-to-magenta aurora bands.",
    unlockMethod: "purchase",
  },

  // --- Match intro animations (brief, plays once entering a match room) ---
  {
    id: "intro:powerUpFlash",
    category: "intro",
    name: "Power-Up Flash",
    description: "A quick white flash and scale-in as the room loads.",
    unlockMethod: "achievement",
    achievementId: "beat-easy-ai",
  },
  {
    id: "intro:gridWarp",
    category: "intro",
    name: "Grid Warp",
    description: "The floor grid warps and snaps into place.",
    unlockMethod: "purchase",
  },
  {
    id: "intro:neonBootup",
    category: "intro",
    name: "Neon Bootup",
    description: "Your name flickers on like a neon sign powering up.",
    unlockMethod: "achievement",
    achievementId: "five-wins",
  },

  // --- Taunts (quick reactions between rounds — purely visual, no effect) ---
  {
    id: "taunt:ggwp",
    category: "taunt",
    name: "GG",
    description: "Good game.",
    unlockMethod: "achievement",
    achievementId: "first-win",
  },
  {
    id: "taunt:fire",
    category: "taunt",
    name: "🔥",
    description: "You're on fire.",
    unlockMethod: "purchase",
  },
  {
    id: "taunt:tilted",
    category: "taunt",
    name: "😤",
    description: "A little frustrated.",
    unlockMethod: "purchase",
  },
  {
    id: "taunt:laughing",
    category: "taunt",
    name: "😂",
    description: "That was funny.",
    unlockMethod: "achievement",
    achievementId: "three-streak",
  },
  {
    id: "taunt:watchThis",
    category: "taunt",
    name: "👀",
    description: "Watch this.",
    unlockMethod: "purchase",
  },
  {
    id: "taunt:destroyed",
    category: "taunt",
    name: "💀",
    description: "Reserved for the truly dominant.",
    unlockMethod: "achievement",
    achievementId: "thirty-wins",
  },
];

export function getCosmetic(id: string | null | undefined): CosmeticDefinition | undefined {
  if (!id) return undefined;
  return COSMETICS.find((c) => c.id === id);
}

export function getCosmeticsByCategory(category: CosmeticCategory): CosmeticDefinition[] {
  return COSMETICS.filter((c) => c.category === category);
}

export function createEmptyVsComputerStats(): VsComputerStats {
  return {
    wins: { easy: 0, medium: 0, hard: 0, impossible: 0 },
    losses: { easy: 0, medium: 0, hard: 0, impossible: 0 },
  };
}

/** Older saved profiles predate vs-computer tracking; back-fill in place so
 * every caller can rely on `profile.vsComputer` always being present. */
export function ensureVsComputerStats(profile: PlayerProfile): VsComputerStats {
  if (!profile.vsComputer) {
    profile.vsComputer = createEmptyVsComputerStats();
  }
  return profile.vsComputer;
}

export function createDefaultProfile(name: string): PlayerProfile {
  // Only the *base* achievement-tier cosmetics (no specific achievement
  // gating them, e.g. the starting hand skin) come free. Purchase-tier
  // cosmetics also lack an achievementId — they're gated by price, not
  // progress — so this must check unlockMethod too, or every paid item
  // would be handed out for free to every new profile.
  const alwaysUnlocked = COSMETICS.filter((c) => c.unlockMethod === "achievement" && !c.achievementId).map(
    (c) => c.id
  );
  return {
    name,
    walletAddress: null,
    ensName: null,
    claimToken: null,
    elo: 1000,
    peakElo: 1000,
    wins: 0,
    losses: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    unlockedCosmetics: alwaysUnlocked,
    equippedSkin: DEFAULT_SKIN,
    equippedAnimation: DEFAULT_ANIMATION,
    equippedTitle: null,
    equippedBanner: null,
    equippedIntro: null,
    equippedAvatar: null,
    achievementProgress: {},
    vsComputer: createEmptyVsComputerStats(),
  };
}

/** Wallet-based profiles start with a completely fresh ELO/stats/cosmetics
 * slate — deliberately not merged with any name-based profile the same
 * person might have played under before (see AGENTS discussion: keeping
 * this simple was an explicit choice, not an oversight). */
export function createDefaultWalletProfile(address: string, ensName: string | null): PlayerProfile {
  const lower = address.toLowerCase();
  const base = createDefaultProfile(ensName ?? shortenAddress(lower));
  return { ...base, walletAddress: lower, ensName };
}

/**
 * Mutates `profile` in place (progress + newly-unlocked cosmetics) and
 * returns the cosmetic ids that just became unlocked, so the caller can
 * surface a toast without re-deriving what changed.
 */
export function evaluateAchievements(profile: PlayerProfile): string[] {
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    const progress = getAchievementProgress(achievement, profile);
    profile.achievementProgress[achievement.id] = progress;

    if (progress < achievement.target) continue;

    for (const cosmetic of COSMETICS) {
      if (cosmetic.achievementId !== achievement.id) continue;
      if (!profile.unlockedCosmetics.includes(cosmetic.id)) {
        profile.unlockedCosmetics.push(cosmetic.id);
        newlyUnlocked.push(cosmetic.id);
      }
    }
  }

  return newlyUnlocked;
}

function getAchievementProgress(achievement: AchievementDefinition, profile: PlayerProfile): number {
  switch (achievement.metric) {
    case "matchWins":
      return profile.wins;
    case "winStreak":
      return profile.bestWinStreak;
    case "eloReached":
      return profile.peakElo;
    case "vsComputerWin":
      return ensureVsComputerStats(profile).wins[achievement.vsComputerDifficulty!];
  }
}

const K_FACTOR = 32;

export function calculateEloChange(
  ratingWinner: number,
  ratingLoser: number
): { winnerDelta: number; loserDelta: number } {
  const expectedWinner = 1 / (1 + 10 ** ((ratingLoser - ratingWinner) / 400));
  const expectedLoser = 1 - expectedWinner;
  const winnerDelta = Math.round(K_FACTOR * (1 - expectedWinner));
  const loserDelta = Math.round(K_FACTOR * (0 - expectedLoser));
  return { winnerDelta, loserDelta };
}

export interface RankTier {
  name: string;
  color: string;
}

const RANK_TIERS: { threshold: number; tier: RankTier }[] = [
  { threshold: 1300, tier: { name: "Legend", color: "#ffd84a" } },
  { threshold: 1100, tier: { name: "Veteran", color: "#ff2ee6" } },
  { threshold: 900, tier: { name: "Contender", color: "#00f0ff" } },
  { threshold: -Infinity, tier: { name: "Rookie", color: "#7c98b3" } },
];

export function getRankTier(elo: number): RankTier {
  return RANK_TIERS.find((t) => elo >= t.threshold)!.tier;
}

import type { PlayerProfile } from "./types";

export type CosmeticCategory = "skin" | "animation" | "title";

export interface CosmeticDefinition {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  /** Free unlocks today; keeping the field lets a paid tier slot in later
   * without restructuring the cosmetic or player data. */
  unlockMethod: "achievement" | "purchase";
  achievementId?: string;
  /** Only set for "title" cosmetics — recolors the player's name. */
  color?: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  metric: "matchWins" | "winStreak" | "eloReached";
  target: number;
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
    color: "#f5b942",
  },
  {
    id: "title:unbeaten",
    category: "title",
    name: "Unbeaten",
    description: "Awarded for a 3-match win streak.",
    unlockMethod: "achievement",
    achievementId: "three-streak",
    color: "#5eead4",
  },
  {
    id: "title:veteran",
    category: "title",
    name: "Veteran",
    description: "Awarded for reaching 1100 ELO.",
    unlockMethod: "achievement",
    achievementId: "elo-1100",
    color: "#93c5fd",
  },
  {
    id: "title:legend",
    category: "title",
    name: "Legend",
    description: "Awarded for reaching 1300 ELO.",
    unlockMethod: "achievement",
    achievementId: "elo-1300",
    color: "#facc15",
  },
];

export function getCosmetic(id: string | null | undefined): CosmeticDefinition | undefined {
  if (!id) return undefined;
  return COSMETICS.find((c) => c.id === id);
}

export function getCosmeticsByCategory(category: CosmeticCategory): CosmeticDefinition[] {
  return COSMETICS.filter((c) => c.category === category);
}

export function createDefaultProfile(name: string): PlayerProfile {
  const alwaysUnlocked = COSMETICS.filter((c) => !c.achievementId).map((c) => c.id);
  return {
    name,
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
    achievementProgress: {},
  };
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
  { threshold: 1300, tier: { name: "Legend", color: "#facc15" } },
  { threshold: 1100, tier: { name: "Veteran", color: "#93c5fd" } },
  { threshold: 900, tier: { name: "Contender", color: "#f5b942" } },
  { threshold: -Infinity, tier: { name: "Rookie", color: "#928c82" } },
];

export function getRankTier(elo: number): RankTier {
  return RANK_TIERS.find((t) => elo >= t.threshold)!.tier;
}

import type { AiDifficulty, PlayerProfile, VsComputerStats } from "./types";
import { shortenAddress } from "./wallet";

export type CosmeticCategory =
  | "skin"
  | "animation"
  | "title"
  | "banner"
  | "intro"
  | "taunt"
  | "arenaTheme"
  | "aura"
  | "vsEffect"
  | "soundPack"
  | "leaderboardFrame";

/** A cosmetic only purchasable within a date window. Already-owned copies
 * stay owned/equippable forever — this only gates *new* purchases (checked
 * both client-side for display and server-side in verify-purchase, which is
 * the actual security boundary). */
export interface CosmeticAvailability {
  startsAt: string;
  endsAt: string;
}

export interface CosmeticDefinition {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  unlockMethod: "achievement" | "purchase";
  achievementId?: string;
  /** Only set for "title" cosmetics — recolors the player's name. */
  color?: string;
  /** Purchase-only titles that are never obtainable via achievements — get a
   * distinct gilded treatment wherever titles render, so they read as "this
   * person paid" rather than "this person earned it". */
  exclusive?: boolean;
  /** Present only on seasonal/limited-time drops — see isCosmeticCurrentlyAvailable. */
  availability?: CosmeticAvailability;
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
export const DEFAULT_SOUND_PACK = "soundPack:default";

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

  // --- Custom taunt unlock (a capability, not a preset message — see
  // profile.customTaunt and profanity.ts) ---
  {
    id: "taunt:custom",
    category: "taunt",
    name: "Custom Taunt",
    description: "Unlocks a taunt slot for your own short message (set it on your profile page).",
    unlockMethod: "purchase",
  },

  // --- Arena themes (match-room background/environment, local to each
  // viewer — not synced with the opponent) ---
  {
    id: "arenaTheme:cyberGrid",
    category: "arenaTheme",
    name: "Cyber Grid",
    description: "A wireframe grid floor stretching into a neon horizon.",
    unlockMethod: "purchase",
  },
  {
    id: "arenaTheme:volcanicCore",
    category: "arenaTheme",
    name: "Volcanic Core",
    description: "Molten rock glows beneath a cracked obsidian floor.",
    unlockMethod: "purchase",
  },
  {
    id: "arenaTheme:deepSpace",
    category: "arenaTheme",
    name: "Deep Space",
    description: "A slow drift of stars and distant nebulae.",
    unlockMethod: "purchase",
  },
  {
    id: "arenaTheme:neonCity",
    category: "arenaTheme",
    name: "Neon City",
    description: "Rain-slicked rooftops under a skyline of flickering signs.",
    unlockMethod: "purchase",
  },
  {
    id: "arenaTheme:solsticeBloom",
    category: "arenaTheme",
    name: "Solstice Bloom",
    description: "Sunlit petals drift across a warm midsummer haze. A limited-time arena.",
    unlockMethod: "purchase",
    availability: { startsAt: "2026-07-01T00:00:00Z", endsAt: "2026-08-15T00:00:00Z" },
  },

  // --- Player auras (glow/particle effect around name+avatar, visible to
  // the opponent too — synced via Pusher presence like skins/titles) ---
  {
    id: "aura:pulsingRing",
    category: "aura",
    name: "Pulsing Ring",
    description: "A soft ring of light breathes in and out around you.",
    unlockMethod: "purchase",
  },
  {
    id: "aura:particleTrail",
    category: "aura",
    name: "Particle Trail",
    description: "A trail of drifting embers follows your every move.",
    unlockMethod: "purchase",
  },
  {
    id: "aura:lightningAura",
    category: "aura",
    name: "Lightning Aura",
    description: "Static arcs crackle around your name.",
    unlockMethod: "purchase",
  },
  {
    id: "aura:prismHalo",
    category: "aura",
    name: "Prism Halo",
    description: "A slow-rotating halo splits light into shifting color.",
    unlockMethod: "purchase",
  },
  {
    id: "aura:emberSwarm",
    category: "aura",
    name: "Ember Swarm",
    description: "A swarm of tiny embers orbits you, warm and restless. A limited-time aura.",
    unlockMethod: "purchase",
    availability: { startsAt: "2026-07-01T00:00:00Z", endsAt: "2026-08-15T00:00:00Z" },
  },

  // --- VS-screen effects (alternate "you vs opponent" clash animation,
  // played alongside the existing match intro — see VsScreenOverlay) ---
  {
    id: "vsEffect:energyClash",
    category: "vsEffect",
    name: "Energy Clash",
    description: "Two waves of energy collide in the center of the screen.",
    unlockMethod: "purchase",
  },
  {
    id: "vsEffect:lightningCollision",
    category: "vsEffect",
    name: "Lightning Collision",
    description: "Twin bolts of lightning meet in a blinding crack.",
    unlockMethod: "purchase",
  },
  {
    id: "vsEffect:explosiveImpact",
    category: "vsEffect",
    name: "Explosive Impact",
    description: "A concussive shockwave rings out as both names lock in.",
    unlockMethod: "purchase",
  },

  // --- Sound packs (see sound.ts — wired into the existing sound toggle) ---
  {
    id: DEFAULT_SOUND_PACK,
    category: "soundPack",
    name: "Classic Beeps",
    description: "The original simple beeps.",
    unlockMethod: "achievement",
  },
  {
    id: "soundPack:arcadeBlips",
    category: "soundPack",
    name: "Arcade Blips",
    description: "Punchy 8-bit blips and chiptune stingers.",
    unlockMethod: "purchase",
  },
  {
    id: "soundPack:retroSynth",
    category: "soundPack",
    name: "Retro Synth",
    description: "Warm analog synth swells and pads.",
    unlockMethod: "purchase",
  },

  // --- Leaderboard frames (animated border around a leaderboard row,
  // visible to everyone browsing the leaderboard) ---
  {
    id: "leaderboardFrame:neonCircuit",
    category: "leaderboardFrame",
    name: "Neon Circuit",
    description: "A pulsing circuit-board trace runs the border.",
    unlockMethod: "purchase",
  },
  {
    id: "leaderboardFrame:moltenBorder",
    category: "leaderboardFrame",
    name: "Molten Border",
    description: "A slow-crawling seam of molten light.",
    unlockMethod: "purchase",
  },
  {
    id: "leaderboardFrame:auroraRing",
    category: "leaderboardFrame",
    name: "Aurora Ring",
    description: "A shifting aurora ripple traces the edge.",
    unlockMethod: "purchase",
  },
  {
    id: "leaderboardFrame:goldenLaurel",
    category: "leaderboardFrame",
    name: "Golden Laurel",
    description: "An animated laurel wreath in polished gold. A limited-time frame.",
    unlockMethod: "purchase",
    availability: { startsAt: "2026-07-01T00:00:00Z", endsAt: "2026-08-15T00:00:00Z" },
  },

  // --- Exclusive rare titles (purchase-only, never earnable via
  // achievements — get a gilded treatment wherever titles render so they
  // read as "this person paid" rather than "this person earned it") ---
  {
    id: "title:patron",
    category: "title",
    name: "Patron",
    description: "A title that can't be earned — only bought.",
    unlockMethod: "purchase",
    exclusive: true,
    color: "#c9a4ff",
  },
  {
    id: "title:founder",
    category: "title",
    name: "Founder",
    description: "Marks an early supporter of the shop.",
    unlockMethod: "purchase",
    exclusive: true,
    color: "#ffb347",
  },
  {
    id: "title:whale",
    category: "title",
    name: "Whale",
    description: "Reserved for those who went all in.",
    unlockMethod: "purchase",
    exclusive: true,
    color: "#ffe9a8",
  },
];

export function getCosmetic(id: string | null | undefined): CosmeticDefinition | undefined {
  if (!id) return undefined;
  return COSMETICS.find((c) => c.id === id);
}

export function getCosmeticsByCategory(category: CosmeticCategory): CosmeticDefinition[] {
  return COSMETICS.filter((c) => c.category === category);
}

export type SeasonalStatus = "active" | "upcoming" | "expired";

/** `null` for a cosmetic with no `availability` window (i.e. not seasonal at
 * all) — only seasonal cosmetics have a status. */
export function getSeasonalStatus(cosmetic: CosmeticDefinition, now: Date = new Date()): SeasonalStatus | null {
  if (!cosmetic.availability) return null;
  const t = now.getTime();
  if (t < new Date(cosmetic.availability.startsAt).getTime()) return "upcoming";
  if (t > new Date(cosmetic.availability.endsAt).getTime()) return "expired";
  return "active";
}

/** Whether this cosmetic can be *newly* purchased right now. Non-seasonal
 * cosmetics are always available; already-owned seasonal cosmetics stay
 * owned/equippable forever regardless of this check (callers must check
 * ownership separately — this only gates new purchases). */
export function isCosmeticCurrentlyAvailable(cosmetic: CosmeticDefinition, now: Date = new Date()): boolean {
  const status = getSeasonalStatus(cosmetic, now);
  return status === null || status === "active";
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

/** Older saved profiles predate the shop-expansion cosmetic fields; back-fill
 * them in place (called once at load time, in store.ts's getOrCreatePlayer)
 * so every caller can rely on these always being present, same convention as
 * ensureVsComputerStats. soundPack:default is also granted here — it's a
 * free "achievement, no id" cosmetic new profiles get automatically via
 * createDefaultProfile, but an old profile's unlockedCosmetics predates it. */
export function backfillNewCosmeticDefaults(profile: PlayerProfile): void {
  profile.equippedArenaTheme ??= null;
  profile.equippedAura ??= null;
  profile.equippedVsEffect ??= null;
  profile.equippedSoundPack ??= DEFAULT_SOUND_PACK;
  profile.equippedLeaderboardFrame ??= null;
  profile.customTaunt ??= null;
  profile.shards ??= 0;
  if (!profile.unlockedCosmetics.includes(DEFAULT_SOUND_PACK)) {
    profile.unlockedCosmetics.push(DEFAULT_SOUND_PACK);
  }
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
    equippedArenaTheme: null,
    equippedAura: null,
    equippedVsEffect: null,
    equippedSoundPack: DEFAULT_SOUND_PACK,
    equippedLeaderboardFrame: null,
    customTaunt: null,
    shards: 0,
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

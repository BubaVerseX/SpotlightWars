export interface AvatarDefinition {
  id: string;
  name: string;
}

// Free for everyone — unlike cosmetics, nothing here is achievement- or
// purchase-gated, so there's no unlockedCosmetics check on equip.
export const AVATARS: AvatarDefinition[] = [
  { id: "avatar:hexCore", name: "Hex Core" },
  { id: "avatar:delta", name: "Delta" },
  { id: "avatar:prism", name: "Prism" },
  { id: "avatar:orbit", name: "Orbit" },
  { id: "avatar:circuit", name: "Circuit" },
  { id: "avatar:aegis", name: "Aegis" },
  { id: "avatar:spark", name: "Spark" },
  { id: "avatar:rock", name: "Rock" },
  { id: "avatar:paper", name: "Paper" },
  { id: "avatar:scissors", name: "Scissors" },
];

export function getAvatar(id: string | null | undefined): AvatarDefinition | undefined {
  if (!id) return undefined;
  return AVATARS.find((a) => a.id === id);
}

export function isValidAvatarId(id: string): boolean {
  return AVATARS.some((a) => a.id === id);
}

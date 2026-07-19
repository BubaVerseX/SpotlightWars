import type { PlayerProfile } from "./types";

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getProfileDisplayName(profile: Pick<PlayerProfile, "name" | "walletAddress" | "ensName">): string {
  if (!profile.walletAddress) return profile.name;
  return profile.ensName ?? shortenAddress(profile.walletAddress);
}

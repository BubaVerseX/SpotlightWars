import { getAvatar } from "@/lib/rps/avatars";
import { AvatarIcon } from "./AvatarIcon";
import { BlockieAvatar } from "./BlockieAvatar";

interface PlayerAvatarProps {
  /** Manually-picked avatar id (profile.equippedAvatar), or null/undefined
   * to fall back to a generated pattern. */
  equippedAvatar?: string | null;
  /** Preferred seed for the generated fallback — wallet address when one
   * exists, otherwise the display name. */
  walletAddress?: string | null;
  name: string;
  size?: number | string;
  className?: string;
}

/** Single entry point for rendering a player's avatar anywhere in the app —
 * resolves a manually-equipped icon vs. the deterministic generated
 * fallback so every call site (header, leaderboard, profile, match rooms)
 * stays in sync automatically. */
export function PlayerAvatar({ equippedAvatar, walletAddress, name, size = 32, className }: PlayerAvatarProps) {
  const picked = getAvatar(equippedAvatar);

  return (
    <span
      className={`rps-avatar-ring inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {picked ? <AvatarIcon id={picked.id} size="100%" /> : <BlockieAvatar seed={walletAddress ?? name} size="100%" />}
    </span>
  );
}

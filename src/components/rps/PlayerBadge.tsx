import { getCosmetic, getRankTier } from "@/lib/rps/cosmetics";
import { PlayerAvatar } from "./PlayerAvatar";

interface PlayerBadgeProps {
  name: string;
  elo?: number;
  equippedTitle?: string | null;
  equippedAvatar?: string | null;
  walletAddress?: string | null;
  align?: "left" | "center";
  variant?: "self" | "opponent";
}

export function PlayerBadge({
  name,
  elo,
  equippedTitle,
  equippedAvatar,
  walletAddress,
  align = "center",
  variant = "self",
}: PlayerBadgeProps) {
  const title = getCosmetic(equippedTitle);
  const tier = elo !== undefined ? getRankTier(elo) : undefined;
  const sideColor = variant === "self" ? "var(--neon-cyan)" : "var(--neon-magenta)";

  return (
    <div className={`flex flex-col gap-1 ${align === "center" ? "items-center" : "items-start"}`}>
      <div className="flex items-center gap-2">
        <PlayerAvatar equippedAvatar={equippedAvatar} walletAddress={walletAddress} name={name} size={28} />
        <span
          className="font-display text-lg font-bold"
          style={{
            color: title?.color ?? sideColor,
            textShadow: `0 0 10px ${title?.color ?? sideColor}88`,
          }}
        >
          {name}
        </span>
        {tier && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: tier.color, borderColor: `${tier.color}66`, borderWidth: 1 }}
          >
            {tier.name}
          </span>
        )}
      </div>
      {title && <span className="text-xs text-muted">&ldquo;{title.name}&rdquo;</span>}
      {elo !== undefined && <span className="text-xs text-muted">{elo} ELO</span>}
    </div>
  );
}

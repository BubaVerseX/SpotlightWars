import { getCosmetic, getRankTier } from "@/lib/rps/cosmetics";

interface PlayerBadgeProps {
  name: string;
  elo?: number;
  equippedTitle?: string | null;
  align?: "left" | "center";
}

export function PlayerBadge({ name, elo, equippedTitle, align = "center" }: PlayerBadgeProps) {
  const title = getCosmetic(equippedTitle);
  const tier = elo !== undefined ? getRankTier(elo) : undefined;

  return (
    <div className={`flex flex-col gap-1 ${align === "center" ? "items-center" : "items-start"}`}>
      <div className="flex items-center gap-2">
        <span className="font-display text-lg font-bold" style={{ color: title?.color }}>
          {name}
        </span>
        {tier && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: tier.color, borderColor: `${tier.color}55`, borderWidth: 1 }}
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

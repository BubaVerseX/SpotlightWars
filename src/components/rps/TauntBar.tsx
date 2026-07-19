import { getCosmetic } from "@/lib/rps/cosmetics";

interface TauntBarProps {
  tauntIds: string[];
  onSend: (tauntId: string) => void;
  disabled?: boolean;
}

/** Row of quick-reaction buttons — only shown between rounds (see
 * MatchRoom's phase gating), never during active move selection, and only
 * for taunts this player has actually unlocked. Purely cosmetic: sending one
 * has no gameplay effect. */
export function TauntBar({ tauntIds, onSend, disabled }: TauntBarProps) {
  if (tauntIds.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {tauntIds.map((id) => {
        const cosmetic = getCosmetic(id);
        if (!cosmetic) return null;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSend(id)}
            disabled={disabled}
            title={cosmetic.description}
            className="arcade-btn rounded-full px-3 py-1.5 font-display text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cosmetic.name}
          </button>
        );
      })}
    </div>
  );
}

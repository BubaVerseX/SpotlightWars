import { getCosmetic } from "@/lib/rps/cosmetics";

interface TauntBarProps {
  tauntIds: string[];
  onSend: (tauntId: string) => void;
  disabled?: boolean;
  /** This player's saved custom taunt text, if the "taunt:custom" unlock is
   * owned and set. When present, shown as its own button (label = the
   * actual message) instead of the generic "Custom Taunt" unlock name. */
  customTauntText?: string | null;
}

/** Row of quick-reaction buttons — only shown between rounds (see
 * MatchRoom's phase gating), never during active move selection, and only
 * for taunts this player has actually unlocked. Purely cosmetic: sending one
 * has no gameplay effect. */
export function TauntBar({ tauntIds, onSend, disabled, customTauntText }: TauntBarProps) {
  if (tauntIds.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {tauntIds.map((id) => {
        // The custom-taunt unlock only becomes a sendable button once the
        // player has actually set their message — an unlocked-but-empty
        // slot has nothing useful to send yet.
        if (id === "taunt:custom") {
          if (!customTauntText) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSend(id)}
              disabled={disabled}
              title="Your custom taunt"
              className="arcade-btn rounded-full px-3 py-1.5 font-display text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {customTauntText}
            </button>
          );
        }

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

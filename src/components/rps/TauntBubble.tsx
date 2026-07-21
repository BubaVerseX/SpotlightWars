import { getCosmetic } from "@/lib/rps/cosmetics";

interface TauntBubbleProps {
  tauntId: string;
  /** Which side sent it — purely cosmetic positioning (left/cyan for self,
   * right/magenta for opponent), matching the convention used throughout
   * the match room. Rendered as a fixed overlay so it never has to fight
   * for layout space inside whichever phase happens to be on screen. */
  align: "self" | "opponent";
  /** Present only for tauntId "taunt:custom" — the sender's actual message,
   * broadcast by the server (see /api/rps/taunt), shown instead of the
   * generic "Custom Taunt" unlock name. */
  customText?: string | null;
}

export function TauntBubble({ tauntId, align, customText }: TauntBubbleProps) {
  const cosmetic = getCosmetic(tauntId);
  if (!cosmetic) return null;
  const label = tauntId === "taunt:custom" && customText ? customText : cosmetic.name;

  return (
    <div
      className={`animate-taunt-pop pointer-events-none fixed top-24 z-40 rounded-full border px-4 py-2 font-display text-2xl ${
        align === "self" ? "left-6" : "right-6"
      }`}
      style={{
        borderColor: align === "self" ? "var(--neon-cyan)" : "var(--neon-magenta)",
        background: "var(--background-elevated)",
        boxShadow: `0 0 20px ${align === "self" ? "var(--neon-cyan-soft)" : "var(--neon-magenta-soft)"}`,
      }}
    >
      {label}
    </div>
  );
}

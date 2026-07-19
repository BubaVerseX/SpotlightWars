interface ResultBannerProps {
  outcome: "win" | "lose" | "draw";
}

export function ResultBanner({ outcome }: ResultBannerProps) {
  const heading = outcome === "win" ? "Round Won!" : outcome === "lose" ? "Round Lost" : "Draw";

  return (
    <p
      className="font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl"
      style={{
        color:
          outcome === "win"
            ? "var(--neon-cyan)"
            : outcome === "lose"
              ? "var(--neon-magenta)"
              : "var(--foreground)",
        textShadow:
          outcome === "win"
            ? "0 0 20px var(--neon-cyan), 0 0 44px var(--neon-cyan-soft)"
            : outcome === "lose"
              ? "0 0 10px var(--neon-magenta-soft)"
              : "0 0 16px rgba(234, 246, 255, 0.4)",
        opacity: outcome === "lose" ? 0.7 : 1,
      }}
    >
      {heading}
    </p>
  );
}

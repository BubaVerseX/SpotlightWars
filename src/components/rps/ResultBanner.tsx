interface ResultBannerProps {
  outcome: "win" | "lose" | "draw";
}

export function ResultBanner({ outcome }: ResultBannerProps) {
  const heading = outcome === "win" ? "Round Won!" : outcome === "lose" ? "Round Lost" : "Draw";

  return (
    <p
      className={`font-display text-3xl font-bold sm:text-4xl ${
        outcome === "win" ? "text-accent glow-text" : outcome === "lose" ? "text-muted" : "text-foreground"
      }`}
    >
      {heading}
    </p>
  );
}

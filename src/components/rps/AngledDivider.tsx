interface AngledDividerProps {
  color?: "cyan" | "magenta" | "gold";
  size?: "sm" | "md";
}

const COLOR_CLASS: Record<NonNullable<AngledDividerProps["color"]>, string> = {
  cyan: "",
  magenta: "rps-divider-magenta",
  gold: "rps-divider-gold",
};

export function AngledDivider({ color = "cyan", size = "md" }: AngledDividerProps) {
  return (
    <div
      className={`rps-divider ${COLOR_CLASS[color]} ${size === "sm" ? "rps-divider-sm" : ""}`}
      aria-hidden="true"
    />
  );
}

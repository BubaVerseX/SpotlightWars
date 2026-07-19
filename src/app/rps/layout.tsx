import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import "./rps-theme.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Rock Paper Scissors — SpotlightWars",
  description:
    "Live real-time Rock Paper Scissors matchmaking. Find a random opponent or challenge a friend.",
};

export default function RpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${orbitron.variable} rps-theme relative flex min-h-full flex-1 flex-col`}>
      <div className="rps-grid-bg" aria-hidden="true" />
      <div className="rps-scanlines" aria-hidden="true" />
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rock Paper Scissors — SpotlightWars",
  description:
    "Live real-time Rock Paper Scissors matchmaking. Find a random opponent or challenge a friend.",
};

export default function RpsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

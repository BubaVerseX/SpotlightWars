import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";
import "./rps-theme.css";
import { WalletProvider } from "@/components/providers/WalletProvider";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const title = "Rock Paper Scissors — SpotlightWars";
const description =
  "Live real-time Rock Paper Scissors matchmaking. Find a random opponent or challenge a friend, climb the ELO leaderboard, and unlock cosmetics.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${orbitron.variable} h-full`}>
      <body className="rps-theme relative flex min-h-full flex-1 flex-col antialiased">
        <div className="rps-grid-bg" aria-hidden="true" />
        <div className="rps-scanlines" aria-hidden="true" />
        <WalletProvider>
          <div className="relative z-10 flex flex-1 flex-col">{children}</div>
        </WalletProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./spotlight-theme.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const title = "SpotlightWars — Pay to Interrupt Everyone Here";
const description =
  "A live shared billboard. Watch how many people are online right now, then pay any amount in ETH, SOL, or BTC to take over every connected screen with your message for a few seconds.";

export const metadata: Metadata = {
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

export default function SpotlightLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${spaceGrotesk.variable} spotlight-theme flex min-h-full flex-1 flex-col`}>
      {children}
    </div>
  );
}

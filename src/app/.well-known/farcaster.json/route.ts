import { NextResponse } from "next/server";
import { MINIAPP_NAME, MINIAPP_SPLASH_BACKGROUND_COLOR, getSiteUrl } from "@/lib/miniapp/embed";

// The Farcaster Mini App manifest — the single source of truth both
// Farcaster and Base App read from at /.well-known/farcaster.json to
// discover, render embeds for, and launch this app as a mini app. Base App
// mini apps use this exact same manifest format (there is no separate Base
// manifest), so this one file covers both surfaces.
//
// accountAssociation verifies domain ownership through Warpcast's/Base
// Build's Account Association tool — the operator signed this with the
// Farcaster custody wallet for this domain.
export const dynamic = "force-static";

export async function GET() {
  const siteUrl = getSiteUrl();

  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjIyMTE0MTAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhmZEM2NDI0MkVGMjljRjk5RDc1ODJDODQxM0EyNTdENzczMjdBNzgxIn0",
      payload: "eyJkb21haW4iOiJzcG90bGlnaHQtd2Fycy52ZXJjZWwuYXBwIn0",
      signature: "g7rJHAfL5yS6thMxVOVDYRVziYxkwugQ3fs8ayPBaSlOS8bycWmbkSI8vHdTwZRKSUTPTVM9M8T6SPDBipSY8xw=",
    },
    miniapp: {
      version: "1",
      name: MINIAPP_NAME,
      homeUrl: siteUrl,
      iconUrl: `${siteUrl}/images/icon.png`,
      splashImageUrl: `${siteUrl}/images/splash.png`,
      splashBackgroundColor: MINIAPP_SPLASH_BACKGROUND_COLOR,
      subtitle: "Live ranked RPS matches",
      description:
        "Real-time Rock Paper Scissors with live matchmaking, an ELO leaderboard, wallet sign-in, and unlockable cosmetics. Find an opponent and climb the ranks.",
      primaryCategory: "games",
      tags: ["base", "farcaster", "miniapp", "game", "rps"],
      heroImageUrl: `${siteUrl}/images/hero.png`,
      tagline: "Rock Paper Scissors, ranked",
      ogTitle: MINIAPP_NAME,
      ogDescription: "Real-time ranked Rock Paper Scissors. Climb the leaderboard, unlock cosmetics, challenge friends.",
      ogImageUrl: `${siteUrl}/images/hero.png`,
    },
  };

  return NextResponse.json(manifest);
}

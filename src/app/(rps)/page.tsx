import type { Metadata } from "next";
import { getRpsStore } from "@/lib/rps/store";
import { toPublicProfile } from "@/lib/rps/name-claim";
import { RpsLanding } from "@/components/rps/RpsLanding";
import { buildMiniAppEmbedTags, getSiteUrl } from "@/lib/miniapp/embed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  other: buildMiniAppEmbedTags({
    imageUrl: `${getSiteUrl()}/images/embed.png`,
    buttonTitle: "Play Now",
    launchUrl: getSiteUrl(),
  }),
};

export default async function Home() {
  const store = getRpsStore();
  const leaderboard = (await store.topEloLeaderboard(10)).map(toPublicProfile);

  return <RpsLanding initialLeaderboard={leaderboard} />;
}

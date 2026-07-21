import { getRpsStore } from "@/lib/rps/store";
import { toPublicProfile } from "@/lib/rps/name-claim";
import { RpsLanding } from "@/components/rps/RpsLanding";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = getRpsStore();
  const leaderboard = (await store.topEloLeaderboard(10)).map(toPublicProfile);

  return <RpsLanding initialLeaderboard={leaderboard} />;
}

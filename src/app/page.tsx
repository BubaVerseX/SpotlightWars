import { getRpsStore } from "@/lib/rps/store";
import { RpsLanding } from "@/components/rps/RpsLanding";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = getRpsStore();
  const leaderboard = await store.topEloLeaderboard(10);

  return <RpsLanding initialLeaderboard={leaderboard} />;
}

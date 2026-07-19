import { getRpsStore } from "@/lib/rps/store";
import { RpsLanding } from "@/components/rps/RpsLanding";

export const dynamic = "force-dynamic";

export default async function RpsPage() {
  const store = getRpsStore();
  const leaderboard = await store.topLeaderboard(10);

  return <RpsLanding initialLeaderboard={leaderboard} />;
}

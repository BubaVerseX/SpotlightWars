import { getRpsStore } from "@/lib/rps/store";
import { LeaderboardList } from "@/components/rps/LeaderboardList";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const store = getRpsStore();
  const entries = await store.topLeaderboard(10);

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-foreground">Leaderboard</h1>
        <div className="w-full max-w-md">
          <LeaderboardList entries={entries} />
        </div>
      </main>
      <Footer />
    </>
  );
}

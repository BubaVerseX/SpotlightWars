import { getRpsStore } from "@/lib/rps/store";
import { toPublicProfile } from "@/lib/rps/name-claim";
import { LeaderboardList } from "@/components/rps/LeaderboardList";
import { AngledDivider } from "@/components/rps/AngledDivider";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const store = getRpsStore();
  const entries = (await store.topEloLeaderboard(10)).map(toPublicProfile);

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-6 py-16">
        <h1
          className="font-display text-3xl font-bold uppercase tracking-wide"
          style={{ color: "var(--neon-cyan)", textShadow: "0 0 20px var(--neon-cyan-soft)" }}
        >
          High Scores
        </h1>
        <AngledDivider color="gold" />
        <div className="w-full">
          <LeaderboardList entries={entries} variant="podium" />
        </div>
      </main>
      <Footer />
    </>
  );
}

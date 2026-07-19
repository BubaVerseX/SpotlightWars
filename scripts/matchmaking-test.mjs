import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv({ cache: "no-store" });
const BASE_URL = "http://localhost:3000";
const QUEUE_KEY = "rps:queue:waiting";

async function joinQueue(playerName) {
  const res = await fetch(`${BASE_URL}/api/rps/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: playerName }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function main() {
  console.log("Clearing any leftover queue key before the test...");
  await kv.del(QUEUE_KEY);
  console.log("Queue key before test:", await kv.get(QUEUE_KEY));

  console.log("\nPlayer A joins queue...");
  const resultA = await joinQueue("PlayerA");
  console.log("  ->", resultA);

  console.log("\nDirect Redis read immediately after A's request returns:");
  console.log("  raw value:", await kv.get(QUEUE_KEY));

  await new Promise((r) => setTimeout(r, 250));

  console.log("\nDirect Redis read 250ms later (right before B's request):");
  console.log("  raw value:", await kv.get(QUEUE_KEY));

  console.log("\nPlayer B joins queue...");
  const resultB = await joinQueue("PlayerB");
  console.log("  ->", resultB);

  console.log("\n--- Result ---");
  if (resultA.status !== 200 || resultB.status !== 200) {
    console.error("FAIL: one or both requests did not return 200.");
    process.exit(1);
  }
  if (!resultA.data?.matchId || !resultB.data?.matchId) {
    console.error("FAIL: one or both responses are missing a matchId.");
    process.exit(1);
  }
  if (resultA.data.matchId !== resultB.data.matchId) {
    console.error(
      `FAIL: players were NOT paired — A got ${resultA.data.matchId}, B got ${resultB.data.matchId}.`
    );
    process.exit(1);
  }

  console.log(`PASS: both players paired into the same match room: ${resultA.data.matchId}`);
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});

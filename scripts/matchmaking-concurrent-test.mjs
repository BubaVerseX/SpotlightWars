// Fires both players' requests genuinely concurrently (Promise.all, no
// stagger at all) to stress the atomic setNX/del race harder than the
// staggered test does.

const BASE_URL = "http://localhost:3000";

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
  const [resultA, resultB] = await Promise.all([joinQueue("PlayerA"), joinQueue("PlayerB")]);
  console.log("A:", resultA);
  console.log("B:", resultB);

  if (resultA.status !== 200 || resultB.status !== 200) {
    console.error("FAIL: non-200 status");
    process.exit(1);
  }
  if (resultA.data.matchId !== resultB.data.matchId) {
    console.error(`FAIL: different matchIds — ${resultA.data.matchId} vs ${resultB.data.matchId}`);
    process.exit(1);
  }
  console.log(`PASS: paired into ${resultA.data.matchId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

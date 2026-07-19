import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";
import { getRpsStore } from "@/lib/rps/store";
import { RPS_REMATCH_EVENT, rpsMatchChannel } from "@/lib/rps/constants";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const matchId = typeof body?.matchId === "string" ? body.matchId : "";

  if (!matchId) {
    return NextResponse.json({ error: "matchId is required." }, { status: 400 });
  }

  const store = getRpsStore();
  await store.clearMoves(matchId);
  await store.del(`rps:match:${matchId}:result-claimed`);

  let pusher;
  try {
    pusher = getPusherServer();
  } catch (err) {
    console.error("[RPS] Rematch broadcast failed:", err);
    return NextResponse.json({ error: "Pusher is not configured on the server." }, { status: 503 });
  }

  await pusher.trigger(rpsMatchChannel(matchId), RPS_REMATCH_EVENT, { timestamp: Date.now() });

  return NextResponse.json({ ok: true });
}

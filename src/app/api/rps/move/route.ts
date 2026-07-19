import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";
import { getRpsStore } from "@/lib/rps/store";
import { MAX_NAME_LENGTH, MOVES, RPS_REVEAL_EVENT, rpsMatchChannel } from "@/lib/rps/constants";
import type { Move } from "@/lib/rps/types";

function decideWinner(moveA: Move, moveB: Move): "A" | "B" | "draw" {
  if (moveA === moveB) return "draw";
  const beats: Record<Move, Move> = { rock: "scissors", paper: "rock", scissors: "paper" };
  return beats[moveA] === moveB ? "A" : "B";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const matchId = typeof body?.matchId === "string" ? body.matchId : "";
  const memberId = typeof body?.memberId === "string" ? body.memberId : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  const move = body?.move as Move;

  if (!matchId || !memberId || !name || !MOVES.includes(move)) {
    return NextResponse.json({ error: "Invalid move submission." }, { status: 400 });
  }

  const store = getRpsStore();
  await store.hsetMove(matchId, memberId, { name, move });

  const moves = await store.getMoves(matchId);
  const memberIds = Object.keys(moves);

  if (memberIds.length < 2) {
    return NextResponse.json({ ok: true });
  }

  // Guard against both submissions racing to see "2 moves in" at once —
  // only the request that wins this claim broadcasts the reveal.
  const claimed = await store.setNX(`rps:match:${matchId}:result-claimed`, "1", 30);
  if (!claimed) {
    return NextResponse.json({ ok: true });
  }

  const [aId, bId] = memberIds;
  const a = moves[aId];
  const b = moves[bId];
  const result = decideWinner(a.move, b.move);
  const winnerId = result === "draw" ? null : result === "A" ? aId : bId;
  const winnerName = result === "draw" ? null : result === "A" ? a.name : b.name;

  if (winnerName) {
    await store.incrLeaderboard(winnerName);
  }

  let pusher;
  try {
    pusher = getPusherServer();
  } catch (err) {
    console.error("[RPS] Reveal broadcast failed:", err);
    return NextResponse.json({ error: "Pusher is not configured on the server." }, { status: 503 });
  }

  await pusher.trigger(rpsMatchChannel(matchId), RPS_REVEAL_EVENT, {
    moves: { [aId]: a.move, [bId]: b.move },
    winnerId,
    timestamp: Date.now(),
  });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";
import { getRpsStore } from "@/lib/rps/store";
import {
  MAX_NAME_LENGTH,
  MOVES,
  ROUNDS_TO_WIN,
  RPS_REVEAL_EVENT,
  rpsMatchChannel,
} from "@/lib/rps/constants";
import { calculateEloChange, evaluateAchievements } from "@/lib/rps/cosmetics";
import { decideWinner } from "@/lib/rps/game";
import type { MatchStats, Move, RoundRevealPayload } from "@/lib/rps/types";

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
  const roundWinnerId = result === "draw" ? null : result === "A" ? aId : bId;

  let scoreByMemberId = await store.getMatchScore(matchId);
  if (roundWinnerId) {
    const newScore = await store.incrMatchScore(matchId, roundWinnerId);
    scoreByMemberId = { ...scoreByMemberId, [roundWinnerId]: newScore };
  }

  const matchWinnerId =
    Object.entries(scoreByMemberId).find(([, wins]) => wins >= ROUNDS_TO_WIN)?.[0] ?? null;

  let matchStats: Record<string, MatchStats> | undefined;

  if (matchWinnerId) {
    const matchLoserId = matchWinnerId === aId ? bId : aId;
    const winnerEntry = matchWinnerId === aId ? a : b;
    const loserEntry = matchWinnerId === aId ? b : a;

    const winnerProfile = await store.getOrCreatePlayer(winnerEntry.name);
    const loserProfile = await store.getOrCreatePlayer(loserEntry.name);

    const eloBeforeWinner = winnerProfile.elo;
    const eloBeforeLoser = loserProfile.elo;
    const { winnerDelta, loserDelta } = calculateEloChange(eloBeforeWinner, eloBeforeLoser);

    winnerProfile.elo += winnerDelta;
    winnerProfile.peakElo = Math.max(winnerProfile.peakElo, winnerProfile.elo);
    winnerProfile.wins += 1;
    winnerProfile.currentWinStreak += 1;
    winnerProfile.bestWinStreak = Math.max(winnerProfile.bestWinStreak, winnerProfile.currentWinStreak);

    loserProfile.elo += loserDelta;
    loserProfile.losses += 1;
    loserProfile.currentWinStreak = 0;

    const winnerUnlocks = evaluateAchievements(winnerProfile);
    const loserUnlocks = evaluateAchievements(loserProfile);

    await store.savePlayer(winnerProfile);
    await store.savePlayer(loserProfile);

    matchStats = {
      [matchWinnerId]: {
        name: winnerProfile.name,
        eloBefore: eloBeforeWinner,
        eloAfter: winnerProfile.elo,
        newUnlocks: winnerUnlocks,
      },
      [matchLoserId]: {
        name: loserProfile.name,
        eloBefore: eloBeforeLoser,
        eloAfter: loserProfile.elo,
        newUnlocks: loserUnlocks,
      },
    };
  }

  // Fresh moves + claim guard for the next round (or a future rematch) —
  // clear regardless of whether the match just ended.
  await store.clearMoves(matchId);
  await store.del(`rps:match:${matchId}:result-claimed`);

  let pusher;
  try {
    pusher = getPusherServer();
  } catch (err) {
    console.error("[RPS] Reveal broadcast failed:", err);
    return NextResponse.json({ error: "Pusher is not configured on the server." }, { status: 503 });
  }

  const payload: RoundRevealPayload = {
    moves: { [aId]: a.move, [bId]: b.move },
    roundWinnerId,
    scoreByMemberId,
    matchWinnerId,
    matchStats,
    timestamp: Date.now(),
  };

  await pusher.trigger(rpsMatchChannel(matchId), RPS_REVEAL_EVENT, payload);

  return NextResponse.json({ ok: true });
}

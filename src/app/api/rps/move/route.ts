import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";
import { getRpsStore, type RpsStore } from "@/lib/rps/store";
import {
  MAX_NAME_LENGTH,
  MOVES,
  ROUNDS_TO_WIN,
  RPS_REVEAL_EVENT,
  rpsMatchChannel,
} from "@/lib/rps/constants";
import { calculateEloChange, evaluateAchievements } from "@/lib/rps/cosmetics";
import { decideWinner } from "@/lib/rps/game";
import { resolveIdentity } from "@/lib/rps/session";
import { claimOrLoadNamedProfile } from "@/lib/rps/name-claim";
import { shortenAddress } from "@/lib/rps/wallet";
import type { MatchStats, MoveEntry, Move, PlayerProfile, RoundRevealPayload } from "@/lib/rps/types";

async function resolveEntryProfile(store: RpsStore, entry: MoveEntry): Promise<PlayerProfile | null> {
  if (entry.walletAddress) {
    return store.getOrCreatePlayer({ kind: "wallet", address: entry.walletAddress });
  }
  // Anonymous path: verify (not just trust) that this submission still owns
  // `displayName` before letting it touch that profile's ELO/stats. This
  // should only ever fail if someone bypasses the name-claim UI entirely
  // and hits this endpoint directly with a name they don't own.
  const result = await claimOrLoadNamedProfile(store, entry.displayName, entry.claimToken);
  return result.status === "ok" ? result.profile : null;
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

  // Resolved here, at the moment THIS player submits their own move, because
  // this is the only point where we have access to their own request/cookies
  // — a verified wallet session always wins over the client-supplied name,
  // never the other way around (see resolveIdentity).
  const identity = resolveIdentity(req, name);
  if (!identity) {
    return NextResponse.json({ error: "Invalid move submission." }, { status: 400 });
  }
  const displayName =
    identity.kind === "wallet" ? (identity.ensName ?? shortenAddress(identity.address)) : identity.name;
  const walletAddress = identity.kind === "wallet" ? identity.address : null;
  const claimToken =
    identity.kind === "wallet"
      ? null
      : typeof body?.claimToken === "string"
        ? body.claimToken
        : null;

  const store = getRpsStore();
  await store.hsetMove(matchId, memberId, { move, displayName, walletAddress, claimToken });

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

    const winnerProfile = await resolveEntryProfile(store, winnerEntry);
    const loserProfile = await resolveEntryProfile(store, loserEntry);

    // Either identity failing to verify means someone's name-claim doesn't
    // check out (most likely a stale/forged request bypassing the claim UI
    // entirely, since the front door already gates this). Skip touching
    // ELO/stats for BOTH players rather than crediting/debiting the wrong
    // account — the match itself still completes and broadcasts normally,
    // just without matchStats, which the client already treats as optional.
    if (winnerProfile && loserProfile) {
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

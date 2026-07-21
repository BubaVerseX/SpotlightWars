import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";
import { getRpsStore } from "@/lib/rps/store";
import { MAX_NAME_LENGTH, RPS_TAUNT_EVENT, rpsMatchChannel } from "@/lib/rps/constants";
import { getCosmetic } from "@/lib/rps/cosmetics";
import { resolveIdentity } from "@/lib/rps/session";

// Taunts are purely cosmetic (no gameplay effect, no stats touched), so this
// only needs to confirm the sender actually owns the taunt they're trying to
// show — not the full name-claim ceremony /api/rps/move uses to protect
// ELO. Relayed through our own server (rather than a Pusher client event)
// so it works with zero extra Pusher-dashboard configuration.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const matchId = typeof body?.matchId === "string" ? body.matchId : "";
  const memberId = typeof body?.memberId === "string" ? body.memberId : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  const tauntId = typeof body?.tauntId === "string" ? body.tauntId : "";

  if (!matchId || !memberId || !tauntId) {
    return NextResponse.json({ error: "Invalid taunt." }, { status: 400 });
  }

  const cosmetic = getCosmetic(tauntId);
  if (!cosmetic || cosmetic.category !== "taunt") {
    return NextResponse.json({ error: "Not a taunt." }, { status: 400 });
  }

  const identity = resolveIdentity(req, name);
  if (!identity) {
    return NextResponse.json({ error: "Invalid taunt." }, { status: 400 });
  }

  const store = getRpsStore();
  const profile = await store.getOrCreatePlayer(identity);
  if (!profile.unlockedCosmetics.includes(tauntId)) {
    return NextResponse.json({ error: "That taunt isn't unlocked." }, { status: 403 });
  }

  // Custom taunt text is never trusted from the request — it was already
  // filtered + length-capped when saved (see /api/rps/profile), so the
  // authoritative text always comes from the sender's own stored profile.
  let customText: string | undefined;
  if (tauntId === "taunt:custom") {
    if (!profile.customTaunt) {
      return NextResponse.json({ error: "You haven't set a custom taunt yet." }, { status: 400 });
    }
    customText = profile.customTaunt;
  }

  let pusher;
  try {
    pusher = getPusherServer();
  } catch {
    return NextResponse.json({ error: "Pusher is not configured on the server." }, { status: 503 });
  }

  await pusher.trigger(rpsMatchChannel(matchId), RPS_TAUNT_EVENT, { memberId, tauntId, customText });

  return NextResponse.json({ ok: true });
}

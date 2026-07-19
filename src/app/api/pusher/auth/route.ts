import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";

// Presence channels need every client to authenticate through a server-side
// endpoint that knows the Pusher secret. pusher-js POSTs socket_id and
// channel_name as a url-encoded body to this route.
export async function POST(req: NextRequest) {
  let pusher;
  try {
    pusher = getPusherServer();
  } catch (err) {
    console.error("[SpotlightWars] Pusher auth failed:", err);
    return NextResponse.json({ error: "Pusher is not configured on the server." }, { status: 503 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing socket_id or channel_name." }, { status: 400 });
  }

  const userId = randomUUID();
  const name = params.get("name")?.trim().slice(0, 24);

  const userInfo: Record<string, string | number> = { id: userId };
  if (name) userInfo.name = name;

  // RPS-specific extras (optional, ignored by anything that doesn't send them
  // — e.g. SpotlightWars' own presence channel — so this stays backward
  // compatible).
  const equippedSkin = params.get("equippedSkin");
  const equippedAnimation = params.get("equippedAnimation");
  const equippedTitle = params.get("equippedTitle");
  const elo = params.get("elo");
  if (equippedSkin) userInfo.equippedSkin = equippedSkin;
  if (equippedAnimation) userInfo.equippedAnimation = equippedAnimation;
  if (equippedTitle) userInfo.equippedTitle = equippedTitle;
  if (elo) userInfo.elo = Number(elo);

  const authResponse = pusher.authorizeChannel(socketId, channelName, {
    user_id: userId,
    user_info: userInfo,
  });

  return NextResponse.json(authResponse);
}

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";
import { MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH, SPOTLIGHT_CHANNEL, SPOTLIGHT_EVENT } from "@/lib/constants";
import type { SpotlightPayload } from "@/types/spotlight";

export async function POST(req: NextRequest) {
  let pusher;
  try {
    pusher = getPusherServer();
  } catch (err) {
    console.error("[SpotlightWars] Spotlight broadcast failed:", err);
    return NextResponse.json({ error: "Pusher is not configured on the server." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE_LENGTH) : "";

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";

  const spotlight: SpotlightPayload = {
    id: randomUUID(),
    name: name || "Anonymous",
    message,
    timestamp: Date.now(),
  };

  await pusher.trigger(SPOTLIGHT_CHANNEL, SPOTLIGHT_EVENT, spotlight);

  return NextResponse.json({ ok: true, spotlight });
}

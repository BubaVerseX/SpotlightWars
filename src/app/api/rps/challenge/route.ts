import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRpsStore } from "@/lib/rps/store";
import { MAX_NAME_LENGTH } from "@/lib/rps/constants";

const CHALLENGE_TTL_SECONDS = 60 * 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const matchId = randomUUID();
  const store = getRpsStore();

  await store.set(`rps:challenge:${matchId}:host`, name, CHALLENGE_TTL_SECONDS);
  // The host counts as slot 1; incr on a fresh key starts at 1.
  await store.incr(`rps:challenge:${matchId}:slots`, CHALLENGE_TTL_SECONDS);

  return NextResponse.json({ matchId });
}

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRpsStore } from "@/lib/rps/store";
import { MAX_NAME_LENGTH } from "@/lib/rps/constants";

const QUEUE_KEY = "rps:queue:waiting";
const QUEUE_TTL_SECONDS = 30;

interface WaitingEntry {
  matchId: string;
  name: string;
}

// Random matchmaking: the first caller claims the single "waiting" slot and
// gets sent back to their own fresh match room to wait. The next caller finds
// that slot occupied, consumes it, and is paired into the same match room.
// The atomic set-if-not-exists / delete-if-present pair keeps this correct
// even if two requests land at nearly the same instant.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const store = getRpsStore();

  for (let attempt = 0; attempt < 3; attempt++) {
    const existingRaw = await store.get(QUEUE_KEY);

    if (!existingRaw) {
      const matchId = randomUUID();
      const claimed = await store.setNX(
        QUEUE_KEY,
        JSON.stringify({ matchId, name } satisfies WaitingEntry),
        QUEUE_TTL_SECONDS
      );
      if (claimed) {
        return NextResponse.json({ matchId });
      }
      continue;
    }

    const removed = await store.del(QUEUE_KEY);
    if (!removed) {
      continue;
    }

    const existing = JSON.parse(existingRaw) as WaitingEntry;
    return NextResponse.json({ matchId: existing.matchId });
  }

  return NextResponse.json({ error: "Matchmaking is busy, try again." }, { status: 503 });
}

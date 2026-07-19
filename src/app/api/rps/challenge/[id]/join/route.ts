import { NextRequest, NextResponse } from "next/server";
import { getRpsStore } from "@/lib/rps/store";
import { MAX_NAME_LENGTH } from "@/lib/rps/constants";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const store = getRpsStore();
  const hostName = await store.get(`rps:challenge:${id}:host`);

  if (!hostName) {
    return NextResponse.json(
      { error: "This challenge link is invalid or has expired." },
      { status: 404 }
    );
  }

  // Redis INCR is atomic, so this is safe even if two people click the same
  // link at the same instant: only the request that observes 2 gets in.
  const slots = await store.incr(`rps:challenge:${id}:slots`);

  if (slots > 2) {
    return NextResponse.json({ error: "This challenge is full." }, { status: 409 });
  }

  return NextResponse.json({ ok: true, opponentName: hostName });
}

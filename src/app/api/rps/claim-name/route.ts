import { NextRequest, NextResponse } from "next/server";
import { getRpsStore } from "@/lib/rps/store";
import { MAX_NAME_LENGTH } from "@/lib/rps/constants";
import { claimOrLoadNamedProfile, toPublicProfile } from "@/lib/rps/name-claim";

// The authoritative claim/verify step behind the name-entry form. Re-checks
// against Redis fresh every time (never trust the advisory availability
// check the client may have run while the user was still typing).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  const claimToken = typeof body?.claimToken === "string" ? body.claimToken : null;

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!claimToken) {
    return NextResponse.json({ error: "Missing device claim token." }, { status: 400 });
  }

  const store = getRpsStore();
  const result = await claimOrLoadNamedProfile(store, name, claimToken);

  if (result.status === "taken") {
    return NextResponse.json(
      { error: "This name is already taken — try another one." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, profile: toPublicProfile(result.profile) });
}

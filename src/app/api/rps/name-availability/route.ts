import { NextRequest, NextResponse } from "next/server";
import { getRpsStore } from "@/lib/rps/store";
import { MAX_NAME_LENGTH } from "@/lib/rps/constants";
import { isNameAvailable } from "@/lib/rps/name-claim";

// Read-only, side-effect-free — safe to call on every keystroke of a live
// "checking..." indicator. The actual claim (which can create/mutate a
// profile) only ever happens via POST /api/rps/claim-name.
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim().slice(0, MAX_NAME_LENGTH) ?? "";
  const claimToken = req.nextUrl.searchParams.get("claimToken");

  if (!name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const store = getRpsStore();
  const available = await isNameAvailable(store, name, claimToken);
  return NextResponse.json({ available });
}

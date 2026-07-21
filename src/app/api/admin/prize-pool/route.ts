import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRpsStore } from "@/lib/rps/store";
import {
  computePercent,
  getPrizePoolState,
  incrementPrizePoolAmount,
  setPrizePoolAmount,
} from "@/lib/rps/prize-pool";

const SECRET_HEADER = "x-admin-secret";

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Not exposed anywhere in the public UI/API — the amount is set by the
// operator directly via curl, authenticated by a shared secret set as an
// env var. Intentionally not tied into the player-facing auth system
// (SIWE/name claims) since this has nothing to do with player identity.
export async function POST(req: NextRequest) {
  const configuredSecret = process.env.ADMIN_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: "Admin endpoint is not configured." }, { status: 503 });
  }

  const providedSecret = req.headers.get(SECRET_HEADER) ?? "";
  if (!providedSecret || !secretsMatch(providedSecret, configuredSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const amount = typeof body?.amount === "number" ? body.amount : undefined;
  const incrementBy = typeof body?.incrementBy === "number" ? body.incrementBy : undefined;

  const exactlyOneProvided = (amount !== undefined) !== (incrementBy !== undefined);
  const allFinite = (amount === undefined || Number.isFinite(amount)) && (incrementBy === undefined || Number.isFinite(incrementBy));

  if (!exactlyOneProvided || !allFinite) {
    return NextResponse.json(
      { error: "Provide exactly one of: amount (absolute, number) or incrementBy (delta, number)." },
      { status: 400 }
    );
  }

  const store = getRpsStore();
  const nextAmount =
    amount !== undefined
      ? await setPrizePoolAmount(store, amount)
      : await incrementPrizePoolAmount(store, incrementBy!);

  const { target } = await getPrizePoolState(store);
  return NextResponse.json({ amount: nextAmount, target, percent: computePercent(nextAmount, target) });
}

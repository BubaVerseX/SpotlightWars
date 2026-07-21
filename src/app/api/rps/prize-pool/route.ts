import { NextResponse } from "next/server";
import { getRpsStore } from "@/lib/rps/store";
import { computePercent, getPrizePoolState } from "@/lib/rps/prize-pool";

export const dynamic = "force-dynamic";

// Public and unauthenticated by design (it's just "how full is the bar"),
// but the raw amount/target never leave this function — only the derived
// percent, so there's nothing here to reverse-engineer the real dollar
// figure from.
export async function GET() {
  const store = getRpsStore();
  const { amount, target } = await getPrizePoolState(store);
  const percent = computePercent(amount, target);
  return NextResponse.json({ percent, full: percent >= 100 });
}

import { NextRequest, NextResponse } from "next/server";
import { getRpsStore } from "@/lib/rps/store";
import { MAX_NAME_LENGTH } from "@/lib/rps/constants";
import { AI_DIFFICULTIES } from "@/lib/rps/ai";
import { ensureVsComputerStats, evaluateAchievements } from "@/lib/rps/cosmetics";
import type { AiDifficulty } from "@/lib/rps/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  const difficulty = body?.difficulty as AiDifficulty;
  const outcome = body?.outcome;

  if (
    !name ||
    !AI_DIFFICULTIES.includes(difficulty) ||
    (outcome !== "win" && outcome !== "loss")
  ) {
    return NextResponse.json({ error: "Invalid vs-computer result." }, { status: 400 });
  }

  const store = getRpsStore();
  const profile = await store.getOrCreatePlayer(name);
  const stats = ensureVsComputerStats(profile);

  if (outcome === "win") {
    stats.wins[difficulty] += 1;
  } else {
    stats.losses[difficulty] += 1;
  }

  // ELO is intentionally untouched — vs-computer matches don't affect ranked
  // skill rating, only these separate practice-mode counters.
  const newUnlocks = evaluateAchievements(profile);
  await store.savePlayer(profile);

  return NextResponse.json({ profile, newUnlocks });
}

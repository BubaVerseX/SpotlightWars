import { NextRequest, NextResponse } from "next/server";
import { getRpsStore } from "@/lib/rps/store";
import { MAX_NAME_LENGTH } from "@/lib/rps/constants";
import { resolveIdentity } from "@/lib/rps/session";
import { claimOrLoadNamedProfile, toPublicProfile } from "@/lib/rps/name-claim";
import type { PlayerProfile } from "@/lib/rps/types";

const TAKEN_ERROR = "This name is already taken — try another one.";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim().slice(0, MAX_NAME_LENGTH) ?? "";
  const claimToken = req.nextUrl.searchParams.get("claimToken");
  const identity = resolveIdentity(req, name);
  if (!identity) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const store = getRpsStore();

  if (identity.kind === "wallet") {
    const profile = await store.getOrCreatePlayer(identity);
    return NextResponse.json({ profile: toPublicProfile(profile) });
  }

  const result = await claimOrLoadNamedProfile(store, identity.name, claimToken);
  if (result.status === "taken") {
    return NextResponse.json({ error: TAKEN_ERROR }, { status: 409 });
  }
  return NextResponse.json({ profile: toPublicProfile(result.profile) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  const claimToken = typeof body?.claimToken === "string" ? body.claimToken : null;
  const identity = resolveIdentity(req, name);
  if (!identity) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const store = getRpsStore();

  let profile: PlayerProfile;
  if (identity.kind === "wallet") {
    profile = await store.getOrCreatePlayer(identity);
  } else {
    const result = await claimOrLoadNamedProfile(store, identity.name, claimToken);
    if (result.status === "taken") {
      return NextResponse.json({ error: TAKEN_ERROR }, { status: 409 });
    }
    profile = result.profile;
  }

  const { equippedSkin, equippedAnimation, equippedTitle } = (body ?? {}) as {
    equippedSkin?: unknown;
    equippedAnimation?: unknown;
    equippedTitle?: unknown;
  };

  if (typeof equippedSkin === "string") {
    if (!profile.unlockedCosmetics.includes(equippedSkin)) {
      return NextResponse.json({ error: "That skin isn't unlocked yet." }, { status: 400 });
    }
    profile.equippedSkin = equippedSkin;
  }

  if (typeof equippedAnimation === "string") {
    if (!profile.unlockedCosmetics.includes(equippedAnimation)) {
      return NextResponse.json({ error: "That animation isn't unlocked yet." }, { status: 400 });
    }
    profile.equippedAnimation = equippedAnimation;
  }

  if (equippedTitle === null || typeof equippedTitle === "string") {
    if (equippedTitle !== null && !profile.unlockedCosmetics.includes(equippedTitle)) {
      return NextResponse.json({ error: "That title isn't unlocked yet." }, { status: 400 });
    }
    profile.equippedTitle = equippedTitle;
  }

  await store.savePlayer(profile);
  return NextResponse.json({ profile: toPublicProfile(profile) });
}

import { NextRequest, NextResponse } from "next/server";
import { getRpsStore } from "@/lib/rps/store";
import { MAX_CUSTOM_TAUNT_LENGTH, MAX_NAME_LENGTH } from "@/lib/rps/constants";
import { resolveIdentity } from "@/lib/rps/session";
import { claimOrLoadNamedProfile, toPublicProfile } from "@/lib/rps/name-claim";
import { isValidAvatarId } from "@/lib/rps/avatars";
import { containsProfanity } from "@/lib/rps/profanity";
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

  const {
    equippedSkin,
    equippedAnimation,
    equippedTitle,
    equippedBanner,
    equippedIntro,
    equippedAvatar,
    equippedArenaTheme,
    equippedAura,
    equippedVsEffect,
    equippedSoundPack,
    equippedLeaderboardFrame,
    customTaunt,
  } = (body ?? {}) as {
    equippedSkin?: unknown;
    equippedAnimation?: unknown;
    equippedTitle?: unknown;
    equippedBanner?: unknown;
    equippedIntro?: unknown;
    equippedAvatar?: unknown;
    equippedArenaTheme?: unknown;
    equippedAura?: unknown;
    equippedVsEffect?: unknown;
    equippedSoundPack?: unknown;
    equippedLeaderboardFrame?: unknown;
    customTaunt?: unknown;
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

  if (equippedBanner === null || typeof equippedBanner === "string") {
    if (equippedBanner !== null && !profile.unlockedCosmetics.includes(equippedBanner)) {
      return NextResponse.json({ error: "That banner isn't unlocked yet." }, { status: 400 });
    }
    profile.equippedBanner = equippedBanner;
  }

  if (equippedIntro === null || typeof equippedIntro === "string") {
    if (equippedIntro !== null && !profile.unlockedCosmetics.includes(equippedIntro)) {
      return NextResponse.json({ error: "That intro isn't unlocked yet." }, { status: 400 });
    }
    profile.equippedIntro = equippedIntro;
  }

  // Unlike the other equipped* fields above, avatars aren't gated by
  // unlockedCosmetics — every AVATARS id is free for anyone to pick.
  if (equippedAvatar === null || typeof equippedAvatar === "string") {
    if (equippedAvatar !== null && !isValidAvatarId(equippedAvatar)) {
      return NextResponse.json({ error: "That avatar doesn't exist." }, { status: 400 });
    }
    profile.equippedAvatar = equippedAvatar;
  }

  if (equippedArenaTheme === null || typeof equippedArenaTheme === "string") {
    if (equippedArenaTheme !== null && !profile.unlockedCosmetics.includes(equippedArenaTheme)) {
      return NextResponse.json({ error: "That arena theme isn't unlocked yet." }, { status: 400 });
    }
    profile.equippedArenaTheme = equippedArenaTheme;
  }

  if (equippedAura === null || typeof equippedAura === "string") {
    if (equippedAura !== null && !profile.unlockedCosmetics.includes(equippedAura)) {
      return NextResponse.json({ error: "That aura isn't unlocked yet." }, { status: 400 });
    }
    profile.equippedAura = equippedAura;
  }

  if (equippedVsEffect === null || typeof equippedVsEffect === "string") {
    if (equippedVsEffect !== null && !profile.unlockedCosmetics.includes(equippedVsEffect)) {
      return NextResponse.json({ error: "That VS-screen effect isn't unlocked yet." }, { status: 400 });
    }
    profile.equippedVsEffect = equippedVsEffect;
  }

  if (typeof equippedSoundPack === "string") {
    if (!profile.unlockedCosmetics.includes(equippedSoundPack)) {
      return NextResponse.json({ error: "That sound pack isn't unlocked yet." }, { status: 400 });
    }
    profile.equippedSoundPack = equippedSoundPack;
  }

  if (equippedLeaderboardFrame === null || typeof equippedLeaderboardFrame === "string") {
    if (equippedLeaderboardFrame !== null && !profile.unlockedCosmetics.includes(equippedLeaderboardFrame)) {
      return NextResponse.json({ error: "That leaderboard frame isn't unlocked yet." }, { status: 400 });
    }
    profile.equippedLeaderboardFrame = equippedLeaderboardFrame;
  }

  if (customTaunt === null || typeof customTaunt === "string") {
    if (customTaunt !== null) {
      if (!profile.unlockedCosmetics.includes("taunt:custom")) {
        return NextResponse.json({ error: "Custom taunts aren't unlocked yet." }, { status: 400 });
      }
      const trimmed = customTaunt.trim();
      if (trimmed.length === 0) {
        profile.customTaunt = null;
      } else {
        if (trimmed.length > MAX_CUSTOM_TAUNT_LENGTH) {
          return NextResponse.json(
            { error: `Custom taunts must be ${MAX_CUSTOM_TAUNT_LENGTH} characters or fewer.` },
            { status: 400 }
          );
        }
        if (containsProfanity(trimmed)) {
          return NextResponse.json({ error: "That taunt isn't allowed." }, { status: 400 });
        }
        profile.customTaunt = trimmed;
      }
    } else {
      profile.customTaunt = null;
    }
  }

  await store.savePlayer(profile);
  return NextResponse.json({ profile: toPublicProfile(profile) });
}

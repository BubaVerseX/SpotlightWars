import type { RpsStore } from "./store";
import type { PlayerProfile, PublicPlayerProfile } from "./types";

export type NameClaimResult = { status: "ok"; profile: PlayerProfile } | { status: "taken" };

// Bounds how long a claim attempt can hold the lock before self-expiring —
// generous for the single read+write it guards, and short enough that a
// crashed request can't permanently wedge a name. Reuses the exact same
// setNX primitive (and therefore the same @upstash/redis client with
// cache: "no-store") the matchmaking queue uses for its own atomic pairing,
// so this claim logic can't suffer the stale-read bug that broke matchmaking.
const NAME_CLAIM_LOCK_TTL_SECONDS = 30;

function claimLockKey(name: string): string {
  return `rps:name-claim-lock:${name}`;
}

/** Never send a profile to a client without stripping this — claimToken is
 * a bearer secret; leaking it (e.g. via the leaderboard) would let anyone
 * impersonate whoever it belongs to. */
export function toPublicProfile(profile: PlayerProfile): PublicPlayerProfile {
  const publicProfile: Partial<PlayerProfile> = { ...profile };
  delete publicProfile.claimToken;
  return publicProfile as PublicPlayerProfile;
}

/**
 * Loads the named profile, verifying (and where appropriate, establishing)
 * device ownership:
 * - Brand new name, or an existing profile from before this field existed
 *   (claimToken still null) → claimed now for `claimToken`, keeping any
 *   existing stats intact. This is the migration path: the first device to
 *   touch an old unclaimed name simply becomes its owner going forward.
 * - Already claimed and `claimToken` matches → returns it normally.
 * - Already claimed by a different token → "taken", so the caller can
 *   refuse to let this request silently inherit someone else's profile.
 *
 * The unclaimed → claimed transition is race-protected with a short-lived
 * lock key, so two devices racing to claim the same brand-new name can't
 * both "win" and silently overwrite each other's claim.
 */
export async function claimOrLoadNamedProfile(
  store: RpsStore,
  name: string,
  claimToken: string | null
): Promise<NameClaimResult> {
  const profile = await store.getOrCreatePlayer({ kind: "name", name });

  if (profile.claimToken) {
    return profile.claimToken === claimToken ? { status: "ok", profile } : { status: "taken" };
  }

  // Unclaimed. Nothing to race over if this caller has no token of their
  // own to stake a claim with — just hand back the profile as-is.
  if (!claimToken) {
    return { status: "ok", profile };
  }

  const wonLock = await store.setNX(claimLockKey(name), claimToken, NAME_CLAIM_LOCK_TTL_SECONDS);
  if (!wonLock) {
    // Someone else is claiming this exact name concurrently. Re-read once —
    // if that was actually us (e.g. a retried request), we still succeed.
    const refreshed = await store.getOrCreatePlayer({ kind: "name", name });
    if (refreshed.claimToken === claimToken) return { status: "ok", profile: refreshed };
    return { status: "taken" };
  }

  profile.claimToken = claimToken;
  await store.savePlayer(profile);
  return { status: "ok", profile };
}

/** Read-only "would claimOrLoadNamedProfile let this device in" check, with
 * no side effects — safe to call on every keystroke of a live availability
 * indicator, unlike claimOrLoadNamedProfile itself (which creates/claims). */
export async function isNameAvailable(
  store: RpsStore,
  name: string,
  claimToken: string | null
): Promise<boolean> {
  const profile = await store.peekNamedProfile(name);
  if (!profile) return true;
  if (!profile.claimToken) return true;
  return profile.claimToken === claimToken;
}

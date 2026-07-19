import { kv } from "@vercel/kv";
import { createDefaultProfile, createDefaultWalletProfile } from "./cosmetics";
import type { MoveEntry, PlayerIdentity, PlayerProfile } from "./types";

function movesKey(matchId: string): string {
  return `rps:match:${matchId}:moves`;
}

function scoreKey(matchId: string): string {
  return `rps:match:${matchId}:score`;
}

/** The canonical storage key for an identity. Wallet and name-based players
 * live in entirely separate key namespaces (see PlayerIdentity) — this is
 * the single place that decides which. */
function keyForIdentity(identity: PlayerIdentity): string {
  return identity.kind === "wallet"
    ? `rps:player:wallet:${identity.address.toLowerCase()}`
    : `rps:player:${identity.name}`;
}

/** Same derivation, but from an already-loaded profile rather than a fresh
 * identity — used when saving, since a profile's wallet-ness is exactly its
 * `walletAddress` field. */
function keyForProfile(profile: PlayerProfile): string {
  return profile.walletAddress ? `rps:player:wallet:${profile.walletAddress}` : `rps:player:${profile.name}`;
}

function createProfileForIdentity(identity: PlayerIdentity): PlayerProfile {
  return identity.kind === "wallet"
    ? createDefaultWalletProfile(identity.address, identity.ensName ?? null)
    : createDefaultProfile(identity.name);
}

const ELO_LEADERBOARD_KEY = "rps:leaderboard:elo";
const MATCH_STATE_TTL_SECONDS = 600;

export interface RpsStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  del(key: string): Promise<boolean>;
  incr(key: string, ttlSeconds?: number): Promise<number>;

  hsetMove(matchId: string, memberId: string, entry: MoveEntry): Promise<void>;
  getMoves(matchId: string): Promise<Record<string, MoveEntry>>;
  clearMoves(matchId: string): Promise<void>;

  incrMatchScore(matchId: string, memberId: string): Promise<number>;
  getMatchScore(matchId: string): Promise<Record<string, number>>;
  clearMatchScore(matchId: string): Promise<void>;

  getOrCreatePlayer(identity: PlayerIdentity): Promise<PlayerProfile>;
  savePlayer(profile: PlayerProfile): Promise<void>;
  topEloLeaderboard(count: number): Promise<PlayerProfile[]>;
}

interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

/**
 * In-process fallback so `npm run dev` (and the build) works before real
 * Vercel KV / Upstash credentials exist. No cross-instance persistence —
 * fine for local dev, not for production.
 */
class MemoryRpsStore implements RpsStore {
  private values = new Map<string, MemoryEntry>();
  private moves = new Map<string, Record<string, MoveEntry>>();
  private matchScores = new Map<string, Record<string, number>>();
  private players = new Map<string, PlayerProfile>();

  private alive(key: string): MemoryEntry | null {
    const entry = this.values.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.values.delete(key);
      return null;
    }
    return entry;
  }

  async get(key: string) {
    return this.alive(key)?.value ?? null;
  }

  async set(key: string, value: string, ttlSeconds: number) {
    this.values.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async setNX(key: string, value: string, ttlSeconds: number) {
    if (this.alive(key)) return false;
    this.values.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return true;
  }

  async del(key: string) {
    const had = this.alive(key) !== null;
    this.values.delete(key);
    return had;
  }

  async incr(key: string, ttlSeconds?: number) {
    const entry = this.alive(key);
    const next = (entry ? parseInt(entry.value, 10) : 0) + 1;
    this.values.set(key, {
      value: String(next),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : (entry?.expiresAt ?? null),
    });
    return next;
  }

  async hsetMove(matchId: string, memberId: string, entry: MoveEntry) {
    const key = movesKey(matchId);
    const current = this.moves.get(key) ?? {};
    current[memberId] = entry;
    this.moves.set(key, current);
  }

  async getMoves(matchId: string) {
    return { ...(this.moves.get(movesKey(matchId)) ?? {}) };
  }

  async clearMoves(matchId: string) {
    this.moves.delete(movesKey(matchId));
  }

  async incrMatchScore(matchId: string, memberId: string) {
    const key = scoreKey(matchId);
    const current = this.matchScores.get(key) ?? {};
    current[memberId] = (current[memberId] ?? 0) + 1;
    this.matchScores.set(key, current);
    return current[memberId];
  }

  async getMatchScore(matchId: string) {
    return { ...(this.matchScores.get(scoreKey(matchId)) ?? {}) };
  }

  async clearMatchScore(matchId: string) {
    this.matchScores.delete(scoreKey(matchId));
  }

  async getOrCreatePlayer(identity: PlayerIdentity) {
    const key = keyForIdentity(identity);
    const existing = this.players.get(key);
    if (existing) return structuredClone(existing);
    const fresh = createProfileForIdentity(identity);
    this.players.set(key, structuredClone(fresh));
    return structuredClone(fresh);
  }

  async savePlayer(profile: PlayerProfile) {
    this.players.set(keyForProfile(profile), structuredClone(profile));
  }

  async topEloLeaderboard(count: number) {
    return [...this.players.values()]
      .sort((a, b) => b.elo - a.elo)
      .slice(0, count)
      .map((p) => structuredClone(p));
  }
}

/** Real persistence, backed by @vercel/kv (an Upstash Redis REST client). */
class KvRpsStore implements RpsStore {
  async get(key: string) {
    const value = await kv.get<string>(key);
    return value ?? null;
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await kv.set(key, value, { ex: ttlSeconds });
  }

  async setNX(key: string, value: string, ttlSeconds: number) {
    const result = await kv.set(key, value, { nx: true, ex: ttlSeconds });
    return result === "OK";
  }

  async del(key: string) {
    const count = await kv.del(key);
    return count > 0;
  }

  async incr(key: string, ttlSeconds?: number) {
    const next = await kv.incr(key);
    if (ttlSeconds && next === 1) {
      await kv.expire(key, ttlSeconds);
    }
    return next;
  }

  async hsetMove(matchId: string, memberId: string, entry: MoveEntry) {
    const key = movesKey(matchId);
    await kv.hset(key, { [memberId]: entry });
    await kv.expire(key, 120);
  }

  async getMoves(matchId: string) {
    const raw = await kv.hgetall<Record<string, MoveEntry>>(movesKey(matchId));
    return raw ?? {};
  }

  async clearMoves(matchId: string) {
    await kv.del(movesKey(matchId));
  }

  async incrMatchScore(matchId: string, memberId: string) {
    const key = scoreKey(matchId);
    const next = await kv.hincrby(key, memberId, 1);
    await kv.expire(key, MATCH_STATE_TTL_SECONDS);
    return next;
  }

  async getMatchScore(matchId: string) {
    const raw = await kv.hgetall<Record<string, number>>(scoreKey(matchId));
    return raw ?? {};
  }

  async clearMatchScore(matchId: string) {
    await kv.del(scoreKey(matchId));
  }

  async getOrCreatePlayer(identity: PlayerIdentity) {
    const key = keyForIdentity(identity);
    const existing = await kv.get<PlayerProfile>(key);
    if (existing) return existing;
    const fresh = createProfileForIdentity(identity);
    await this.savePlayer(fresh);
    return fresh;
  }

  async savePlayer(profile: PlayerProfile) {
    const key = keyForProfile(profile);
    await kv.set(key, profile);
    // The sorted-set member is the full storage key (not the display name,
    // which is mutable/ENS-derived for wallet players) so leaderboard reads
    // can fetch the profile directly without re-deriving it from a name.
    await kv.zadd(ELO_LEADERBOARD_KEY, { score: profile.elo, member: key });
  }

  async topEloLeaderboard(count: number) {
    const members = await kv.zrange<string[]>(ELO_LEADERBOARD_KEY, 0, count - 1, { rev: true });
    const profiles = await Promise.all(
      members.map(async (member) => {
        const direct = await kv.get<PlayerProfile>(member);
        if (direct) return direct;

        // Back-compat: entries written before the wallet-identity storage
        // rework used the bare display name as the sorted-set member
        // instead of the full storage key. Re-derive the real key, and if
        // it resolves, heal the sorted set so future reads take the fast
        // path above.
        const legacyKey = `rps:player:${member}`;
        const legacy = await kv.get<PlayerProfile>(legacyKey);
        if (legacy) {
          await kv.zadd(ELO_LEADERBOARD_KEY, { score: legacy.elo, member: legacyKey });
          await kv.zrem(ELO_LEADERBOARD_KEY, member);
        }
        return legacy;
      })
    );
    return profiles.filter((p): p is PlayerProfile => p !== null);
  }
}

// Cached on `globalThis` rather than a plain module-level variable: Next.js
// dev-server "on-demand entries" can unload and recompile an individual API
// route after a period of inactivity, which would otherwise hand the route a
// brand-new module instance (and a fresh, empty in-memory store) on its next
// hit — even though other routes' instances are still "warm". globalThis
// survives that recompilation, so the in-memory fallback stays consistent
// across every route for the lifetime of the dev server process. Real KV
// doesn't need this — it's an actually-external store — but it's a cheap,
// standard guard to add regardless (same idea as caching a Prisma client).
declare global {
  var __rpsStore: RpsStore | undefined;
  var __rpsStoreWarned: boolean | undefined;
}

export function getRpsStore(): RpsStore {
  if (globalThis.__rpsStore) return globalThis.__rpsStore;

  const hasKv = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

  if (!hasKv && !globalThis.__rpsStoreWarned) {
    console.warn(
      "[RPS] KV_REST_API_URL / KV_REST_API_TOKEN are not set. Falling back to an in-memory " +
        "store — matches, ELO, and cosmetics still work, but nothing persists across restarts " +
        "or across serverless instances. See .env.local.example."
    );
    globalThis.__rpsStoreWarned = true;
  }

  globalThis.__rpsStore = hasKv ? new KvRpsStore() : new MemoryRpsStore();
  return globalThis.__rpsStore;
}

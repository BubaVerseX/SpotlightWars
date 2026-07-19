import { kv } from "@vercel/kv";
import type { LeaderboardEntry, MoveEntry } from "./types";

const LEADERBOARD_KEY = "rps:leaderboard";

function movesKey(matchId: string): string {
  return `rps:match:${matchId}:moves`;
}

export interface RpsStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  del(key: string): Promise<boolean>;
  incr(key: string, ttlSeconds?: number): Promise<number>;
  hsetMove(matchId: string, memberId: string, entry: MoveEntry): Promise<void>;
  getMoves(matchId: string): Promise<Record<string, MoveEntry>>;
  clearMoves(matchId: string): Promise<void>;
  incrLeaderboard(name: string): Promise<void>;
  topLeaderboard(count: number): Promise<LeaderboardEntry[]>;
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
  private leaderboard = new Map<string, number>();

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

  async incrLeaderboard(name: string) {
    this.leaderboard.set(name, (this.leaderboard.get(name) ?? 0) + 1);
  }

  async topLeaderboard(count: number) {
    return [...this.leaderboard.entries()]
      .map(([name, wins]) => ({ name, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, count);
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

  async incrLeaderboard(name: string) {
    await kv.zincrby(LEADERBOARD_KEY, 1, name);
  }

  async topLeaderboard(count: number) {
    const raw = await kv.zrange<(string | number)[]>(LEADERBOARD_KEY, 0, count - 1, {
      rev: true,
      withScores: true,
    });
    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      entries.push({ name: String(raw[i]), wins: Number(raw[i + 1]) });
    }
    return entries;
  }
}

let instance: RpsStore | null = null;
let warned = false;

export function getRpsStore(): RpsStore {
  if (instance) return instance;

  const hasKv = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

  if (!hasKv && !warned) {
    console.warn(
      "[RPS] KV_REST_API_URL / KV_REST_API_TOKEN are not set. Falling back to an in-memory " +
        "store — matchmaking and moves still work, but the leaderboard will not persist across " +
        "restarts or across serverless instances. See .env.local.example."
    );
    warned = true;
  }

  instance = hasKv ? new KvRpsStore() : new MemoryRpsStore();
  return instance;
}

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { MAX_NAME_LENGTH } from "./constants";
import type { PlayerIdentity } from "./types";

export const SESSION_COOKIE_NAME = "rps_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  address: string;
  ensName: string | null;
  exp: number;
}

// Cached on globalThis for the same reason as the in-memory RPS store (see
// store.ts): Next's dev-server can recompile an individual route module
// independently, and a plain module-level variable would silently reset the
// secret (invalidating every session) when that happens.
declare global {
  var __rpsSessionSecret: string | undefined;
  var __rpsSessionSecretWarned: boolean | undefined;
}

function getSecret(): string {
  const fromEnv = process.env.RPS_SESSION_SECRET;
  if (fromEnv) return fromEnv;

  if (!globalThis.__rpsSessionSecretWarned) {
    console.warn(
      "[RPS] RPS_SESSION_SECRET is not set — using an ephemeral per-process secret. " +
        "Wallet sessions won't survive a server restart. Set RPS_SESSION_SECRET in " +
        ".env.local (any long random string) for a real deployment."
    );
    globalThis.__rpsSessionSecretWarned = true;
  }
  if (!globalThis.__rpsSessionSecret) {
    globalThis.__rpsSessionSecret = randomBytes(32).toString("hex");
  }
  return globalThis.__rpsSessionSecret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

/** Builds the signed cookie value for a verified wallet session. Never call
 * this except right after a successful SIWE `verify()`. */
export function createSessionCookieValue(address: string, ensName: string | null): string {
  const payload: SessionPayload = {
    address: address.toLowerCase(),
    ensName,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${json}.${sign(json)}`;
}

function verifySessionCookieValue(value: string): { address: string; ensName: string | null } | null {
  const [json, sig] = value.split(".");
  if (!json || !sig) return null;

  const expected = sign(json);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(json, "base64url").toString()) as SessionPayload;
    if (typeof payload.address !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { address: payload.address, ensName: payload.ensName ?? null };
  } catch {
    return null;
  }
}

/** Reads and verifies the session cookie directly off the request — the
 * only legitimate source of a "wallet" identity. */
export function getWalletSession(req: NextRequest): { address: string; ensName: string | null } | null {
  const raw = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifySessionCookieValue(raw);
}

/**
 * Resolves the identity for the current request: a verified wallet session
 * always wins over whatever `fallbackName` the client sent, since the
 * session is cryptographically attested and the name is not. Falls back to
 * plain name-based (anonymous) identity when there's no session — this is
 * the same trust-the-client model the app already used before wallets
 * existed, unchanged for anonymous play.
 */
export function resolveIdentity(req: NextRequest, fallbackName: string): PlayerIdentity | null {
  const session = getWalletSession(req);
  if (session) return { kind: "wallet", address: session.address, ensName: session.ensName };

  const trimmed = fallbackName.trim().slice(0, MAX_NAME_LENGTH);
  return trimmed ? { kind: "name", name: trimmed } : null;
}

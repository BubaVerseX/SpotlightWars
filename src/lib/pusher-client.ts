"use client";

import PusherClient from "pusher-js";

let instance: PusherClient | null = null;
let warned = false;

/**
 * Lazily creates the singleton browser Pusher client. Returns null (instead
 * of throwing) when NEXT_PUBLIC_* env vars are missing so the rest of the UI
 * can degrade gracefully in dev before real credentials are added.
 */
export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    if (!warned) {
      console.error(
        "[SpotlightWars] Missing NEXT_PUBLIC_PUSHER_KEY / NEXT_PUBLIC_PUSHER_CLUSTER. " +
          "Realtime features are disabled. Copy .env.local.example to .env.local, fill in your " +
          "Pusher credentials, and restart the dev server."
      );
      warned = true;
    }
    return null;
  }

  if (!instance) {
    instance = new PusherClient(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });
  }

  return instance;
}

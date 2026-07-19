"use client";

import PusherClient from "pusher-js";

let instance: PusherClient | null = null;
let currentName = "";
let warned = false;

/**
 * The presence-channel authorizer reads this at authorize-time, so it always
 * embeds the player's current display name into their Pusher user_info
 * without needing to recreate the underlying connection.
 */
export function setRpsPlayerName(name: string): void {
  currentName = name;
}

export function getRpsPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    if (!warned) {
      console.error(
        "[RPS] Missing NEXT_PUBLIC_PUSHER_KEY / NEXT_PUBLIC_PUSHER_CLUSTER. Multiplayer is " +
          "disabled. Copy .env.local.example to .env.local, fill in your Pusher credentials, and " +
          "restart the dev server."
      );
      warned = true;
    }
    return null;
  }

  if (!instance) {
    instance = new PusherClient(key, {
      cluster,
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          fetch("/api/pusher/auth", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              socket_id: socketId,
              channel_name: channel.name,
              name: currentName,
            }).toString(),
          })
            .then((res) => {
              if (!res.ok) throw new Error(`Auth request failed with ${res.status}`);
              return res.json();
            })
            .then((data) => callback(null, data))
            .catch((err) => callback(err instanceof Error ? err : new Error(String(err)), null));
        },
      }),
    });
  }

  return instance;
}

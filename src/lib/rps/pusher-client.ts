"use client";

import PusherClient from "pusher-js";

let instance: PusherClient | null = null;
let warned = false;

interface RpsAuthProfile {
  name: string;
  equippedSkin: string;
  equippedAnimation: string;
  equippedTitle: string | null;
  equippedAvatar: string | null;
  elo: number;
}

let currentProfile: RpsAuthProfile = {
  name: "",
  equippedSkin: "",
  equippedAnimation: "",
  equippedTitle: null,
  equippedAvatar: null,
  elo: 1000,
};

/**
 * The presence-channel authorizer reads this at authorize-time, so it always
 * embeds the player's current name + equipped cosmetics + ELO into their
 * Pusher user_info without needing to recreate the underlying connection —
 * that's how the opponent's loadout shows up for free via presence data.
 */
export function setRpsAuthProfile(profile: RpsAuthProfile): void {
  currentProfile = profile;
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
          const params: Record<string, string> = {
            socket_id: socketId,
            channel_name: channel.name,
            name: currentProfile.name,
            equippedSkin: currentProfile.equippedSkin,
            equippedAnimation: currentProfile.equippedAnimation,
            elo: String(currentProfile.elo),
          };
          if (currentProfile.equippedTitle) {
            params.equippedTitle = currentProfile.equippedTitle;
          }
          if (currentProfile.equippedAvatar) {
            params.equippedAvatar = currentProfile.equippedAvatar;
          }

          fetch("/api/pusher/auth", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(params).toString(),
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

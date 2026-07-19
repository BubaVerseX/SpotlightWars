export const SPOTLIGHT_CHANNEL = "presence-spotlight-wars";
export const SPOTLIGHT_EVENT = "spotlight:new";

export const MAX_MESSAGE_LENGTH = 60;
export const MAX_NAME_LENGTH = 24;
export const MAX_RECENT_SPOTLIGHTS = 8;

export const TAKEOVER_DURATION_MS = 7000;
export const TAKEOVER_EXIT_MS = 500;

export const PAYMENT_ADDRESSES = {
  ETH: "0x6208483e0b0351B124Eb048877df50DD7fbbf917",
  SOL: "BWwWRU2TX8HkohqYAKDwjsQ2WCqQsMXh7qZH9tGvqU2s",
  BTC: "bc1qjxhespjcw4uhcyllnnlxkrsu0wsztsaxu0j8mc",
} as const;

export type CryptoTicker = keyof typeof PAYMENT_ADDRESSES;

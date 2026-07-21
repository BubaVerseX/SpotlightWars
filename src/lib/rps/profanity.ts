/**
 * Basic, non-exhaustive profanity filter for custom taunt text — this is
 * shown to strangers, so it needs *some* filtering, not perfect filtering.
 * Checked both client-side (immediate feedback) and server-side
 * (authoritative, in the profile POST route) before a custom taunt is saved.
 */
const BLOCKED_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "pussy",
  "whore",
  "slut",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "rape",
  "cock",
  "twat",
  "wanker",
];

export function containsProfanity(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return BLOCKED_WORDS.some((word) => normalized.includes(word));
}

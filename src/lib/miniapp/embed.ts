// Shared helpers for the Farcaster/Base App mini app manifest and embed
// meta tags — see /.well-known/farcaster.json/route.ts and the `metadata`
// exports on the landing and leaderboard pages.

export const MINIAPP_NAME = "RPS Arena";
export const MINIAPP_SPLASH_BACKGROUND_COLOR = "#05070d";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

interface MiniAppEmbedOptions {
  /** Absolute URL to the embed image — PNG, 3:2 aspect ratio, 600x400 min. */
  imageUrl: string;
  buttonTitle: string;
  /** Where the app should open to when launched from this embed. */
  launchUrl: string;
}

/**
 * Builds the `fc:miniapp` / `fc:frame` embed meta tag pair for a page — see
 * https://miniapps.farcaster.xyz/docs/guides/sharing. Both tags carry the
 * same embed, just with `action.type` set to each spec generation's name;
 * `fc:frame` exists purely for clients that predate the "miniapp" rename.
 */
export function buildMiniAppEmbedTags({ imageUrl, buttonTitle, launchUrl }: MiniAppEmbedOptions): {
  "fc:miniapp": string;
  "fc:frame": string;
} {
  const splashImageUrl = `${getSiteUrl()}/images/splash.png`;

  const actionBase = {
    url: launchUrl,
    name: MINIAPP_NAME,
    splashImageUrl,
    splashBackgroundColor: MINIAPP_SPLASH_BACKGROUND_COLOR,
  };

  return {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl,
      button: { title: buttonTitle, action: { type: "launch_miniapp", ...actionBase } },
    }),
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl,
      button: { title: buttonTitle, action: { type: "launch_frame", ...actionBase } },
    }),
  };
}

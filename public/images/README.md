# Mini app image assets

Referenced by `/.well-known/farcaster.json` (`src/app/.well-known/farcaster.json/route.ts`)
and the share-embed meta tags on the landing and leaderboard pages
(`src/lib/miniapp/embed.ts`). None of these exist yet — drop the real files
in this folder using these exact names, and the manifest/embeds pick them
up automatically (no code changes needed).

| File          | Dimensions        | Format                | Used for                                             |
| ------------- | ------------------ | ---------------------- | ----------------------------------------------------- |
| `icon.png`    | 1024×1024           | PNG, **no alpha**       | App icon shown in Farcaster/Base App listings          |
| `splash.png`  | 200×200             | PNG                     | Splash screen shown while the mini app loads           |
| `hero.png`    | 1200×630 (1.91:1)   | PNG                     | Manifest hero image + Open Graph share image (reused for both `heroImageUrl` and `ogImageUrl`) |
| `embed.png`   | 1200×800 (3:2), 600×400 min | PNG              | Rich cast/share embed image (`fc:miniapp` / `fc:frame`) on the landing + leaderboard pages |

Notes:

- `icon.png` **must not have an alpha channel** — some clients render a solid
  fallback background behind transparent pixels, which looks broken. Flatten
  it onto an opaque background before exporting.
- `splash.png` is shown centered over `splashBackgroundColor` (`#05070d`,
  matching the site's Tron background) — design it to look right on that
  color, not a white background.
- `hero.png` and `embed.png` are different aspect ratios (1.91:1 vs 3:2) —
  they can share the same artwork/crop but need to be exported separately at
  their own dimensions, not the same file reused as-is.
- Until these exist, the manifest/embeds will reference 404ing image URLs —
  that's expected and harmless for now; nothing else depends on them.

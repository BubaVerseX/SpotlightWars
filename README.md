# SpotlightWars

A live shared billboard. Everyone connected sees a real-time counter of how
many people are online right now. Anyone can pay any amount in ETH, SOL, or
BTC to take over every connected screen with their own message for a few
seconds.

Part of the [BubaVerseX](https://x.com/bubaverse) universe.

## Stack

- Next.js 15 (App Router, TypeScript) + Tailwind CSS
- [Pusher Channels](https://pusher.com/channels) for presence (live count) and
  broadcasting spotlight takeovers
- `qrcode.react` for payment QR codes

## Local development

1. Copy the env example and fill in your real Pusher credentials:

   ```bash
   cp .env.local.example .env.local
   ```

   Get `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_KEY`, `PUSHER_SECRET`, and
   `NEXT_PUBLIC_PUSHER_CLUSTER` from your app at
   [dashboard.pusher.com](https://dashboard.pusher.com).

2. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000). Open it in two tabs to
   see the live counter and spotlight takeovers sync between them.

Without real Pusher credentials, the app still runs: the live counter shows
"Live count unavailable" and a clear error is logged to the browser console
instead of crashing.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Add the four Pusher env vars (`PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_KEY`,
   `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_CLUSTER`) in the Vercel project's
   Environment Variables settings.
4. Optionally set `NEXT_PUBLIC_SITE_URL` to your production domain so the
   Open Graph image resolves correctly.
5. Deploy — no other configuration needed.

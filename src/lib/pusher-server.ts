import PusherServer from "pusher";

let instance: PusherServer | null = null;

/**
 * Lazily creates the server-side Pusher client. Throws with a clear message
 * if credentials are missing so API routes can return a clean 503 instead of
 * crashing the build or the whole server process.
 */
export function getPusherServer(): PusherServer {
  if (instance) return instance;

  const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER } =
    process.env;

  if (!PUSHER_APP_ID || !NEXT_PUBLIC_PUSHER_KEY || !PUSHER_SECRET || !NEXT_PUBLIC_PUSHER_CLUSTER) {
    throw new Error(
      "Missing Pusher credentials. Set PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, and " +
        "NEXT_PUBLIC_PUSHER_CLUSTER in .env.local (see .env.local.example)."
    );
  }

  instance = new PusherServer({
    appId: PUSHER_APP_ID,
    key: NEXT_PUBLIC_PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
  });

  return instance;
}

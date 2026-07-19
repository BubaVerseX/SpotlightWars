import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { getRpsStore } from "@/lib/rps/store";
import { createSessionCookieValue, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/rps/session";
import { resolveEnsName } from "@/lib/wallet/ens";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message : "";
  const signature = typeof body?.signature === "string" ? body.signature : "";

  if (!message || !signature) {
    return NextResponse.json({ error: "message and signature are required." }, { status: 400 });
  }

  let siweMessage: SiweMessage;
  try {
    siweMessage = new SiweMessage(message);
  } catch {
    return NextResponse.json({ error: "Malformed sign-in message." }, { status: 400 });
  }

  const store = getRpsStore();
  const nonceKey = `siwe:nonce:${siweMessage.nonce}`;
  const nonceExists = await store.get(nonceKey);
  if (!nonceExists) {
    return NextResponse.json(
      { error: "This sign-in request has expired or was already used — try connecting again." },
      { status: 401 }
    );
  }

  // Binds the verification to the host that's actually asking, so a message
  // signed for this site can't be replayed against a phishing relay.
  const expectedDomain = req.headers.get("host") ?? undefined;

  let verification;
  try {
    verification = await siweMessage.verify({ signature, domain: expectedDomain, nonce: siweMessage.nonce });
  } catch {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
  }

  if (!verification.success) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
  }

  // Single-use: burn the nonce immediately so this exact signed message can
  // never be replayed to mint a second session.
  await store.del(nonceKey);

  const address = siweMessage.address.toLowerCase();
  const ensName = await resolveEnsName(address as `0x${string}`);
  const profile = await store.getOrCreatePlayer({ kind: "wallet", address, ensName });

  const response = NextResponse.json({ ok: true, profile });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(address, ensName), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

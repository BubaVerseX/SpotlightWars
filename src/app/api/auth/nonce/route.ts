import { NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { getRpsStore } from "@/lib/rps/store";

const NONCE_TTL_SECONDS = 60 * 5;

// Issuing (and remembering) the nonce server-side, rather than trusting
// whatever nonce the client's SIWE message claims, is what makes the verify
// step single-use — see /api/auth/verify.
export async function GET() {
  const nonce = generateNonce();
  const store = getRpsStore();
  await store.set(`siwe:nonce:${nonce}`, "1", NONCE_TTL_SECONDS);
  return NextResponse.json({ nonce });
}

import { NextRequest, NextResponse } from "next/server";
import { getWalletSession } from "@/lib/rps/session";

export async function GET(req: NextRequest) {
  const session = getWalletSession(req);
  return NextResponse.json({ session });
}

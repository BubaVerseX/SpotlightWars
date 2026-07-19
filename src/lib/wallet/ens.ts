import type { Address } from "viem";
import { mainnetPublicClient } from "./public-client";

/** Best-effort reverse ENS lookup. Never throws — a flaky/unreachable public
 * RPC endpoint should degrade to "no ENS name" (shortened address), not fail
 * the sign-in. */
export async function resolveEnsName(address: Address): Promise<string | null> {
  try {
    const name = await mainnetPublicClient.getEnsName({ address });
    return name ?? null;
  } catch {
    return null;
  }
}

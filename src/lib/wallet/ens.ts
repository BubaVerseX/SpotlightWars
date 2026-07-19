import { createPublicClient, http, type Address } from "viem";
import { mainnet } from "viem/chains";

// ENS records live on mainnet regardless of which chain the wallet actually
// connected with, so this client is intentionally always mainnet.
const ensClient = createPublicClient({ chain: mainnet, transport: http() });

/** Best-effort reverse ENS lookup. Never throws — a flaky/unreachable public
 * RPC endpoint should degrade to "no ENS name" (shortened address), not fail
 * the sign-in. */
export async function resolveEnsName(address: Address): Promise<string | null> {
  try {
    const name = await ensClient.getEnsName({ address });
    return name ?? null;
  } catch {
    return null;
  }
}

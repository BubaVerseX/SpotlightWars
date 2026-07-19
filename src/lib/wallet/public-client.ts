import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

/** Shared mainnet read client — used for ENS lookups and for verifying shop
 * purchase transactions on-chain. Always mainnet regardless of which chain
 * a connected wallet happens to be on, since that's where our shop wallet
 * and ENS both live. */
export const mainnetPublicClient = createPublicClient({ chain: mainnet, transport: http() });

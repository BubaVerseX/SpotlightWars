import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
// Importing each connector from its own subpath (rather than the
// `wagmi/connectors` barrel) avoids pulling in optional connectors we don't
// use (porto, tempo wallet, etc.) whose own peer deps aren't installed.
import { injected } from "wagmi/connectors/injected";
import { coinbaseWallet } from "wagmi/connectors/coinbaseWallet";
import { walletConnect } from "wagmi/connectors/walletConnect";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Rock Paper Scissors — SpotlightWars" }),
    // WalletConnect needs a project id from https://cloud.reown.com — omit
    // the connector entirely rather than crash when it's not configured, so
    // MetaMask/Coinbase Wallet still work out of the box.
    ...(walletConnectProjectId ? [walletConnect({ projectId: walletConnectProjectId })] : []),
  ],
  transports: {
    [mainnet.id]: http(),
  },
  ssr: true,
});

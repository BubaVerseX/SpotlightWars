import { SiteHeader } from "@/components/rps/SiteHeader";
import { HeaderRefreshProvider } from "@/lib/rps/header-refresh-context";

// Scoped to every RPS page (home, shop, leaderboard, profile, match rooms,
// challenge, settings) via this route group — deliberately not in the root
// layout, since /spotlight is a separate product with its own theme/identity
// and shouldn't get this nav.
export default function RpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <HeaderRefreshProvider>
      <SiteHeader />
      {children}
    </HeaderRefreshProvider>
  );
}

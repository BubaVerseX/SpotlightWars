"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface HeaderRefreshContextValue {
  version: number;
  bump: () => void;
}

const HeaderRefreshContext = createContext<HeaderRefreshContextValue | null>(null);

/**
 * The persistent SiteHeader fetches its own (independent) copy of the
 * player's profile to render the corner avatar, since it's mounted in the
 * layout rather than any one page. When a page equips a new avatar (only
 * Settings does today), it has no other way to tell that already-mounted
 * header instance to refetch — bumping this shared counter is that signal.
 */
export function HeaderRefreshProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const value = useMemo(() => ({ version, bump }), [version, bump]);
  return <HeaderRefreshContext.Provider value={value}>{children}</HeaderRefreshContext.Provider>;
}

export function useBumpHeaderRefresh(): () => void {
  const ctx = useContext(HeaderRefreshContext);
  return ctx?.bump ?? (() => {});
}

export function useHeaderRefreshVersion(): number {
  const ctx = useContext(HeaderRefreshContext);
  return ctx?.version ?? 0;
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface MiniAppState {
  /** Whether detection has finished — false only very briefly on mount. */
  isReady: boolean;
  /** True when running inside a Farcaster or Base App mini app host. */
  isMiniApp: boolean;
  safeAreaInsets: SafeAreaInsets;
}

const ZERO_INSETS: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

const MiniAppContext = createContext<MiniAppState>({
  isReady: false,
  isMiniApp: false,
  safeAreaInsets: ZERO_INSETS,
});

/**
 * Detects whether the app is running inside a Farcaster/Base App mini app
 * host and exposes that plus the host's safe-area insets (the vertical
 * modal chrome those clients render around the app). This is the
 * replacement for OnchainKit's `MiniKitProvider` here — that package's
 * MiniKit hard-requires wagmi ^2.x as a peer dependency, which conflicts
 * with this project's wagmi 3.x, so this talks to `@farcaster/miniapp-sdk`
 * directly instead. Both Farcaster and Base App run mini apps through the
 * same manifest + SDK, so nothing about host detection is lost by skipping
 * OnchainKit specifically — only its bonus wagmi-coupled hooks/components,
 * which this app doesn't use.
 *
 * Wraps children in nothing of its own; call `useMiniApp()` to read state,
 * and see the `.rps-safe-area` class (rps-theme.css) for how the insets
 * are actually applied to layout.
 */
export function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MiniAppState>({
    isReady: false,
    isMiniApp: false,
    safeAreaInsets: ZERO_INSETS,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let isMiniApp = false;
      try {
        isMiniApp = await sdk.isInMiniApp();
      } catch {
        isMiniApp = false;
      }

      let safeAreaInsets = ZERO_INSETS;
      if (isMiniApp) {
        try {
          const context = await sdk.context;
          if (context.client.safeAreaInsets) {
            safeAreaInsets = context.client.safeAreaInsets;
          }
        } catch {
          // Context handshake failed — fall back to zero insets rather than
          // block rendering on it.
        }
      }

      if (cancelled) return;

      setState({ isReady: true, isMiniApp, safeAreaInsets });

      document.documentElement.style.setProperty("--rps-safe-top", `${safeAreaInsets.top}px`);
      document.documentElement.style.setProperty("--rps-safe-right", `${safeAreaInsets.right}px`);
      document.documentElement.style.setProperty("--rps-safe-bottom", `${safeAreaInsets.bottom}px`);
      document.documentElement.style.setProperty("--rps-safe-left", `${safeAreaInsets.left}px`);

      // Tells the host it's safe to dismiss the splash screen now that our
      // own UI has mounted. Safe to call outside a mini app host too — it's
      // a no-op there rather than an error, so this doesn't need to be
      // gated on `isMiniApp`.
      try {
        await sdk.actions.ready();
      } catch {
        // Not inside a mini app host, or the host doesn't implement this —
        // nothing to do.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <MiniAppContext.Provider value={state}>{children}</MiniAppContext.Provider>;
}

export function useMiniApp(): MiniAppState {
  return useContext(MiniAppContext);
}

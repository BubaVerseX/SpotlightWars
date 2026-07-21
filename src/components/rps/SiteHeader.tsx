"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRpsIdentity } from "@/lib/rps/use-identity";
import { useHeaderRefreshVersion } from "@/lib/rps/header-refresh-context";
import type { PublicPlayerProfile } from "@/lib/rps/types";
import { HeaderProfileWidget } from "./HeaderProfileWidget";

function ShopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 8 L5.5 4 H18.5 L20 8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="8" width="16" height="12" rx="1.5" />
      <path d="M9 12 a3 3 0 0 0 6 0" strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 14v3M9 20h6M10 17h4v3h-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

const GAMEPLAY_PREFIXES = ["/match/", "/computer/"];

export function SiteHeader() {
  const pathname = usePathname();
  const {
    name,
    claimToken,
    loading,
    isWalletVerified,
    walletAddress,
    claimName,
    checkNameAvailability,
    clearName,
  } = useRpsIdentity();
  const refreshVersion = useHeaderRefreshVersion();
  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!name) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({ name });
    if (claimToken) params.set("claimToken", claimToken);
    fetch(`/api/rps/profile?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProfile(data.profile ?? null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [name, claimToken, refreshVersion]);

  const isGameplayRoute = GAMEPLAY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Gameplay clarity outranks nav chrome mid-match — collapse to a bare,
  // minimal wayfinding strip instead of competing with the countdown/move
  // buttons/score for attention.
  if (isGameplayRoute) {
    return (
      <header className="rps-header rps-header-minimal">
        <div className="mx-auto flex h-11 max-w-6xl items-center justify-center px-4">
          <Link href="/" className="rps-header-logo rps-header-logo-sm">
            RPS
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="rps-header">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <nav className="flex items-center gap-1">
          <Link
            href="/shop"
            className={`rps-header-nav-item hidden sm:inline-flex ${pathname === "/shop" ? "active" : ""}`}
          >
            <ShopIcon />
            Shop
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rps-header-nav-item inline-flex sm:hidden"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <MenuIcon />
          </button>
        </nav>

        <Link
          href="/"
          className="rps-header-logo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          RPS
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/leaderboard"
            className={`rps-header-nav-item hidden sm:inline-flex ${pathname === "/leaderboard" ? "active" : ""}`}
          >
            <TrophyIcon />
            Leaderboard
          </Link>
          <HeaderProfileWidget
            loading={loading}
            name={name}
            isWalletVerified={isWalletVerified}
            walletAddress={walletAddress}
            equippedAvatar={profile?.equippedAvatar ?? null}
            claimName={claimName}
            checkNameAvailability={checkNameAvailability}
            clearName={clearName}
          />
        </div>

        {mobileMenuOpen && (
          <div className="rps-header-mobile-menu sm:hidden">
            <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="rps-header-dropdown-item">
              Shop
            </Link>
            <Link href="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="rps-header-dropdown-item">
              Leaderboard
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

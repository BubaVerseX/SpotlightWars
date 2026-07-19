const BANNER_CLASS: Record<string, string> = {
  "banner:cyberGrid": "rps-banner-cyberGrid",
  "banner:magentaPulse": "rps-banner-magentaPulse",
  "banner:goldRush": "rps-banner-goldRush",
  "banner:deepVoid": "rps-banner-deepVoid",
  "banner:auroraDrift": "rps-banner-auroraDrift",
};

interface BannerPreviewProps {
  bannerId: string | null | undefined;
  className?: string;
  children?: React.ReactNode;
}

/** Wraps `children` with the given banner as an absolutely-positioned
 * background layer. Renders children plainly (no background) when
 * `bannerId` is null/unrecognized, so "no banner equipped" just looks like
 * the plain panel it always did. */
export function BannerPreview({ bannerId, className, children }: BannerPreviewProps) {
  const bannerClass = bannerId ? BANNER_CLASS[bannerId] : undefined;

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {bannerClass && <div className={`absolute inset-0 ${bannerClass}`} aria-hidden="true" />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

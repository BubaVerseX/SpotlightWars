const FRAME_CLASS: Record<string, string> = {
  "leaderboardFrame:neonCircuit": "rps-frame-neonCircuit",
  "leaderboardFrame:moltenBorder": "rps-frame-moltenBorder",
  "leaderboardFrame:auroraRing": "rps-frame-auroraRing",
  "leaderboardFrame:goldenLaurel": "rps-frame-goldenLaurel",
};

interface LeaderboardFramePreviewProps {
  frameId: string | null | undefined;
  className?: string;
  children?: React.ReactNode;
}

/** Wraps `children` with an animated border overlay keyed by frameId — same
 * "id -> CSS class, absolutely-positioned layer" convention as
 * BannerPreview. Renders children plainly when frameId is null/unrecognized. */
export function LeaderboardFramePreview({ frameId, className, children }: LeaderboardFramePreviewProps) {
  const frameClass = frameId ? FRAME_CLASS[frameId] : undefined;

  return (
    <div className={`relative ${className ?? ""}`}>
      {frameClass && <div className={`pointer-events-none absolute inset-0 ${frameClass}`} aria-hidden="true" />}
      {children}
    </div>
  );
}

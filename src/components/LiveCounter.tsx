interface LiveCounterProps {
  count: number | null;
  unavailable: boolean;
}

export function LiveCounter({ count, unavailable }: LiveCounterProps) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-muted sm:text-sm">Live right now</p>
      <p className="mt-3 font-display text-7xl font-bold tabular-nums text-foreground glow-text sm:text-8xl">
        {count === null ? "—" : count.toLocaleString()}
      </p>
      <p className="mt-3 text-lg text-muted sm:text-xl">
        {count === 1 ? "person is" : "people are"} here right now
      </p>
      {unavailable && (
        <p className="mt-2 text-xs text-muted/70">
          Live count unavailable — Pusher isn&apos;t configured yet.
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_NAME_LENGTH } from "@/lib/rps/constants";

interface NameGateProps {
  onSubmit: (name: string) => void;
  title: string;
  subtitle?: string;
  submitLabel?: string;
  defaultValue?: string;
  disabled?: boolean;
  /** Server-checked error to show (e.g. the authoritative claim attempt
   * failed) — distinct from the live/advisory availability indicator below. */
  error?: string | null;
  /** Optional live "is this available" check, debounced internally. Purely
   * advisory UX — the real gate is whatever `onSubmit` does. */
  onCheckAvailability?: (name: string) => Promise<boolean>;
}

const CHECK_DEBOUNCE_MS = 400;

export function NameGate({
  onSubmit,
  title,
  subtitle,
  submitLabel = "Continue",
  defaultValue = "",
  disabled = false,
  error = null,
  onCheckAvailability,
}: NameGateProps) {
  const [value, setValue] = useState(defaultValue);
  const [availability, setAvailability] = useState<"checking" | "available" | "taken" | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!onCheckAvailability) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setAvailability(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setAvailability("checking");
    const timer = setTimeout(() => {
      onCheckAvailability(trimmed).then((available) => {
        if (requestIdRef.current !== requestId) return; // a newer keystroke superseded this check
        setAvailability(available ? "available" : "taken");
      });
    }, CHECK_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, onCheckAvailability]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed) onSubmit(trimmed);
      }}
      className="w-full max-w-sm space-y-4 text-center"
    >
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
        {title}
      </h1>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      <div className="space-y-1.5">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_NAME_LENGTH))}
          placeholder="Your name or handle"
          maxLength={MAX_NAME_LENGTH}
          className="arcade-input w-full rounded-lg px-4 py-3 text-center placeholder:text-muted"
        />
        {onCheckAvailability && availability && (
          <p
            className="text-xs"
            style={{
              color:
                availability === "available"
                  ? "var(--neon-cyan)"
                  : availability === "taken"
                    ? "var(--neon-magenta)"
                    : "var(--muted)",
            }}
          >
            {availability === "checking" && "Checking…"}
            {availability === "available" && "✓ Available"}
            {availability === "taken" && "✗ Already taken, try another"}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim() || availability === "taken"}
        className="arcade-btn-solid w-full rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {submitLabel}
      </button>
      {error && (
        <p className="text-sm" style={{ color: "var(--neon-magenta)" }}>
          {error}
        </p>
      )}
    </form>
  );
}

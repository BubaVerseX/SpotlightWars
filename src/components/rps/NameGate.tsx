"use client";

import { useState } from "react";
import { MAX_NAME_LENGTH } from "@/lib/rps/constants";

interface NameGateProps {
  onSubmit: (name: string) => void;
  title: string;
  subtitle?: string;
  submitLabel?: string;
  defaultValue?: string;
  disabled?: boolean;
}

export function NameGate({
  onSubmit,
  title,
  subtitle,
  submitLabel = "Continue",
  defaultValue = "",
  disabled = false,
}: NameGateProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed) onSubmit(trimmed);
      }}
      className="w-full max-w-sm space-y-4 text-center"
    >
      <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_NAME_LENGTH))}
        placeholder="Your name or handle"
        maxLength={MAX_NAME_LENGTH}
        className="w-full rounded-xl border border-border bg-background-elevated px-4 py-3 text-center text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="w-full rounded-xl bg-accent px-6 py-3 font-display font-semibold text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </form>
  );
}

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
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
        {title}
      </h1>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_NAME_LENGTH))}
        placeholder="Your name or handle"
        maxLength={MAX_NAME_LENGTH}
        className="arcade-input w-full rounded-lg px-4 py-3 text-center placeholder:text-muted"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="arcade-btn-solid w-full rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {submitLabel}
      </button>
    </form>
  );
}

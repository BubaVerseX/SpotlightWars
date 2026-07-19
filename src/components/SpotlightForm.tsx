"use client";

import { MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH } from "@/lib/constants";

interface SpotlightFormProps {
  message: string;
  name: string;
  onMessageChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
}

export function SpotlightForm({
  message,
  name,
  onMessageChange,
  onNameChange,
  onSubmit,
}: SpotlightFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="w-full max-w-md space-y-4"
    >
      <div>
        <input
          value={message}
          onChange={(e) => onMessageChange(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          placeholder="Say something to everyone here..."
          maxLength={MAX_MESSAGE_LENGTH}
          className="w-full rounded-xl border border-border bg-background-elevated px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="mt-1 text-right text-xs text-muted">
          {message.length}/{MAX_MESSAGE_LENGTH}
        </p>
      </div>
      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value.slice(0, MAX_NAME_LENGTH))}
        placeholder="Your name or handle (optional)"
        maxLength={MAX_NAME_LENGTH}
        className="w-full rounded-xl border border-border bg-background-elevated px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={!message.trim()}
        className="w-full rounded-xl bg-accent px-6 py-3 font-display font-semibold text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Take the Spotlight
      </button>
      <p className="text-center text-sm text-muted">Pay to interrupt everyone currently here.</p>
    </form>
  );
}

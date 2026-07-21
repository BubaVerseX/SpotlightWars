"use client";

import { useState } from "react";
import { MAX_CUSTOM_TAUNT_LENGTH } from "@/lib/rps/constants";
import { containsProfanity } from "@/lib/rps/profanity";

interface CustomTauntEditorProps {
  name: string;
  claimToken: string | null;
  customTaunt: string | null;
  onSaved: (customTaunt: string | null) => void;
}

/** Lets a player who's unlocked "taunt:custom" type their own short taunt
 * message. Mirrors the server's validation (see /api/rps/profile) for
 * immediate feedback, but the server re-checks everything authoritatively —
 * this is convenience, not the security boundary. */
export function CustomTauntEditor({ name, claimToken, customTaunt, onSaved }: CustomTauntEditorProps) {
  const [draft, setDraft] = useState(customTaunt ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const trimmed = draft.trim();
  const tooLong = trimmed.length > MAX_CUSTOM_TAUNT_LENGTH;
  const profane = trimmed.length > 0 && containsProfanity(trimmed);

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    if (tooLong) {
      setError(`Keep it to ${MAX_CUSTOM_TAUNT_LENGTH} characters or fewer.`);
      return;
    }
    if (profane) {
      setError("That taunt isn't allowed.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/rps/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, claimToken, customTaunt: trimmed.length === 0 ? null : trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't save your taunt.");
        return;
      }
      onSaved(data.profile.customTaunt);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-muted">Custom Taunt</p>
      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSaved(false);
          }}
          maxLength={MAX_CUSTOM_TAUNT_LENGTH + 10}
          placeholder="Type your own taunt..."
          className="arcade-input w-full rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex w-full items-center justify-between text-[10px] text-muted">
          <span style={{ color: tooLong ? "var(--neon-magenta)" : undefined }}>
            {trimmed.length}/{MAX_CUSTOM_TAUNT_LENGTH}
          </span>
          {saved && <span style={{ color: "var(--neon-cyan)" }}>Saved</span>}
        </div>
        {(error || profane) && (
          <p className="text-xs" style={{ color: "var(--neon-magenta)" }}>
            {error ?? "That taunt isn't allowed."}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || tooLong || profane}
          className="arcade-btn rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

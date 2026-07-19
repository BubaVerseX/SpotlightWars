"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PAYMENT_ADDRESSES, type CryptoTicker } from "@/lib/constants";

const TICKERS: CryptoTicker[] = ["ETH", "SOL", "BTC"];

interface PaymentModalProps {
  message: string;
  name: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function PaymentModal({ message, name, onClose, onConfirm }: PaymentModalProps) {
  const [ticker, setTicker] = useState<CryptoTicker>("ETH");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = PAYMENT_ADDRESSES[ticker];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError("Couldn't broadcast the spotlight. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-background-elevated p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">Take the Spotlight</h2>
          <button
            onClick={onClose}
            className="text-muted transition hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted">
          &ldquo;{message}&rdquo; — {name}
        </p>

        <div className="mt-5 flex gap-2 rounded-xl bg-background p-1">
          {TICKERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTicker(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                ticker === t ? "bg-accent text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={address} size={168} />
          </div>
          <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <span className="flex-1 truncate font-mono text-xs text-muted">{address}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg bg-background-elevated px-3 py-1 text-xs font-medium text-accent transition hover:brightness-110"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-accent px-6 py-3 font-display font-semibold text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Lighting it up..." : "I sent it — light it up 🔦"}
        </button>
        <p className="mt-3 text-center text-xs text-muted/70">
          Any amount. We don&apos;t verify payments — this runs on the honor system.
        </p>
      </div>
    </div>
  );
}

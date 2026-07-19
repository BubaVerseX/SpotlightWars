import { XIcon } from "@/components/XIcon";

export function Footer() {
  return (
    <footer className="flex items-center justify-center gap-2 py-6 text-xs text-muted">
      <span>Part of the BubaVerseX universe</span>
      <a
        href="https://x.com/bubaverse"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="BubaVerseX on X"
        className="text-muted transition hover:text-accent"
      >
        <XIcon className="h-3.5 w-3.5" />
      </a>
    </footer>
  );
}

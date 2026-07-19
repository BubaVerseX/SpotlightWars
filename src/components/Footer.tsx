import Link from "next/link";
import { XIcon } from "@/components/XIcon";

interface FooterProps {
  extraLink?: { href: string; label: string };
}

export function Footer({ extraLink }: FooterProps) {
  return (
    <footer className="flex flex-col items-center gap-2 py-6 text-xs text-muted">
      {extraLink && (
        <Link href={extraLink.href} className="underline-offset-2 hover:text-accent hover:underline">
          {extraLink.label}
        </Link>
      )}
      <div className="flex items-center justify-center gap-2">
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
      </div>
    </footer>
  );
}

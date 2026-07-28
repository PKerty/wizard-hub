"use client";

import Link from "next/link";
import { trackExploreCtaClicked } from "@/lib/analytics";

interface FooterLinkDef {
  href: string;
  label: string;
  tracksAsExploreCta: boolean;
}

const LINKS: readonly FooterLinkDef[] = [
  { href: "/", label: "Home", tracksAsExploreCta: false },
  { href: "/houses", label: "Houses", tracksAsExploreCta: true },
] as const;

/**
 * Site footer. Renders on every page via the root layout.
 * Same exploration semantics as Nav: Houses link fires `Explore CTA Clicked`
 * with location 'footer'; Home link does not fire.
 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-moonlight/20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-eyebrow uppercase tracking-[0.25em] text-torchlight">
            wizard-hub
          </p>
          <p className="mt-2 font-mono text-mono-data text-whisper">
            Solutions Architect Challenge · fanclub portal · MMXXVI
          </p>
        </div>

        <ul className="flex items-center gap-8">
          {LINKS.map((link) => {
            const handleClick = link.tracksAsExploreCta
              ? () => trackExploreCtaClicked({ location: "footer" })
              : undefined;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={handleClick}
                  className="font-display text-eyebrow uppercase tracking-[0.2em] text-moonlight transition-colors duration-base ease-arcane hover:text-steel"
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import type { Route } from "next";

interface NavLinkDef {
  href: Route;
  label: string;
  tracksAsExploreCta: boolean;
}

interface MobileNavProps {
  links: readonly NavLinkDef[];
  isActive: (href: string) => boolean;
  onLinkClick: (link: NavLinkDef) => void;
  footer?: React.ReactNode;
}

/**
 * Mobile navigation drawer (ADR-0021).
 *
 * Uses Radix UI Dialog for reliable focus trap, scroll lock (with scrollbar
 * padding compensation — no background shift), aria management, and exit
 * animations via CSS `data-state` keyframes.
 */
export function MobileNav({ links, isActive, onLinkClick, footer }: MobileNavProps) {
  const handleLinkClick = (link: NavLinkDef) => {
    onLinkClick(link);
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex size-11 items-center justify-center rounded-soft border border-moonlight/30 bg-bg-mist/60 text-torchlight backdrop-blur transition-all duration-base ease-arcane hover:-translate-y-px hover:border-torchlight hover:text-steel sm:hidden"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M3 12h18" />
            <path d="M3 18h18" />
          </svg>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className="mobile-nav-overlay fixed inset-0 z-40 bg-bg-void/70"
        />
        <Dialog.Content
          aria-label="Site navigation"
          className="mobile-nav-content fixed right-0 top-0 z-50 flex h-dvh w-64 max-w-[80vw] flex-col border-l border-moonlight/20 bg-bg-mist px-4 py-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        >
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-4 inline-flex size-9 items-center justify-center rounded-soft text-moonlight transition-colors duration-base ease-arcane hover:text-torchlight"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </Dialog.Close>

          <nav aria-label="Mobile" className="mt-10 flex flex-col gap-1">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Dialog.Close asChild key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => handleLinkClick(link)}
                    className={
                      "inline-flex min-h-11 items-center rounded-soft px-3 font-display text-eyebrow uppercase tracking-[0.2em] transition-colors duration-base ease-arcane " +
                      (active
                        ? "text-torchlight"
                        : "text-moonlight hover:text-steel hover:bg-bg-fog/50")
                    }
                  >
                    {link.label}
                  </Link>
                </Dialog.Close>
              );
            })}
            {footer ? (
              <Dialog.Close asChild>
                <div className="mt-2 border-t border-moonlight/20 pt-2">
                  {footer}
                </div>
              </Dialog.Close>
            ) : null}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

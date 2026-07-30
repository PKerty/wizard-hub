"use client";

import { useEffect, useRef, useState } from "react";
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
  /** Optional extra node rendered at the bottom of the drawer (e.g., auth link). */
  footer?: React.ReactNode;
}

/**
 * Mobile navigation drawer (ADR-0021).
 *
 * Render-only-visible on < sm via Tailwind `sm:hidden` on the trigger.
 * Drawer slides from the right with a translucent overlay. Closes on:
 * link click, overlay click, Escape, or route change.
 *
 * Accessibility: aria-expanded/controls on trigger, role=dialog + aria-modal
 * on drawer, focus trap to first link on open, Escape returns focus to trigger.
 */
export function MobileNav({ links, isActive, onLinkClick, footer }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus first link after paint (drawer mount).
    const t = window.setTimeout(() => firstLinkRef.current?.focus(), 0);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  const handleLinkClick = (link: NavLinkDef) => {
    onLinkClick(link);
    close();
  };

  return (
    <div className="sm:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="inline-flex size-11 items-center justify-center rounded-soft border border-moonlight/30 bg-bg-mist/60 text-torchlight backdrop-blur transition-all duration-base ease-arcane hover:-translate-y-px hover:border-torchlight hover:text-steel"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          aria-hidden="true"
        >
          {isOpen ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <>
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </>
          )}
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            onClick={close}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-bg-void/70 backdrop-blur-sm"
          />

          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="fixed right-0 top-0 z-50 flex h-dvh w-64 max-w-[80vw] flex-col gap-1 border-l border-moonlight/20 bg-bg-mist px-4 py-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1">
              {links.map((link, idx) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    ref={idx === 0 ? firstLinkRef : undefined}
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
                );
              })}
              {footer ? (
                <div
                  className="mt-2 border-t border-moonlight/20 pt-2"
                  onClick={close}
                >
                  {footer}
                </div>
              ) : null}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

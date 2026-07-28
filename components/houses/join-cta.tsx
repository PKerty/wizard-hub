"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { trackExploreCtaClicked } from "@/lib/analytics";
import { readWizardName } from "@/lib/user";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string | null {
  return readWizardName();
}

function getServerSnapshot(): string | null {
  return null;
}

interface JoinCtaProps {
  /**
   * House slug for the /join form ('gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff').
   * NOT the API UUID — those don't match the form's HOUSE_OPTIONS values.
   * Caller is responsible for passing the slug (e.g., `house.name.toLowerCase()`).
   */
  favoriteHouseValue: string;
  /** Display name, e.g., "Ravenclaw" — used in CTA copy. */
  houseName: string;
}

/**
 * Conditional "Join the Order" CTA shown on the house detail page.
 * Renders only when the user is anonymous (no wizardName in localStorage).
 * Pre-selects the current house on the /join form via ?favoriteHouse=<slug>.
 *
 * SSR-safe: server renders the CTA (assuming anonymous, which is the default),
 * client hides it if the user turns out to be known.
 */
export function JoinCta({ favoriteHouseValue, houseName }: JoinCtaProps) {
  const wizardName = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (wizardName !== null) return null;

  return (
    <section className="mt-16 border-t border-moonlight/20 pt-12">
      <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
        Feel the call?
      </p>
      <p className="mt-4 max-w-xl font-body text-body-lg text-moonlight">
        Bind your orb to <span className="text-steel">{houseName}</span> and join the order.
        Your choice will be pre-selected.
      </p>
      <div className="mt-6">
        <Link
          href={`/join?favoriteHouse=${favoriteHouseValue}`}
          onClick={() => trackExploreCtaClicked({ location: "house_detail" })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-soft bg-torchlight px-6 py-3 font-display text-eyebrow uppercase tracking-[0.2em] text-bg-void transition-all duration-base ease-arcane hover:shadow-[0_0_24px_rgba(212,162,75,0.25)] hover:brightness-110 sm:w-auto"
        >
          Join the Order
        </Link>
      </div>
    </section>
  );
}

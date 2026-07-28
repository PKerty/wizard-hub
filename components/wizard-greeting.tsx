"use client";

import { useSyncExternalStore } from "react";
import { WIZARD_NAME_STORAGE_KEY, readWizardName } from "@/lib/user";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getWizardNameSnapshot(): string | null {
  return readWizardName();
}

function getWizardNameServerSnapshot(): string | null {
  // SSR-safe: always null so server renders "wanderer" and client hydrates matching.
  return null;
}

/**
 * Renders the wizardName if the user is known, "wanderer" otherwise.
 * Used in the home hero (ADR-0013 §"shimmer signature" target).
 *
 * SSR-safe via getServerSnapshot: server renders "wanderer", client hydrates
 * the same, then updates if localStorage has a wizardName (post-mount, no flash
 * of layout, only text content swaps which is acceptable).
 */
export function WizardGreeting() {
  const wizardName = useSyncExternalStore(
    subscribe,
    getWizardNameSnapshot,
    getWizardNameServerSnapshot,
  );

  return (
    <span className="shimmer shimmer-text">
      {wizardName ?? "wanderer"}
    </span>
  );
}

// Re-export the storage key for consumers that need to dispatch 'storage' events manually.
export { WIZARD_NAME_STORAGE_KEY };

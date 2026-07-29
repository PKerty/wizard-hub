"use client";

import { useWizardName } from "@/lib/user/use-wizard-name";

/**
 * Renders the wizardName if the user is known, "wanderer" otherwise.
 * Used in the home hero (ADR-0013 §"shimmer signature" target).
 *
 * SSR-safe via getServerSnapshot: server renders "wanderer", client hydrates
 * the same, then updates if localStorage has a wizardName (post-mount, no flash
 * of layout, only text content swaps which is acceptable).
 */
export function WizardGreeting() {
  const wizardName = useWizardName();

  return (
    <span className="shimmer shimmer-text">
      {wizardName ?? "wanderer"}
    </span>
  );
}

// Re-export the storage key for consumers that need to dispatch 'storage' events manually.
export { WIZARD_NAME_STORAGE_KEY } from "@/lib/user";

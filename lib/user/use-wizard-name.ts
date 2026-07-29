"use client";

import { useSyncExternalStore } from "react";
import { readWizardName } from "./index";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getWizardNameSnapshot(): string | null {
  return readWizardName();
}

function getWizardNameServerSnapshot(): string | null {
  return null;
}

/**
 * Subscribes to the persisted wizardName (ADR-0008).
 *
 * SSR-safe via getServerSnapshot: server renders `null`, client hydrates the
 * same, then updates if localStorage has a value. Cross-tab sync via the
 * `storage` event; same-tab updates require callers to dispatch a `storage`
 * event manually (see Nav.handleSignOut).
 */
export function useWizardName(): string | null {
  return useSyncExternalStore(
    subscribe,
    getWizardNameSnapshot,
    getWizardNameServerSnapshot,
  );
}

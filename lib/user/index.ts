/**
 * Wizard identity storage (ADR-0008 lifecycle).
 *
 * Companion to Amplitude's setUserId: persists the wizardName locally so the UI
 * can show a personalized greeting without waiting for an async Amplitude call.
 *
 * Browser-only; safe to call from SSR (no-op).
 */

export const WIZARD_NAME_STORAGE_KEY = "wizard-hub:wizardName";
const MAX_WIZARD_NAME_LENGTH = 50;

/** Returns the persisted wizardName, or null if the user is anonymous. */
export function readWizardName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WIZARD_NAME_STORAGE_KEY);
}

/** Persists the wizardName (trimmed, capped at 50 chars). No-op on SSR. */
export function saveWizardName(rawName: string): void {
  if (typeof window === "undefined") return;
  const trimmed = rawName.trim().slice(0, MAX_WIZARD_NAME_LENGTH);
  localStorage.setItem(WIZARD_NAME_STORAGE_KEY, trimmed);
}

/** Clears the persisted identity (sign-out). No-op on SSR. */
export function clearWizardName(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WIZARD_NAME_STORAGE_KEY);
}

/** True when a wizardName is stored (i.e., user has joined). */
export function isUserKnown(): boolean {
  return readWizardName() !== null;
}

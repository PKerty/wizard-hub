/**
 * Wizard domain entity (ADR-0028). API-agnostic canonical shape.
 *
 * `displayName` is the only searchable field and is derived defensively from
 * `firstName`/`lastName` (both nullable in the API). Wizards with no nameable
 * parts get `displayName: null` and are excluded from the search index.
 */
export interface Wizard {
  id: string;
  displayName: string | null;
}

/**
 * Compute a display name from nullable parts (ADR-0028 §3).
 *
 * - both present  -> "firstName lastName"
 * - one present   -> that one
 * - both null/empty -> null (not indexable)
 *
 * Pure and unit-tested so the null-handling rule lives in one place.
 */
export function buildDisplayName(
  firstName?: string | null,
  lastName?: string | null,
): string | null {
  const f = firstName?.trim() || null;
  const l = lastName?.trim() || null;
  if (f && l) return `${f} ${l}`;
  return f ?? l;
}

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
  /**
   * Elixir names the wizard is associated with (display only — NOT indexed for
   * search; ADR-0028 §3 scopes search to `displayName`). Surfaced for the
   * "See details" panel.
   */
  elixirNames: string[];
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

/**
 * Reduce raw elixirs to a list of trimmed, non-empty names (detail panel).
 * Defensive: the API contract is `name: string` but we tolerate null/whitespace
 * so a malformed entry never renders an empty chip. Pure + unit-tested.
 */
export function buildElixirNames(
  elixirs: ReadonlyArray<{ name?: string | null }>,
): string[] {
  return elixirs
    .map((e) => e?.name?.trim() || null)
    .filter((n): n is string => n !== null && n.length > 0);
}

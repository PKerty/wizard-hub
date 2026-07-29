import { env } from "@/lib/config/env";

/**
 * Shared HTTP client for the Wizard World API.
 * Centralizes base URL, error handling, and a default ISR-friendly fetch config.
 */
export class WizardWorldApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string,
  ) {
    super(message);
    this.name = "WizardWorldApiError";
  }
}

type FetchOptions = {
  /** Next.js cache revalidation in seconds. Default: no revalidate (force fresh per request). */
  revalidate?: number;
  /** Tags for on-demand revalidation via `revalidateTag`. */
  tags?: string[];
};

export async function wizardWorldFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = `${env.wizardWorld.baseUrl}${path}`;
  const res = await fetch(url, {
    next: {
      revalidate: options.revalidate,
      tags: options.tags,
    },
  });

  if (!res.ok) {
    throw new WizardWorldApiError(
      `Wizard World API ${res.status} ${res.statusText} for ${path}`,
      res.status,
      path,
    );
  }

  return res.json() as Promise<T>;
}

/**
 * Resilient wrapper over `wizardWorldFetch` (ADR-0026).
 * On any error (API error or network error) it logs a warning tagged with
 * `context` and returns `fallback` instead of throwing. Used by ISR-backed
 * adapters so an upstream outage degrades to an empty state rather than a
 * failed deploy.
 */
type SafeFetchOptions<T> = FetchOptions & {
  fallback: T;
  /** Log label, e.g. "houses/findAll". */
  context: string;
};

export async function wizardWorldFetchSafe<T>(
  path: string,
  options: SafeFetchOptions<T>,
): Promise<T> {
  try {
    return await wizardWorldFetch<T>(path, {
      revalidate: options.revalidate,
      tags: options.tags,
    });
  } catch (err) {
    if (err instanceof WizardWorldApiError) {
      console.warn(`[${options.context}] API error: ${err.status} ${err.message}`);
    } else {
      console.warn(`[${options.context}] network error:`, err);
    }
    return options.fallback;
  }
}

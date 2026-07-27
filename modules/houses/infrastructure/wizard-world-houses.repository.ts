import { wizardWorldFetch, WizardWorldApiError } from "@/lib/api/wizard-world.client";
import type { HouseResponse } from "@/types/wizard-world";
import type { House } from "../domain/house";
import type { HousesRepository } from "../domain/house-repository.port";

/** ISR window for houses data (ADR-0005): 24h. */
const HOUSES_REVALIDATE_SECONDS = 86400;
const HOUSES_TAG = "houses";

function mapResponseToEntity(r: HouseResponse): House {
  return {
    id: r.id,
    name: r.name,
    houseColours: r.houseColours,
    founder: r.founder,
    animal: r.animal,
    element: r.element,
    ghost: r.ghost,
    commonRoom: r.commonRoom,
    traitNames: r.traits.map((t) => t.name),
    memberCount: r.members.length,
    headNames: r.heads.map((h) => `${h.firstName} ${h.lastName}`),
    colorValues: r.colors.map((c) => c.color),
  };
}

/**
 * Wraps fetch in try/catch and returns `[]` / `null` on failure.
 *
 * Rationale: this repository backs ISR pages. If the upstream API is down at
 * build/revalidate time, we want the page to render with an empty state
 * (already handled in the UI) rather than fail the deploy. The error is still
 * logged so it shows up in runtime logs / CI output.
 */
async function safeFetch<T>(
  fetchFn: () => Promise<T>,
  fallback: T,
  context: string,
): Promise<T> {
  try {
    return await fetchFn();
  } catch (err) {
    if (err instanceof WizardWorldApiError) {
      console.warn(`[houses] API error during ${context}: ${err.status} ${err.message}`);
    } else {
      console.warn(`[houses] network error during ${context}:`, err);
    }
    return fallback;
  }
}

/** Concrete adapter implementing the HousesRepository port. */
export const wizardWorldHousesRepository: HousesRepository = {
  async findAll() {
    const raw = await safeFetch(
      () =>
        wizardWorldFetch<HouseResponse[]>("/Houses", {
          revalidate: HOUSES_REVALIDATE_SECONDS,
          tags: [HOUSES_TAG],
        }),
      [] as HouseResponse[],
      "findAll",
    );
    return raw.map(mapResponseToEntity);
  },

  async findById(id: string) {
    const raw = await safeFetch(
      () =>
        wizardWorldFetch<HouseResponse>(`/Houses/${id}`, {
          revalidate: HOUSES_REVALIDATE_SECONDS,
          tags: [HOUSES_TAG],
        }),
      null as HouseResponse | null,
      `findById(${id})`,
    );
    return raw ? mapResponseToEntity(raw) : null;
  },
};

import { wizardWorldFetchSafe } from "@/lib/api/wizard-world.client";
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
    headNames: r.heads.map((h) => `${h.firstName} ${h.lastName}`),
  };
}

/**
 * Concrete adapter implementing the HousesRepository port.
 * Fetching is resilient (ADR-0026 `wizardWorldFetchSafe`): an upstream outage
 * degrades to an empty state (handled in the UI) rather than failing the build.
 */
export const wizardWorldHousesRepository: HousesRepository = {
  async findAll() {
    const raw = await wizardWorldFetchSafe<HouseResponse[]>("/Houses", {
      fallback: [],
      context: "houses/findAll",
      revalidate: HOUSES_REVALIDATE_SECONDS,
      tags: [HOUSES_TAG],
    });
    return raw.map(mapResponseToEntity);
  },

  async findById(id: string) {
    const raw = await wizardWorldFetchSafe<HouseResponse | null>(`/Houses/${id}`, {
      fallback: null,
      context: `houses/findById(${id})`,
      revalidate: HOUSES_REVALIDATE_SECONDS,
      tags: [HOUSES_TAG],
    });
    return raw ? mapResponseToEntity(raw) : null;
  },
};

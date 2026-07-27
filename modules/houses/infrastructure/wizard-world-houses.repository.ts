import { wizardWorldFetch } from "@/lib/api/wizard-world.client";
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

/** Concrete adapter implementing the HousesRepository port. */
export const wizardWorldHousesRepository: HousesRepository = {
  async findAll() {
    const raw = await wizardWorldFetch<HouseResponse[]>("/Houses", {
      revalidate: HOUSES_REVALIDATE_SECONDS,
      tags: [HOUSES_TAG],
    });
    return raw.map(mapResponseToEntity);
  },

  async findById(id: string) {
    const raw = await wizardWorldFetch<HouseResponse>(`/Houses/${id}`, {
      revalidate: HOUSES_REVALIDATE_SECONDS,
      tags: [HOUSES_TAG],
    });
    return raw ? mapResponseToEntity(raw) : null;
  },
};

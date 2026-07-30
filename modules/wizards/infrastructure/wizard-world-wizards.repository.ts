import type { WizardResponse } from "@/types/wizard-world";
import { wizardWorldFetchSafe } from "@/lib/api/wizard-world.client";
import type { Wizard } from "../domain/wizard";
import { buildDisplayName, buildElixirNames } from "../domain/wizard";
import type { WizardsRepository } from "../domain/wizards-repository.port";

/** ISR window for wizards data (ADR-0005 / ADR-0028): 24h. */
const WIZARDS_REVALIDATE_SECONDS = 86400;
const WIZARDS_TAG = "wizards";

function mapWizard(r: WizardResponse): Wizard {
  return {
    id: r.id,
    displayName: buildDisplayName(r.firstName, r.lastName),
    elixirNames: buildElixirNames(r.elixirs),
  };
}

/**
 * Concrete adapter implementing the WizardsRepository port (ADR-0028).
 * Fetching is resilient (ADR-0026 `wizardWorldFetchSafe`): an upstream outage
 * degrades to an empty array rather than failing the build.
 */
export const wizardWorldWizardsRepository: WizardsRepository = {
  async findAll() {
    const raw = await wizardWorldFetchSafe<WizardResponse[]>("/Wizards", {
      fallback: [],
      context: "wizards/findAll",
      revalidate: WIZARDS_REVALIDATE_SECONDS,
      tags: [WIZARDS_TAG],
    });
    return raw.map(mapWizard);
  },
};

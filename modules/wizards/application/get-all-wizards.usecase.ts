import type { WizardsRepository } from "../domain/wizards-repository.port";

/** Application entry point for "list all wizards" (ADR-0028). */
export function createGetAllWizardsUseCase(repo: WizardsRepository) {
  return async function getAllWizards() {
    return repo.findAll();
  };
}

export type GetAllWizardsUseCase = ReturnType<typeof createGetAllWizardsUseCase>;

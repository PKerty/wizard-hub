/**
 * Composition root for the Wizards module (ADR-0028).
 * Wires the concrete adapter to the use case — single place to swap implementations.
 */
import { wizardWorldWizardsRepository } from "./infrastructure/wizard-world-wizards.repository";
import { createGetAllWizardsUseCase } from "./application/get-all-wizards.usecase";

export const getAllWizards = createGetAllWizardsUseCase(wizardWorldWizardsRepository);

export type { Wizard } from "./domain/wizard";

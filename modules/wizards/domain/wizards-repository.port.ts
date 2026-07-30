import type { Wizard } from "./wizard";

/**
 * Port for the Wizards repository (ADR-0009 §"Pragmatismo", ADR-0028).
 * Use cases depend on this abstraction so they stay unit-testable without fetch.
 */
export interface WizardsRepository {
  findAll(): Promise<Wizard[]>;
}

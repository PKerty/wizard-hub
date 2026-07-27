import type { House } from "./house";

/**
 * Port (interface) for the Houses repository.
 * Defined in domain so use cases depend on this abstraction, not on the API client.
 * Implemented by infrastructure/wizard-world-houses.repository.ts.
 *
 * Justification (ADR-0009 §"Pragmatismo"): even with a single concrete implementation,
 * the port exists for testability — use cases can be unit-tested with a mock repository
 * without coupling to fetch.
 */
export interface HousesRepository {
  findAll(): Promise<House[]>;
  findById(id: string): Promise<House | null>;
}

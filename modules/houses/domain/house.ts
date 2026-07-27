/**
 * House domain entity.
 * This is the canonical shape used across the app — independent of the API response shape.
 * The infrastructure layer (wizard-world-houses.repository.ts) maps API → entity.
 */
export interface House {
  id: string;
  name: string;
  houseColours: string;
  founder: string;
  animal: string;
  element: string;
  ghost: string;
  commonRoom: string;
  traitNames: string[];
  memberCount: number;
  headNames: string[];
  colorValues: string[];
}

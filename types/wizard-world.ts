/**
 * Raw types matching the Wizard World API responses (House resource).
 * Source: https://wizard-world-api.herokuapp.com/swagger/index.html
 *
 * These are infrastructure-layer types; the domain layer (modules/{ctx}/domain)
 * may project these into cleaner entities.
 *
 * Note: the API does NOT return `members` or `colors` arrays on the House
 * resource — only `heads` and `traits`. Members can be queried separately
 * via /Wizards?HouseId=… if needed in the future.
 */

export interface HouseTraitResponse {
  id: string;
  name: string;
}

export interface HouseHeadResponse {
  id: string;
  firstName: string;
  lastName: string;
}

export interface HouseResponse {
  id: string;
  name: string;
  houseColours: string;
  founder: string;
  animal: string;
  element: string;
  ghost: string;
  commonRoom: string;
  heads: HouseHeadResponse[];
  traits: HouseTraitResponse[];
}

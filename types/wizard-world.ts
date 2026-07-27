/**
 * Raw types matching the Wizard World API responses (House resource).
 * Source: https://wizard-world-api.com/
 * These are infrastructure-layer types; the domain layer (modules/{ctx}/domain)
 * may project these into cleaner entities.
 */

export interface HouseColorResponse {
  id: string;
  color: string;
}

export interface HouseTraitResponse {
  id: string;
  name: string;
}

export interface HouseMemberResponse {
  id: string;
  firstName: string;
  lastName: string;
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
  members: HouseMemberResponse[];
  colors: HouseColorResponse[];
}

import { describe, expect, it } from "vitest";
import { createGetAllHousesUseCase } from "@/modules/houses/application/get-all-houses.usecase";
import type { HousesRepository } from "@/modules/houses/domain/house-repository.port";

/**
 * TDD anchor (ADR-0012).
 * Started with the degenerate case (Uncle Bob): empty repository → empty result.
 * The test also documents the application-layer contract.
 */
function makeStubRepo(overrides: Partial<HousesRepository> = {}): HousesRepository {
  return {
    findAll: async () => [],
    findById: async () => null,
    ...overrides,
  };
}

describe("getAllHouses use case", () => {
  it("returns an empty array when the repository has no houses (degenerate case)", async () => {
    const repo = makeStubRepo();
    const getAllHouses = createGetAllHousesUseCase(repo);

    const result = await getAllHouses();

    expect(result).toEqual([]);
  });

  it("forwards the repository result unchanged", async () => {
    const repo = makeStubRepo({
      findAll: async () => [
        {
          id: "gryffindor",
          name: "Gryffindor",
          houseColours: "Scarlet and Gold",
          founder: "Godric Gryffindor",
          animal: "Lion",
          element: "Fire",
          ghost: "Nearly Headless Nick",
          commonRoom: "Gryffindor Common Room",
          traitNames: ["Bravery"],
          memberCount: 0,
          headNames: [],
          colorValues: [],
        },
      ],
    });
    const getAllHouses = createGetAllHousesUseCase(repo);

    const result = await getAllHouses();

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Gryffindor");
  });
});

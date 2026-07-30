import { describe, expect, it } from "vitest";
import { createGetAllWizardsUseCase } from "@/modules/wizards/application/get-all-wizards.usecase";
import type { WizardsRepository } from "@/modules/wizards/domain/wizards-repository.port";
import type { Wizard } from "@/modules/wizards/domain/wizard";

function makeStubRepo(overrides: Partial<WizardsRepository> = {}): WizardsRepository {
  return {
    findAll: async () => [],
    ...overrides,
  };
}

function makeWizard(overrides: Partial<Wizard> = {}): Wizard {
  return { id: "w1", displayName: "Fred Weasley", ...overrides };
}

describe("getAllWizards use case", () => {
  it("returns an empty array when the repository has no wizards (degenerate case)", async () => {
    const getAllWizards = createGetAllWizardsUseCase(makeStubRepo());

    const result = await getAllWizards();

    expect(result).toEqual([]);
  });

  it("forwards the repository result unchanged", async () => {
    const getAllWizards = createGetAllWizardsUseCase(
      makeStubRepo({ findAll: async () => [makeWizard(), makeWizard({ id: "w2", displayName: null })] }),
    );

    const result = await getAllWizards();

    expect(result).toHaveLength(2);
    expect(result[1]?.displayName).toBeNull();
  });
});

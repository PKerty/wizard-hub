import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  wizardWorldFetch,
  wizardWorldFetchSafe,
  WizardWorldApiError,
} from "./wizard-world.client";

function okResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function badResponse(status = 503, statusText = "Service Unavailable"): Response {
  return { ok: false, status, statusText, json: async () => ({}) } as Response;
}

describe("wizardWorldFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns parsed JSON when the response is ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(okResponse([{ id: "1" }]));

    const result = await wizardWorldFetch<Array<{ id: string }>>("/Houses");

    expect(result).toEqual([{ id: "1" }]);
  });

  it("throws WizardWorldApiError when the response is not ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(badResponse(500));

    await expect(wizardWorldFetch("/Houses")).rejects.toMatchObject({
      name: "WizardWorldApiError",
      status: 500,
    });
  });
});

describe("wizardWorldFetchSafe", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on success (degenerate happy path)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(okResponse([]));

    const result = await wizardWorldFetchSafe("/Elixirs", { fallback: [], context: "potions/x" });

    expect(result).toEqual([]);
  });

  it("returns fallback and warns on API error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(badResponse(503));

    const result = await wizardWorldFetchSafe<number[]>("/Houses", {
      fallback: [1, 2],
      context: "houses/findAll",
    });

    expect(result).toEqual([1, 2]);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("[houses/findAll] API error"));
  });

  it("returns fallback and warns on network error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError("fetch failed"));

    const result = await wizardWorldFetchSafe<null>("/Houses/abc", {
      fallback: null,
      context: "houses/findById",
    });

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("[houses/findById] network error"),
      expect.any(TypeError),
    );
  });

  it("forwards revalidate and tags to the underlying fetch", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(okResponse([]));

    await wizardWorldFetchSafe("/Elixirs", {
      fallback: [],
      context: "potions/findAll",
      revalidate: 86400,
      tags: ["potions"],
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ next: { revalidate: 86400, tags: ["potions"] } }),
    );
  });

  it("propagates the WizardWorldApiError type from the primitive", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(badResponse(404, "Not Found"));

    await expect(wizardWorldFetch("/Elixirs/missing")).rejects.toBeInstanceOf(WizardWorldApiError);
  });
});

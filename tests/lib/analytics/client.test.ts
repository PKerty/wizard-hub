import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@amplitude/unified", () => ({
  initAll: vi.fn(),
  track: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  setUserId: vi.fn(),
  Identify: class {
    private map = new Map<string, unknown>();
    set(k: string, v: unknown) {
      this.map.set(k, v);
      return this;
    }
  },
}));

vi.mock("@/lib/config/env", () => ({
  env: {
    amplitude: {
      apiKey: "test-key",
      enabled: true,
      sessionReplayEnabled: false,
    },
  },
}));

import * as amplitude from "@amplitude/unified";
import { trackRawEvent, initAnalytics } from "@/lib/analytics/client";
import { __resetPlatformCacheForTests } from "@/lib/analytics/platform";

type TrackCall = [name: string, payload: Record<string, unknown>];

function trackCalls(): TrackCall[] {
  return (amplitude.track as unknown as { mock: { calls: TrackCall[] } }).mock
    .calls;
}

function lastTrackCall(): TrackCall {
  const calls = trackCalls();
  return calls[calls.length - 1] as TrackCall;
}

describe("trackRawEvent — ADR-0019 platform injection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetPlatformCacheForTests();
    initAnalytics();
  });

  afterEach(() => {
    __resetPlatformCacheForTests();
    vi.unstubAllGlobals();
  });

  it("attaches platform=web-mobile when UA is a phone", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15",
    });
    vi.stubGlobal("window", { innerWidth: 390 });

    trackRawEvent("House Viewed", {
      houseId: "gryffindor-id",
      houseName: "Gryffindor",
      houseFounder: "Godric Gryffindor",
      source: "list",
    });

    expect(amplitude.track).toHaveBeenCalledOnce();
    const [, payload] = lastTrackCall();
    expect(payload).toMatchObject({
      houseId: "gryffindor-id",
      platform: "web-mobile",
    });
  });

  it("omits platform when navigator is unavailable (SSR)", () => {
    vi.stubGlobal("navigator", undefined);

    trackRawEvent("Theme Toggled", { newTheme: "dark" });

    const [, payload] = lastTrackCall();
    expect(payload).toEqual({ newTheme: "dark" });
    expect(payload).not.toHaveProperty("platform");
  });

  it("memoizes: second track reuses cached platform without re-reading navigator", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15",
    });
    vi.stubGlobal("window", { innerWidth: 1440 });

    trackRawEvent("House Card Clicked", {
      houseId: "x",
      houseName: "X",
      source: "home",
    });

    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15",
    });

    trackRawEvent("Back To Houses Clicked", { fromHouseId: "x" });

    const [, secondPayload] = lastTrackCall();
    expect(secondPayload.platform).toBe("web-desktop");
  });
});

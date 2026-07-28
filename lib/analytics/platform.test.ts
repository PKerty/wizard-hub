import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  detectPlatform,
  computePlatform,
  __resetPlatformCacheForTests,
} from "./platform";

describe("detectPlatform (pure logic)", () => {
  describe("degenerate: SSR / unknown", () => {
    it("returns null when userAgent is empty string", () => {
      expect(detectPlatform("", 1280)).toBe("web-desktop");
    });
  });

  describe("mobile", () => {
    it.each([
      ["iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15", 390],
      ["Android Mobile", "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Mobile", 412],
      ["generic Mobi", "Mozilla/5.0 (SymbianOS/9.4; U; Mobi) Safari", 360],
    ])("returns web-mobile for %s", (_label, ua, width) => {
      expect(detectPlatform(ua, width)).toBe("web-mobile");
    });
  });

  describe("tablet", () => {
    it.each([
      ["iPad", "Mozilla/5.0 (iPad; CPU OS 17_0) AppleWebKit/605.1.15", 820],
      ["Android tablet (no Mobile keyword)", "Mozilla/5.0 (Linux; Android 12; SM-X906) AppleWebKit/537.36", 1280],
      ["Kindle", "Mozilla/5.0 (Linux; Android 9; Kindle) AppleWebKit/537.36", 960],
    ])("returns web-tablet for %s", (_label, ua, width) => {
      expect(detectPlatform(ua, width)).toBe("web-tablet");
    });
  });

  describe("desktop", () => {
    it.each([
      ["Windows Chrome", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0", 1920],
      ["macOS Safari", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15", 1440],
      ["Linux Firefox", "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0", 1536],
    ])("returns web-desktop for %s", (_label, ua, width) => {
      expect(detectPlatform(ua, width)).toBe("web-desktop");
    });
  });

  describe("edge cases", () => {
    it("Android tablet with 'Mobile Safari' suffix still classifies as mobile (UA has 'Mobile')", () => {
      const ua =
        "Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
      expect(detectPlatform(ua, 1280)).toBe("web-mobile");
    });

    it("wide viewport with phone UA still classifies as mobile (UA takes precedence over width)", () => {
      const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15";
      expect(detectPlatform(ua, 1200)).toBe("web-mobile");
    });
  });
});

describe("computePlatform (runtime + memoization + SSR safety)", () => {
  beforeEach(() => {
    __resetPlatformCacheForTests();
  });

  afterEach(() => {
    __resetPlatformCacheForTests();
    vi.unstubAllGlobals();
  });

  it("returns null in SSR (no navigator)", () => {
    vi.stubGlobal("navigator", undefined);
    expect(computePlatform()).toBeNull();
  });

  it("memoizes the result after first call", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15",
    });
    vi.stubGlobal("window", { innerWidth: 390 });

    const first = computePlatform();
    expect(first).toBe("web-mobile");

    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15",
    });

    const second = computePlatform();
    expect(second).toBe("web-mobile");
  });
});

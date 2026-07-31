import * as amplitude from "@amplitude/unified";
import type { EventCatalog } from "./events";
import { env } from "@/lib/config/env";

let initialized = false;

/**
 * User property values allowed by Amplitude's Identify API.
 * Keep narrow to catch programming errors at compile time.
 */
export type UserPropertyValue = string | number | boolean;
export type UserProperties = Record<string, UserPropertyValue>;

/**
 * Initialize Amplitude (analytics + optionally session replay).
 * Idempotent: safe to call multiple times (advanced-init-once pattern).
 * Respects `NEXT_PUBLIC_AMPLITUDE_ENABLED=false` (CI/tests/local without a key).
 *
 * Uses `initAll` from @amplitude/unified (ADR-0017) which initializes analytics
 * and session replay in one call. Session replay is opt-in via env var because
 * it's a paid feature and we don't want it recording by default.
 */
export function initAnalytics(): void {
  if (initialized) return;
  if (!env.amplitude.enabled) return;
  if (!env.amplitude.apiKey) return;

  void amplitude.initAll(env.amplitude.apiKey, {
    analytics: {
      defaultTracking: {
        pageViews: true,
        sessions: true,
        formInteractions: false,
        fileDownloads: false,
      },
    },
    ...(env.amplitude.sessionReplayEnabled
      ? { sessionReplay: { sampleRate: 1 } }
      : {}),
  });

  initialized = true;
}

export function setUserId(userId: string | null): void {
  if (!initialized) return;
  amplitude.setUserId(userId ?? undefined);
}

/**
 * Logs out: clears userId and regenerates the device id in one call.
 * Unified SDK exposes this as `reset()` (not separate `regenerateDeviceId`).
 */
export function resetIdentity(): void {
  if (!initialized) return;
  amplitude.reset();
}

export function sendEvent<N extends keyof EventCatalog>(
  name: N,
  properties: EventCatalog[N],
): void {
  if (!initialized) return;

  // Device/platform breakdown is left to Amplitude's auto device properties
  // (Device Type / Device Category, derived server-side from the UA) — see
  // ADR-0031 (supersedes ADR-0019). KISS: don't reinvent UA classification.
  amplitude.track(name, properties);
}

/**
 * Lightweight wrapper around `amplitude.identify()` to set user properties.
 * Used by the "Join fanclub" flow (ADR-0008).
 */
export function identifyUserProperties(properties: UserProperties): void {
  if (!initialized) return;
  const identify = new amplitude.Identify();
  for (const [key, value] of Object.entries(properties)) {
    identify.set(key, value);
  }
  amplitude.identify(identify);
}

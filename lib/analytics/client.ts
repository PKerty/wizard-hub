import * as amplitude from "@amplitude/analytics-browser";
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
 * Initialize the Amplitude SDK.
 * Safe to call multiple times — subsequent calls are no-ops (advanced-init-once pattern).
 * Respects `NEXT_PUBLIC_AMPLITUDE_ENABLED=false` (CI/tests/local without a key).
 */
export function initAnalytics(): void {
  if (initialized) return;
  if (!env.amplitude.enabled) return;
  if (!env.amplitude.apiKey) return;

  amplitude.init(env.amplitude.apiKey, {
    defaultTracking: {
      pageViews: true,
      sessions: true,
      formInteractions: false,
      fileDownloads: false,
    },
  });
  initialized = true;
}

export function setUserId(userId: string | null): void {
  if (!initialized) return;
  amplitude.setUserId(userId ?? undefined);
}

/**
 * Logs out: clears userId and regenerates the device id in one call.
 * Browser SDK 2.x exposes this as `reset()` (not separate `regenerateDeviceId`).
 */
export function resetIdentity(): void {
  if (!initialized) return;
  amplitude.reset();
}

export function trackRawEvent<N extends keyof EventCatalog>(
  name: N,
  properties: EventCatalog[N],
): void {
  if (!initialized) return;
  amplitude.track(name, properties as unknown as Record<string, unknown>);
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

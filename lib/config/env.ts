/**
 * Typed access to environment variables.
 *
 * IMPORTANT (Next.js): all NEXT_PUBLIC_* reads must be via LITERAL property
 * access (e.g. `process.env.NEXT_PUBLIC_FOO`), not dynamic keys like
 * `process.env[key]`. Next.js statically inlines NEXT_PUBLIC_ values into the
 * client bundle at compile time; dynamic access cannot be inlined and resolves
 * to `undefined` in the browser.
 * https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 *
 * Empty values are allowed (build/CI without a key): the analytics wrapper's
 * initAnalytics() aborts cleanly on empty, so missing vars degrade to
 * "no tracking" instead of breaking the build.
 */

export const env = {
  amplitude: {
    apiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? "",
    enabled: process.env.NEXT_PUBLIC_AMPLITUDE_ENABLED !== "false",
    /** Session Replay is a paid Amplitude feature — opt-in only (ADR-0017). */
    sessionReplayEnabled: process.env.NEXT_PUBLIC_AMPLITUDE_SESSION_REPLAY === "true",
  },
  wizardWorld: {
    baseUrl: process.env.WIZARD_WORLD_API_BASE_URL ?? "https://wizard-world-api.com/api",
  },
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;

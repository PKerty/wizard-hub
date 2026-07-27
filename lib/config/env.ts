/**
 * Typed access to environment variables.
 * Throw early at module load if a required var is missing in production.
 */

const isProd = process.env.NODE_ENV === "production";

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    if (isProd) {
      throw new Error(`[env] Missing required env var: ${key}`);
    }
    return "";
  }
  return value;
}

export const env = {
  amplitude: {
    apiKey: required("NEXT_PUBLIC_AMPLITUDE_API_KEY"),
    enabled: process.env.NEXT_PUBLIC_AMPLITUDE_ENABLED !== "false",
    /** Session Replay is a paid Amplitude feature — opt-in only (ADR-0017). */
    sessionReplayEnabled: process.env.NEXT_PUBLIC_AMPLITUDE_SESSION_REPLAY === "true",
  },
  wizardWorld: {
    baseUrl: process.env.WIZARD_WORLD_API_BASE_URL ?? "https://wizard-world-api.com/api",
  },
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;

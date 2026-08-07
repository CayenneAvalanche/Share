/**
 * Demo vs beta:
 * - demo: seed data, friend tours, reset button
 * - beta: empty marketplace, real Neon applications
 *
 * Override with VITE_APP_MODE=demo|beta
 * Hostnames: demo.* → demo; share.myendeavors.me (prod) → beta
 */
export type AppMode = "demo" | "beta";

export function getAppMode(): AppMode {
  const env = (import.meta as ImportMeta & { env: Record<string, string> }).env
    ?.VITE_APP_MODE;
  if (env === "demo" || env === "beta") return env;

  if (typeof window !== "undefined") {
    const h = window.location.hostname.toLowerCase();
    if (
      h === "demo.share.myendeavors.me" ||
      h.startsWith("demo.") ||
      h.startsWith("demo-") ||
      h.includes("demo.share") ||
      h === "localhost" ||
      h === "127.0.0.1"
    ) {
      // localhost stays demo for friend tours in sandbox
      if (h === "localhost" || h === "127.0.0.1") return "demo";
      return "demo";
    }
    if (h === "share.myendeavors.me" || h.endsWith(".netlify.app")) {
      return "beta";
    }
  }

  // SSR / unknown: prefer beta when building for production
  return import.meta.env.PROD ? "beta" : "demo";
}

export function isDemoMode(): boolean {
  return getAppMode() === "demo";
}

export function isBetaMode(): boolean {
  return getAppMode() === "beta";
}

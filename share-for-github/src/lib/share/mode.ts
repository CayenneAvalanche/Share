/**
 * Demo vs beta:
 * - demo: seed data, friend tours, reset button
 * - beta: empty marketplace, real Neon applications
 *
 * Override with VITE_APP_MODE=demo|beta
 * Hostnames: demo.* → demo; share.myendeavors.me (prod) → beta
 * Query: ?mode=demo or ?mode=beta (sticky in localStorage until cleared)
 */
export type AppMode = "demo" | "beta";

const FORCE_MODE_KEY = "share-force-mode";

export function getAppMode(): AppMode {
  const env = (import.meta as ImportMeta & { env: Record<string, string> }).env
    ?.VITE_APP_MODE;
  if (env === "demo" || env === "beta") return env;

  if (typeof window !== "undefined") {
    try {
      const q = new URLSearchParams(window.location.search).get("mode");
      if (q === "demo" || q === "beta") {
        localStorage.setItem(FORCE_MODE_KEY, q);
        return q;
      }
      const forced = localStorage.getItem(FORCE_MODE_KEY);
      if (forced === "demo" || forced === "beta") return forced;
    } catch {
      /* private mode */
    }

    const h = window.location.hostname.toLowerCase();
    if (
      h === "demo.share.myendeavors.me" ||
      h.startsWith("demo.") ||
      h.startsWith("demo-") ||
      h.includes("demo.share") ||
      h === "localhost" ||
      h === "127.0.0.1"
    ) {
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

/** Clear sticky ?mode= override (back to hostname default). */
export function clearForcedMode() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(FORCE_MODE_KEY);
  } catch {
    /* ignore */
  }
}

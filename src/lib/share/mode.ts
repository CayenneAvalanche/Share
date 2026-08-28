/**
 * Demo vs beta:
 * - demo: seed data, friend tours, reset button
 * - beta: empty marketplace, real Neon applications (public live)
 *
 * Production share.myendeavors.me is ALWAYS beta (sticky overrides ignored).
 * Override only on non-production hosts: ?mode=demo|beta (sticky in localStorage)
 * Env: VITE_APP_MODE=demo|beta
 */
export type AppMode = "demo" | "beta";

const FORCE_MODE_KEY = "share-force-mode";

function isProductionHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "share.myendeavors.me" ||
    h === "www.share.myendeavors.me" ||
    // Netlify production deploys (not deploy-previews which often have --)
    (h.endsWith(".netlify.app") && !h.includes("--"))
  );
}

function isExplicitDemoHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "demo.share.myendeavors.me" ||
    h.startsWith("demo.") ||
    h.startsWith("demo-") ||
    h.includes("demo.share")
  );
}

export function getAppMode(): AppMode {
  const env = (import.meta as ImportMeta & { env: Record<string, string> }).env
    ?.VITE_APP_MODE;
  if (env === "demo" || env === "beta") return env;

  if (typeof window !== "undefined") {
    const h = window.location.hostname.toLowerCase();

    // Live public site: always beta — clear any old sticky demo flag
    if (isProductionHost(h)) {
      try {
        localStorage.removeItem(FORCE_MODE_KEY);
      } catch {
        /* ignore */
      }
      return "beta";
    }

    if (isExplicitDemoHost(h)) return "demo";

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

    // Local sandbox / localhost → demo for development tours
    if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".grok-sandbox.com")) {
      return "demo";
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

/** Force beta and wipe sticky override (public debut). */
export function forceBetaMode() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FORCE_MODE_KEY, "beta");
  } catch {
    /* ignore */
  }
}

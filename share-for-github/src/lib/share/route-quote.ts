/** Driving route + base fare quote. No surge. */

import {
  computeTaxiFare,
  SHARE_TAXI_RATES,
  type TaxiFare,
} from "@/lib/share/fare";
import { searchStreetAddressesFn } from "@/lib/share/server-fns";

const PHOTON = "https://photon.komoot.io/api/";
const OSRM = "https://router.project-osrm.org/route/v1/driving";
const BIAS = { lat: 30.2241, lon: -92.0198 };

export type GeoPoint = { lat: number; lng: number; label: string };

export type RouteQuote = {
  from: GeoPoint;
  to: GeoPoint;
  miles: number;
  seconds: number;
  routeCount: number;
  fare: TaxiFare;
  /** Flag + miles only (no per-minute). Still respects min fare. */
  distanceOnly: TaxiFare;
  rates: typeof SHARE_TAXI_RATES;
};

function formatPhoton(props: Record<string, unknown>): string {
  const name = String(props.name ?? "").trim();
  const num = String(props.housenumber ?? "").trim();
  const street = String(props.street ?? "").trim();
  const city = String(props.city ?? props.locality ?? props.county ?? "").trim();
  const state = String(props.state ?? "").trim();
  const postcode = String(props.postcode ?? "").trim();
  const line1 = [num, street || name].filter(Boolean).join(" ").trim();
  const cityLine = [city, state, postcode].filter(Boolean).join(", ");
  return [line1 || name, cityLine].filter(Boolean).join(", ");
}

export async function geocodeAddress(q: string): Promise<GeoPoint> {
  const query = q.trim();
  if (query.length < 3) throw new Error("Type a fuller address");
  const hasHouse = /^\d+/.test(query);
  if (hasHouse) {
    try {
      const nomi = await searchStreetAddressesFn({ data: { q: query } });
      const hit = nomi.items[0];
      if (hit) return { lat: hit.lat, lng: hit.lng, label: hit.label };
    } catch {
      /* fall through to Photon */
    }
  }
  const params = new URLSearchParams({
    q: query,
    lat: String(BIAS.lat),
    lon: String(BIAS.lon),
    limit: "1",
    lang: "en",
  });
  const res = await fetch(`${PHOTON}?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Could not look up that address");
  const data = (await res.json()) as {
    features?: {
      properties?: Record<string, unknown>;
      geometry?: { coordinates?: number[] };
    }[];
  };
  const f = data.features?.[0];
  const coords = f?.geometry?.coordinates;
  if (!f || !coords || coords.length < 2) {
    throw new Error(`No match for “${query}”`);
  }
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`No match for “${query}”`);
  }
  return {
    lat,
    lng,
    label: formatPhoton(f.properties ?? {}) || query,
  };
}

type OsrmRoute = { distance: number; duration: number };

async function fetchDrivingRoutes(
  from: GeoPoint,
  to: GeoPoint,
): Promise<OsrmRoute[]> {
  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM}/${path}?overview=false&alternatives=true`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Route lookup failed");
  const data = (await res.json()) as { code?: string; routes?: OsrmRoute[] };
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("No driving route between those addresses");
  }
  return data.routes.filter(
    (r) => Number.isFinite(r.distance) && Number.isFinite(r.duration),
  );
}

function roadFallback(from: GeoPoint, to: GeoPoint): OsrmRoute {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const crow = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  // Typical urban roads are ~1.3× straight-line; ~22 mph average.
  const miles = Math.max(0.2, crow * 1.3);
  const hours = miles / 22;
  return { distance: miles * 1609.344, duration: hours * 3600 };
}

export async function quoteRoute(opts: {
  from: string | GeoPoint;
  to: string | GeoPoint;
}): Promise<RouteQuote> {
  const from =
    typeof opts.from === "string" ? await geocodeAddress(opts.from) : opts.from;
  const to =
    typeof opts.to === "string" ? await geocodeAddress(opts.to) : opts.to;

  let routes: OsrmRoute[] = [];
  try {
    routes = await fetchDrivingRoutes(from, to);
  } catch {
    routes = [roadFallback(from, to)];
  }
  if (!routes.length) routes = [roadFallback(from, to)];

  const avgMeters =
    routes.reduce((s, r) => s + r.distance, 0) / routes.length;
  const avgSeconds =
    routes.reduce((s, r) => s + r.duration, 0) / routes.length;
  const miles = Math.round((avgMeters / 1609.344) * 100) / 100;
  const seconds = Math.round(avgSeconds);

  return {
    from,
    to,
    miles,
    seconds,
    routeCount: routes.length,
    fare: computeTaxiFare(miles, seconds),
    distanceOnly: computeTaxiFare(miles, 0),
    rates: SHARE_TAXI_RATES,
  };
}

export function formatDriveTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m < 1) return "< 1 min";
  return `${m} min`;
}

/**
 * Lightweight city geocoding + radius helpers (no API key).
 * Uses a hub dictionary + state centroids for freeform "City, ST" strings.
 */

export type LatLng = { lat: number; lng: number };

/** Named hubs used across Share (pilot + expansion). */
const CITY_COORDS: Record<string, LatLng> = {
  // Louisiana
  "lafayette, la": { lat: 30.2241, lng: -92.0198 },
  "baton rouge, la": { lat: 30.4515, lng: -91.1871 },
  "new orleans, la": { lat: 29.9511, lng: -90.0715 },
  "shreveport, la": { lat: 32.5252, lng: -93.7502 },
  "lake charles, la": { lat: 30.2266, lng: -93.2174 },
  "monroe, la": { lat: 32.5093, lng: -92.1193 },
  "alexandria, la": { lat: 31.3113, lng: -92.4451 },
  "houma, la": { lat: 29.5958, lng: -90.7195 },
  "new iberia, la": { lat: 30.0035, lng: -91.8187 },
  "opelousas, la": { lat: 30.5335, lng: -92.0815 },
  "broussard, la": { lat: 30.1471, lng: -91.9612 },
  "youngsville, la": { lat: 30.0996, lng: -91.9901 },
  // Texas
  "houston, tx": { lat: 29.7604, lng: -95.3698 },
  "dallas, tx": { lat: 32.7767, lng: -96.797 },
  "fort worth, tx": { lat: 32.7555, lng: -97.3308 },
  "austin, tx": { lat: 30.2672, lng: -97.7431 },
  "san antonio, tx": { lat: 29.4241, lng: -98.4936 },
  "corpus christi, tx": { lat: 27.8006, lng: -97.3964 },
  "beaumont, tx": { lat: 30.0802, lng: -94.1266 },
  "galveston, tx": { lat: 29.3013, lng: -94.7977 },
  "el paso, tx": { lat: 31.7619, lng: -106.485 },
  // Midwest / KC metro (MO + KS)
  "kansas city, mo": { lat: 39.0997, lng: -94.5786 },
  "kansas city, ks": { lat: 39.1141, lng: -94.6275 },
  "overland park, ks": { lat: 38.9822, lng: -94.6708 },
  "omaha, ne": { lat: 41.2565, lng: -95.9345 },
  "des moines, ia": { lat: 41.5868, lng: -93.625 },
  "minneapolis, mn": { lat: 44.9778, lng: -93.265 },
  "fargo, nd": { lat: 46.8772, lng: -96.7898 },
  "bismarck, nd": { lat: 46.8083, lng: -100.7837 },
  "sioux falls, sd": { lat: 43.5446, lng: -96.7311 },
  // Nevada / west
  "las vegas, nv": { lat: 36.1699, lng: -115.1398 },
  "henderson, nv": { lat: 36.0395, lng: -114.9817 },
  "reno, nv": { lat: 39.5296, lng: -119.8138 },
  "phoenix, az": { lat: 33.4484, lng: -112.074 },
  "denver, co": { lat: 39.7392, lng: -104.9903 },
  // South / east
  "jackson, ms": { lat: 32.2988, lng: -90.1848 },
  "mobile, al": { lat: 30.6954, lng: -88.0399 },
  "atlanta, ga": { lat: 33.749, lng: -84.388 },
  "nashville, tn": { lat: 36.1627, lng: -86.7816 },
  "memphis, tn": { lat: 35.1495, lng: -90.049 },
  "little rock, ar": { lat: 34.7465, lng: -92.2896 },
  "oklahoma city, ok": { lat: 35.4676, lng: -97.5164 },
  "tulsa, ok": { lat: 36.154, lng: -95.9928 },
  // Florida / coasts
  "miami, fl": { lat: 25.7617, lng: -80.1918 },
  "tampa, fl": { lat: 27.9506, lng: -82.4572 },
  "orlando, fl": { lat: 28.5383, lng: -81.3792 },
  // Big metros
  "chicago, il": { lat: 41.8781, lng: -87.6298 },
  "new york, ny": { lat: 40.7128, lng: -74.006 },
  "los angeles, ca": { lat: 34.0522, lng: -118.2437 },
  "san francisco, ca": { lat: 37.7749, lng: -122.4194 },
  "seattle, wa": { lat: 47.6062, lng: -122.3321 },
};

/** Rough state centroids — last-resort when city unknown */
const STATE_COORDS: Record<string, LatLng> = {
  al: { lat: 32.8067, lng: -86.7911 },
  ar: { lat: 34.9697, lng: -92.3731 },
  az: { lat: 33.7298, lng: -111.4312 },
  ca: { lat: 36.1162, lng: -119.6816 },
  co: { lat: 39.0598, lng: -105.3111 },
  fl: { lat: 27.7663, lng: -81.6868 },
  ga: { lat: 33.0406, lng: -83.6431 },
  ia: { lat: 42.0115, lng: -93.2105 },
  il: { lat: 40.3495, lng: -88.9861 },
  ks: { lat: 38.5266, lng: -96.7265 },
  ky: { lat: 37.6681, lng: -84.6701 },
  la: { lat: 31.1695, lng: -91.8678 },
  mn: { lat: 45.6945, lng: -93.9002 },
  mo: { lat: 38.4561, lng: -92.2884 },
  ms: { lat: 32.7416, lng: -89.6787 },
  nd: { lat: 47.5289, lng: -99.784 },
  ne: { lat: 41.1254, lng: -98.2681 },
  nm: { lat: 34.8405, lng: -106.2485 },
  nv: { lat: 38.3135, lng: -117.0554 },
  ny: { lat: 42.1657, lng: -74.9481 },
  ok: { lat: 35.5653, lng: -96.9289 },
  sd: { lat: 44.2998, lng: -99.4388 },
  tn: { lat: 35.7478, lng: -86.6923 },
  tx: { lat: 31.0545, lng: -97.5635 },
  wa: { lat: 47.4009, lng: -121.4905 },
};

const STORAGE_CITY = "share-search-city";
const STORAGE_RADIUS = "share-search-radius";

export const DEFAULT_SEARCH_CITY = "Lafayette, LA";

export const RADIUS_OPTIONS_LOCAL = [
  { value: 25, label: "25 mi" },
  { value: 50, label: "50 mi" },
  { value: 75, label: "75 mi" },
  { value: 100, label: "100 mi" },
  { value: 150, label: "150 mi" },
  { value: 250, label: "250 mi" },
] as const;

/** Marketplace / homemade — stay neighborhood-ish */
export const DEFAULT_RADIUS_MARKETPLACE = 75;
/** Peer car rentals — metro + nearby (KCMO ↔ KCKS) */
export const DEFAULT_RADIUS_CARS = 50;
/**
 * Corridor rides: show trips if user is within this of from/to,
 * or within CORRIDOR_PATH_MILES of the drive path (Houston sees LA→Corpus).
 */
export const DEFAULT_RADIUS_RIDE_HUB = 150;
export const DEFAULT_RADIUS_RIDE_PATH = 90;

export function normalizeCityKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\./g, "");
}

/** Extract "City, ST" style bits from freeform addresses */
export function extractCityState(input: string): string {
  const raw = input.trim();
  if (!raw) return "";
  // Prefer trailing "City, ST" or "City, State"
  const m = raw.match(
    /([A-Za-z .'-]+),\s*([A-Z]{2})\b(?:\s+\d{5})?(?:\s*,?\s*USA?)?$/i,
  );
  if (m) {
    return `${m[1]!.trim()}, ${m[2]!.toUpperCase()}`;
  }
  // "City ST"
  const m2 = raw.match(/([A-Za-z .'-]+)\s+([A-Z]{2})\b/i);
  if (m2) return `${m2[1]!.trim()}, ${m2[2]!.toUpperCase()}`;
  return raw;
}

export function geocodePlace(input: string): LatLng | null {
  if (!input?.trim()) return null;
  const citySt = extractCityState(input);
  const key = normalizeCityKey(citySt);
  if (CITY_COORDS[key]) return CITY_COORDS[key]!;

  // Try without state
  const cityOnly = key.split(",")[0]?.trim() || key;
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (k.startsWith(cityOnly + ",") || k === cityOnly) return v;
  }

  // Partial contains (e.g. "Walmart … Lafayette")
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    const name = k.split(",")[0] || k;
    if (name.length >= 5 && key.includes(name)) return v;
  }

  // State only fallback
  const st = key.match(/,\s*([a-z]{2})\s*$/)?.[1];
  if (st && STATE_COORDS[st]) return STATE_COORDS[st]!;

  return null;
}

export function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Shortest distance from point P to segment A→B (miles, great-circle approx). */
export function distanceToSegmentMiles(
  p: LatLng,
  a: LatLng,
  b: LatLng,
): number {
  // Project onto chord in equirectangular local plane (ok for <1500 mi segments)
  const midLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const x = (lng: number) => lng * Math.cos(midLat);
  const ax = x(a.lng);
  const ay = a.lat;
  const bx = x(b.lng);
  const by = b.lat;
  const px = x(p.lng);
  const py = p.lat;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return haversineMiles(p, a);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const proj: LatLng = {
    lat: ay + t * dy,
    lng: (ax + t * dx) / Math.cos(midLat),
  };
  return haversineMiles(p, proj);
}

export function formatMiles(mi: number | null | undefined): string {
  if (mi == null || !Number.isFinite(mi)) return "";
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

export function loadSearchCity(): string {
  try {
    const v = localStorage.getItem(STORAGE_CITY);
    if (v && v.trim().length >= 2) return v.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_SEARCH_CITY;
}

export function saveSearchCity(city: string) {
  try {
    localStorage.setItem(STORAGE_CITY, city.trim());
  } catch {
    /* ignore */
  }
}

export function loadSearchRadius(fallback: number): number {
  try {
    const v = Number(localStorage.getItem(STORAGE_RADIUS));
    if (Number.isFinite(v) && v >= 10 && v <= 2000) return v;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function saveSearchRadius(mi: number) {
  try {
    localStorage.setItem(STORAGE_RADIUS, String(mi));
  } catch {
    /* ignore */
  }
}

export type WithDistance<T> = T & { distanceMiles: number | null };

/**
 * Local marketplace / cars: keep items within radius of search city, nearest first.
 * Items we can't geocode go to the end (not hidden) so nothing is lost.
 */
export function filterSortByRadius<T>(
  items: T[],
  getCity: (item: T) => string,
  searchCity: string,
  radiusMiles: number,
  opts?: { hideUnknown?: boolean },
): WithDistance<T>[] {
  const origin = geocodePlace(searchCity);
  const mapped: WithDistance<T>[] = items.map((item) => {
    const place = getCity(item);
    const loc = geocodePlace(place);
    if (!origin || !loc) {
      return { ...item, distanceMiles: null };
    }
    return { ...item, distanceMiles: haversineMiles(origin, loc) };
  });

  return mapped
    .filter((item) => {
      if (item.distanceMiles == null) return !opts?.hideUnknown;
      return item.distanceMiles <= radiusMiles;
    })
    .sort((a, b) => {
      const da = a.distanceMiles ?? 1e9;
      const db = b.distanceMiles ?? 1e9;
      return da - db;
    });
}

export type CorridorScore = {
  distanceMiles: number;
  reason: "near_from" | "near_to" | "along_path" | "far";
};

/**
 * Corridor / long-distance rides:
 * - Near origin or destination → show
 * - Along the drive path (e.g. Houston on LA→Corpus) → show
 * - Far from both ends and the path → hide
 */
export function scoreCorridorTrip(
  searchCity: string,
  fromPlace: string,
  toPlace: string,
  hubMiles = DEFAULT_RADIUS_RIDE_HUB,
  pathMiles = DEFAULT_RADIUS_RIDE_PATH,
): CorridorScore {
  const origin = geocodePlace(searchCity);
  const from = geocodePlace(fromPlace);
  const to = geocodePlace(toPlace);
  if (!origin) {
    return { distanceMiles: 0, reason: "near_from" };
  }
  if (!from || !to) {
    // Can't geocode trip — keep it (don't hide pilot posts)
    return { distanceMiles: 999, reason: "far" };
  }
  const dFrom = haversineMiles(origin, from);
  const dTo = haversineMiles(origin, to);
  if (dFrom <= hubMiles) {
    return { distanceMiles: dFrom, reason: "near_from" };
  }
  if (dTo <= hubMiles) {
    return { distanceMiles: dTo, reason: "near_to" };
  }
  const dPath = distanceToSegmentMiles(origin, from, to);
  if (dPath <= pathMiles) {
    return { distanceMiles: dPath, reason: "along_path" };
  }
  return {
    distanceMiles: Math.min(dFrom, dTo, dPath),
    reason: "far",
  };
}

export function filterSortCorridors<T>(
  items: T[],
  getFrom: (item: T) => string,
  getTo: (item: T) => string,
  searchCity: string,
  hubMiles = DEFAULT_RADIUS_RIDE_HUB,
  pathMiles = DEFAULT_RADIUS_RIDE_PATH,
): (T & { distanceMiles: number; corridorReason: CorridorScore["reason"] })[] {
  return items
    .map((item) => {
      const s = scoreCorridorTrip(
        searchCity,
        getFrom(item),
        getTo(item),
        hubMiles,
        pathMiles,
      );
      return {
        ...item,
        distanceMiles: s.distanceMiles,
        corridorReason: s.reason,
      };
    })
    .filter((item) => item.corridorReason !== "far")
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

export const SUGGESTED_SEARCH_CITIES = [
  "Lafayette, LA",
  "Baton Rouge, LA",
  "New Orleans, LA",
  "Shreveport, LA",
  "Houston, TX",
  "Dallas, TX",
  "Austin, TX",
  "Corpus Christi, TX",
  "Kansas City, MO",
  "Kansas City, KS",
  "Las Vegas, NV",
  "Fargo, ND",
] as const;

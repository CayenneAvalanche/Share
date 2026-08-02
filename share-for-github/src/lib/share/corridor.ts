import type { DeliveryRequest, Trip } from "./data";

/** Ordered waypoints for common Share corridors (I-49 etc.). */
export const CORRIDOR_CHAINS: string[][] = [
  [
    "Lafayette, LA",
    "Opelousas, LA",
    "Alexandria, LA",
    "Natchitoches, LA",
    "Shreveport, LA",
  ],
  [
    "Lafayette, LA",
    "Lake Charles, LA",
    "Beaumont, TX",
    "Houston, TX",
  ],
  [
    "Lafayette, LA",
    "Baton Rouge, LA",
    "New Orleans, LA",
  ],
  [
    "Houston, TX",
    "Austin, TX",
    "Dallas, TX",
  ],
  [
    "Shreveport, LA",
    "Dallas, TX",
  ],
];

export const CORRIDOR_CITIES = Array.from(
  new Set(CORRIDOR_CHAINS.flat()),
).sort();

function cityKey(c: string) {
  return c.toLowerCase().replace(/,.*/, "").trim();
}

/** Path for a trip: origin → stops → destination (best-matching corridor fill). */
export function tripPath(trip: Pick<Trip, "from" | "to" | "stops">): string[] {
  const base = [trip.from, ...trip.stops, trip.to];
  // Expand using corridor if both ends on a known chain
  for (const chain of CORRIDOR_CHAINS) {
    const fi = chain.findIndex((c) => cityKey(c) === cityKey(trip.from));
    const ti = chain.findIndex((c) => cityKey(c) === cityKey(trip.to));
    if (fi >= 0 && ti >= 0 && fi !== ti) {
      const slice =
        fi < ti ? chain.slice(fi, ti + 1) : chain.slice(ti, fi + 1).reverse();
      // merge declared stops that aren't on chain
      const extras = trip.stops.filter(
        (s) => !slice.some((c) => cityKey(c) === cityKey(s)),
      );
      return extras.length ? [...slice.slice(0, -1), ...extras, slice.at(-1)!] : slice;
    }
  }
  return base;
}

export type CorridorMatch = {
  trip: Trip;
  /** 0–1 how far along the path the pickup is */
  pickupFraction: number;
  dropFraction: number;
  estimatedPickupAt: string;
  estimatedDropAt: string;
  detourNote: string;
  score: number;
};

/**
 * Delivery matches a trip if pickup and drop are on the driver's path
 * in order (e.g. ALEX on LFT→SHV while going to Shreveport).
 */
export function matchDeliveryToTrips(
  delivery: Pick<DeliveryRequest, "from" | "to" | "neededBy">,
  trips: Trip[],
): CorridorMatch[] {
  const out: CorridorMatch[] = [];
  const needDay = delivery.neededBy.slice(0, 10);

  for (const trip of trips) {
    const path = tripPath(trip);
    const pi = path.findIndex((c) => cityKey(c) === cityKey(delivery.from));
    const di = path.findIndex((c) => cityKey(c) === cityKey(delivery.to));
    if (pi < 0 || di < 0 || pi >= di) continue;

    const tripDay = trip.departAt.slice(0, 10);
    // same day or within ±2 days of neededBy
    const dayDiff = Math.abs(
      (new Date(tripDay).getTime() - new Date(needDay).getTime()) / 86400000,
    );
    if (dayDiff > 2) continue;

    const n = Math.max(1, path.length - 1);
    const pickupFraction = pi / n;
    const dropFraction = di / n;
    const depart = new Date(trip.departAt).getTime();
    const arrive = new Date(trip.arriveAt).getTime();
    const span = Math.max(arrive - depart, 60 * 60_000);
    const estimatedPickupAt = new Date(
      depart + span * pickupFraction,
    ).toISOString();
    const estimatedDropAt = new Date(depart + span * dropFraction).toISOString();

    const score =
      100 -
      dayDiff * 15 -
      (dropFraction - pickupFraction) * 5 +
      (tripDay === needDay ? 20 : 0);

    out.push({
      trip,
      pickupFraction,
      dropFraction,
      estimatedPickupAt,
      estimatedDropAt,
      detourNote:
        pi === 0 && di === path.length - 1
          ? "Full route — same endpoints as driver"
          : `Pickup in ${path[pi].split(",")[0]} · drop in ${path[di].split(",")[0]} along their path`,
      score,
    });
  }

  return out.sort((a, b) => b.score - a.score);
}

/** Deal price: driver offer wins if ≤ rider max bid. */
export function matchedFare(maxBid: number, offerAmount: number): number | null {
  if (offerAmount <= 0 || maxBid <= 0) return null;
  if (offerAmount > maxBid) return null;
  return offerAmount;
}

/** Taxi-style meter for in-progress Share rides. Easy to retune. */
export const SHARE_TAXI_RATES = {
  /** Flag drop when Begin ride is tapped */
  flagDrop: 2.5,
  /** Dollars per GPS mile */
  perMile: 2,
  /** Dollars per minute while the ride is live */
  perMinute: 0.35,
  /** Floor so short hops still pay something (also VIP default) */
  minFare: 5,
} as const;

export type TaxiFare = {
  miles: number;
  minutes: number;
  seconds: number;
  flagDrop: number;
  mileageCharge: number;
  timeCharge: number;
  meter: number;
};

export function milesBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.7613;
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

export function computeTaxiFare(miles: number, seconds: number): TaxiFare {
  const m = Math.max(0, miles);
  const sec = Math.max(0, seconds);
  const minutes = sec / 60;
  const mileageCharge = m * SHARE_TAXI_RATES.perMile;
  const timeCharge = minutes * SHARE_TAXI_RATES.perMinute;
  const raw =
    SHARE_TAXI_RATES.flagDrop + mileageCharge + timeCharge;
  const meter = Math.max(
    SHARE_TAXI_RATES.minFare,
    Math.round(raw * 100) / 100,
  );
  return {
    miles: Math.round(m * 100) / 100,
    minutes,
    seconds: sec,
    flagDrop: SHARE_TAXI_RATES.flagDrop,
    mileageCharge: Math.round(mileageCharge * 100) / 100,
    timeCharge: Math.round(timeCharge * 100) / 100,
    meter,
  };
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMiles(miles: number) {
  if (miles < 0.05) return "0.0 mi";
  return `${miles.toFixed(1)} mi`;
}

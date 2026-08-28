import { useEffect, useRef, useState } from "react";
import { Navigation } from "lucide-react";
import {
  computeTaxiFare,
  formatMiles,
  formatMoney,
  milesBetween,
  SHARE_TAXI_RATES,
  type TaxiFare,
} from "@/lib/share/fare";

type GpsStatus = "idle" | "waiting" | "live" | "denied" | "error";

type Persist = {
  miles: number;
  lastLat?: number;
  lastLng?: number;
};

function persistKey(rideId: string) {
  return `share-fare-v1-${rideId}`;
}

function loadPersist(rideId: string): Persist {
  try {
    const raw = sessionStorage.getItem(persistKey(rideId));
    if (!raw) return { miles: 0 };
    const p = JSON.parse(raw) as Persist;
    return {
      miles: Number(p.miles) > 0 ? Number(p.miles) : 0,
      lastLat: p.lastLat,
      lastLng: p.lastLng,
    };
  } catch {
    return { miles: 0 };
  }
}

function savePersist(rideId: string, p: Persist) {
  try {
    sessionStorage.setItem(persistKey(rideId), JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function useTaxiMeter(opts: {
  rideId: string;
  active: boolean;
  startedAt: number | null;
  elapsedSec: number;
}) {
  const { rideId, active, startedAt, elapsedSec } = opts;
  const [miles, setMiles] = useState(0);
  const [gps, setGps] = useState<GpsStatus>("idle");
  const last = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!active || !rideId) return;
    const saved = loadPersist(rideId);
    setMiles(saved.miles);
    if (saved.lastLat != null && saved.lastLng != null) {
      last.current = { lat: saved.lastLat, lng: saved.lastLng };
    }
  }, [active, rideId]);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.geolocation) {
      if (active) setGps("error");
      return;
    }
    setGps("waiting");
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        if (acc && acc > 60) return;
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const prev = last.current;
        last.current = next;
        if (!prev) {
          setGps("live");
          savePersist(rideId, { miles, lastLat: next.lat, lastLng: next.lng });
          return;
        }
        const d = milesBetween(prev, next);
        // ignore GPS jitter and teleport jumps
        if (d < 0.004 || d > 0.35) {
          setGps("live");
          return;
        }
        setMiles((m) => {
          const n = m + d;
          savePersist(rideId, {
            miles: n,
            lastLat: next.lat,
            lastLng: next.lng,
          });
          return n;
        });
        setGps("live");
      },
      (err) => {
        setGps(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [active, rideId]);

  const fare = computeTaxiFare(miles, elapsedSec);
  return {
    fare,
    gps,
    startedAt,
  };
}

export function FareMeterPanel({
  fare,
  gps,
  vipPrice,
}: {
  fare: TaxiFare;
  gps: GpsStatus;
  vipPrice?: number;
}) {
  const gpsLabel =
    gps === "live"
      ? "GPS live"
      : gps === "waiting"
        ? "Getting GPS…"
        : gps === "denied"
          ? "GPS off — time still counts"
          : gps === "error"
            ? "GPS unavailable — time still counts"
            : "Meter ready";
  const billed =
    vipPrice != null && vipPrice >= 0 ? vipPrice : fare.meter;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-primary)]/25 bg-[var(--color-bg-elevated)] px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
          Taxi meter
        </p>
        <p className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-fg-muted)]">
          <Navigation className="size-3" />
          {gpsLabel}
        </p>
      </div>
      <p className="mt-1 font-display text-4xl font-semibold tabular-nums leading-none text-[var(--color-primary)]">
        {formatMoney(billed)}
      </p>
      {vipPrice != null && vipPrice !== fare.meter && (
        <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
          VIP billed {formatMoney(vipPrice)} · meter {formatMoney(fare.meter)}
        </p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-fg-subtle)]">
            Distance
          </p>
          <p className="font-mono text-sm font-semibold tabular-nums">
            {formatMiles(fare.miles)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-fg-subtle)]">
            Time
          </p>
          <p className="font-mono text-sm font-semibold tabular-nums">
            {Math.floor(fare.seconds / 60)}m {fare.seconds % 60}s
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-fg-subtle)]">
            Rate
          </p>
          <p className="text-sm font-semibold">
            {formatMoney(SHARE_TAXI_RATES.perMile)}/mi
          </p>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-[var(--color-fg-subtle)]">
        {formatMoney(SHARE_TAXI_RATES.flagDrop)} base fare +{" "}
        {formatMoney(SHARE_TAXI_RATES.perMile)}/mi +{" "}
        {formatMoney(SHARE_TAXI_RATES.perMinute)}/min · min{" "}
        {formatMoney(SHARE_TAXI_RATES.minFare)}
      </p>
    </div>
  );
}

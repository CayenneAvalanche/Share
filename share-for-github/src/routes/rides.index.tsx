import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  Search,
  HeartHandshake,
  Calculator,
  Armchair,
  ThumbsUp,
  ArrowLeft,
} from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { NearMeBar } from "@/components/share/near-me-bar";
import { TripCard } from "@/components/share/trip-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { HUB_CITIES, type VolunteerRide } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { formatCurrency } from "@/lib/utils";
import { listVolunteerRidesFn, listTripsFn, countNearbyOpenRidesFn } from "@/lib/share/server-fns";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useMyAppStatus } from "@/lib/share/use-my-apps";
import {
  DEFAULT_RADIUS_RIDE_HUB,
  DEFAULT_RADIUS_RIDE_PATH,
  DEFAULT_RADIUS_NEARBY,
  filterSortCorridors,
  formatMiles,
  loadSearchCity,
  loadSearchRadius,
  saveSearchCity,
  saveSearchRadius,
} from "@/lib/share/geo";

export const Route = createFileRoute("/rides/")({
  component: RidesPage,
});

function RidesPage() {
  const trips = useShareStore((s) => s.trips);
  const volunteerRides = useShareStore((s) => s.volunteerRides);
  const localRides = useShareStore((s) => s.localRides);
  const user = useCurrentUser();
  const riderName = useShareStore((s) => s.riderName);
  const isDriverApproved = useShareStore((s) => s.isDriverApproved);
  const { driverActive } = useMyAppStatus();
  const [from, setFrom] = useState("Any");
  const [to, setTo] = useState("Any");
  const [query, setQuery] = useState("");
  const [cloudVol, setCloudVol] = useState<VolunteerRide[]>([]);
  const [nearCity, setNearCity] = useState("Lafayette, LA");
  const [rideRadius, setRideRadius] = useState(DEFAULT_RADIUS_RIDE_HUB);
  const [nearbyRiders, setNearbyRiders] = useState<number | null>(null);
  const [rideMode, setRideMode] = useState<"pick" | "corridor">("pick");

  useEffect(() => {
    setNearCity(loadSearchCity());
    setRideRadius(loadSearchRadius(DEFAULT_RADIUS_RIDE_HUB));
  }, []);

  useEffect(() => {
    let cancelled = false;
    listTripsFn()
      .then((res) => {
        if (cancelled) return;
        useShareStore.setState((s) => {
          const gone = new Set(s.deletedTripIds ?? []);
          const byId = new Map(
            s.trips.filter((tr) => !gone.has(tr.id)).map((tr) => [tr.id, tr]),
          );
          for (const tr of res.trips) {
            if (!gone.has(tr.id)) byId.set(tr.id, tr);
          }
          return { trips: Array.from(byId.values()) };
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function pull() {
      let guestPhone = "";
      try {
        guestPhone = localStorage.getItem("share-vol-guest-phone") || "";
      } catch {
        /* ignore */
      }
      listVolunteerRidesFn({
        data: {
          email: user?.primaryEmail || undefined,
          phone: guestPhone,
          driverName: user?.displayName || riderName || undefined,
        },
      })
        .then((res) => {
          setCloudVol(res.rides);
          useShareStore.setState((s) => {
            const byId = new Map(s.volunteerRides.map((r) => [r.id, r]));
            for (const r of res.rides) byId.set(r.id, r);
            return { volunteerRides: Array.from(byId.values()) };
          });
        })
        .catch(() => {});
    }
    pull();
    const t = window.setInterval(pull, 8000);
    return () => window.clearInterval(t);
  }, [user?.primaryEmail, user?.displayName, riderName]);

  useEffect(() => {
    let cancelled = false;
    countNearbyOpenRidesFn({
      data: { city: nearCity, radiusMiles: DEFAULT_RADIUS_NEARBY },
    })
      .then((res) => {
        if (!cancelled) setNearbyRiders(res.count);
      })
      .catch(() => {
        if (!cancelled) setNearbyRiders(null);
      });
    return () => {
      cancelled = true;
    };
  }, [nearCity]);

  const isDriver = driverActive || isDriverApproved;

  const openLiveBoard = useMemo(() => {
    if (!isDriver) return [];
    const byId = new Map<string, VolunteerRide>();
    for (const r of cloudVol) byId.set(r.id, r);
    for (const r of volunteerRides) byId.set(r.id, r);
    return Array.from(byId.values())
      .filter(
        (r) =>
          r.status === "seeking_volunteer" || r.status === "escalated_paid",
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [cloudVol, volunteerRides, isDriver]);

  const activeMatched = useMemo(() => {
    const byId = new Map<string, VolunteerRide>();
    for (const r of cloudVol) byId.set(r.id, r);
    for (const r of volunteerRides) byId.set(r.id, r);
    return Array.from(byId.values())
      .filter((r) => r.status === "matched")
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [cloudVol, volunteerRides]);

  const activeLocal = useMemo(
    () =>
      localRides.filter(
        (r) => r.status === "matched" || r.status === "broadcasting",
      ),
    [localRides],
  );

  const filtered = useMemo(() => {
    const texted = trips
      .filter((t) => (from === "Any" ? true : t.from === from))
      .filter((t) => (to === "Any" ? true : t.to === to))
      .filter((t) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          t.from.toLowerCase().includes(q) ||
          t.to.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
        );
      });
    return filterSortCorridors(
      texted,
      (t) => t.from,
      (t) => t.to,
      nearCity,
      rideRadius,
      DEFAULT_RADIUS_RIDE_PATH,
    );
  }, [trips, from, to, query, nearCity, rideRadius]);

  return (
    <AppShell
      title={rideMode === "corridor" ? "Out of town" : "Share a ride"}
      subtitle={
        nearbyRiders == null
          ? undefined
          : nearbyRiders === 1
            ? "1 rider nearby"
            : `${nearbyRiders} riders nearby`
      }
      solidHeader
      action={
        <Button size="sm" asChild>
          <Link to="/rides/post">
            <Plus className="size-4" />
            Post
          </Link>
        </Button>
      }
    >
      {rideMode === "pick" ? (
        <div className={isDriver ? "mt-5" : "mt-3"}>
          {isDriver && openLiveBoard.length > 0 ? (
            <section className="mb-5">
              <h2 className="font-display text-lg font-semibold">Live board</h2>
              <div className="mt-3 flex flex-col gap-2">
                {openLiveBoard.slice(0, 6).map((r) => (
                  <Link
                    key={r.id}
                    to="/volunteer"
                    className="block rounded-[var(--radius-lg)] border-2 border-[var(--color-primary)]/35 bg-[var(--color-primary)]/6 p-4"
                  >
                    <p className="font-semibold">
                      {r.riderLegalName || r.fullName}
                    </p>
                    <p className="truncate text-sm text-[var(--color-fg-muted)]">
                      {r.pickup} → {r.dropoff}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                      {r.when} ·{" "}
                      {r.paidOffer > 0
                        ? formatCurrency(r.paidOffer)
                        : "FREE / $0"}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <Link
            to="/local"
            className="flex items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-[var(--color-primary)] px-5 py-6 text-[var(--color-primary-fg)] shadow-[var(--shadow-md)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-full bg-white/15">
                <Armchair className="size-7" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-tight">Local ride</p>
                <p className="mt-0.5 text-sm opacity-90">
                  In town · Uber-style · Lafayette now
                </p>
              </div>
            </div>
            <span className="text-2xl font-light opacity-80">→</span>
          </Link>

          <button
            type="button"
            onClick={() => setRideMode("corridor")}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-[var(--radius-xl)] border-2 border-[var(--color-primary)]/35 bg-[var(--color-bg-elevated)] px-5 py-6 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                <ThumbsUp className="size-7" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-tight">Out of town</p>
                <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                  Corridor seats · Lafayette ↔ cities
                </p>
              </div>
            </div>
            <span className="text-2xl font-light text-[var(--color-fg-subtle)]">
              →
            </span>
          </button>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-sm">
            <Link
              to="/volunteer"
              className="inline-flex items-center gap-1.5 font-medium text-[var(--color-primary)]"
            >
              <HeartHandshake className="size-3.5" />
              Volunteer
            </Link>
            <Link
              to="/rides/quote"
              className="inline-flex items-center gap-1.5 font-medium text-[var(--color-primary)]"
            >
              <Calculator className="size-3.5" />
              Fare quote
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setRideMode("pick")}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]"
          >
            <ArrowLeft className="size-4" />
            Back to ride type
          </button>
          <h2 className="font-display text-lg font-semibold">Out of town</h2>
          <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
            Long-distance seats and corridor trips.
          </p>
        </div>
      )}

      {(activeMatched.length > 0 || activeLocal.length > 0) && (
        <section className="mt-5">
          <h2 className="font-display text-lg font-semibold">Your rides</h2>
          <div className="mt-3 flex flex-col gap-2">
            {activeMatched.map((r) => (
              <Link
                key={r.id}
                to="/rides/matched/$id"
                params={{ id: r.id }}
                className="block rounded-[var(--radius-lg)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {r.riderLegalName || r.fullName}
                    </p>
                    <p className="truncate text-sm text-[var(--color-fg-muted)]">
                      {r.pickup} → {r.dropoff}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                      {r.when}
                    </p>
                  </div>
                  <Badge variant="success">Matched</Badge>
                </div>
              </Link>
            ))}
            {activeLocal.map((r) => (
              <Link
                key={r.id}
                to="/rides/matched/$id"
                params={{ id: r.id }}
                className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4"
              >
                <p className="font-semibold">Local · {r.requesterName}</p>
                <p className="truncate text-sm text-[var(--color-fg-muted)]">
                  {r.pickup} → {r.dropoff}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {rideMode === "corridor" && (
        <>
          <div className="mt-4">
            <NearMeBar
              idPrefix="rides"
              city={nearCity}
              radius={rideRadius}
              onCityChange={(c) => {
                setNearCity(c);
                saveSearchCity(c);
              }}
              onRadiusChange={(mi) => {
                setRideRadius(mi);
                saveSearchRadius(mi);
              }}
              radiusOptions={[
                { value: 75, label: "75 mi ends" },
                { value: 150, label: "150 mi ends" },
                { value: 250, label: "250 mi ends" },
                { value: 400, label: "400 mi ends" },
              ]}
              hint="Corridors along your path, not only exact city matches."
            />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
              <Input
                className="pl-9"
                placeholder="Search city or note…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={from} onChange={(e) => setFrom(e.target.value)}>
                <option value="Any">From anywhere</option>
                {HUB_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Select value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="Any">To anywhere</option>
                {HUB_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 pb-6">
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--color-fg-muted)]">
                No corridors near {nearCity.split(",")[0] || "you"}. Post a
                trip or widen the radius.
              </p>
            ) : (
              filtered.map((trip) => (
                <div key={trip.id} className="space-y-1">
                  {trip.distanceMiles != null && trip.distanceMiles < 900 ? (
                    <p className="px-1 text-[11px] font-medium text-[var(--color-primary)]">
                      {formatMiles(trip.distanceMiles)}
                    </p>
                  ) : null}
                  <TripCard trip={trip} />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}

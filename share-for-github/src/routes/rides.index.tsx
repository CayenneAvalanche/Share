import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search, MapPinned, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { NearMeBar } from "@/components/share/near-me-bar";
import { TripCard } from "@/components/share/trip-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { HUB_CITIES, VOLUNTEER_LABELS, type Trip, type VolunteerRide } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { formatRequestedAt, formatCurrency } from "@/lib/utils";
import { listVolunteerRidesFn, listTripsFn } from "@/lib/share/server-fns";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useMyAppStatus } from "@/lib/share/use-my-apps";
import {
  DEFAULT_RADIUS_RIDE_HUB,
  DEFAULT_RADIUS_RIDE_PATH,
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

/** Prefer full name from approved/active rider apps (by phone). */
function enrichVolunteerWithRiderApp(
  rides: VolunteerRide[],
  riderApps: { phone?: string; fullName?: string; status?: string; selfie?: string }[],
): VolunteerRide[] {
  const byPhone = new Map<
    string,
    { name: string; status: string; selfie?: string }
  >();
  for (const a of riderApps) {
    const p = String(a.phone || "").replace(/\D/g, "").slice(-10);
    if (p.length < 10 || !a.fullName) continue;
    if (byPhone.has(p)) continue;
    byPhone.set(p, {
      name: a.fullName.trim(),
      status: String(a.status || ""),
      selfie: a.selfie,
    });
  }
  return rides.map((r) => {
    const p = String(r.phone || "").replace(/\D/g, "").slice(-10);
    const hit = byPhone.get(p);
    if (!hit) return r;
    const approved = hit.status === "active" || hit.status === "approved";
    if (!approved) {
      return { ...r, riderAppStatus: hit.status as VolunteerRide["riderAppStatus"] };
    }
    return {
      ...r,
      fullName: hit.name || r.fullName,
      requesterName: hit.name || r.requesterName,
      riderLegalName: hit.name,
      riderSelfie: hit.selfie && hit.selfie.length > 20 ? hit.selfie : r.riderSelfie,
      riderAppStatus: hit.status as VolunteerRide["riderAppStatus"],
    };
  });
}

function RidesPage() {
  const trips = useShareStore((s) => s.trips);
  const volunteerRides = useShareStore((s) => s.volunteerRides);
  const riderApps = useShareStore((s) => s.riderApps);
  const localRides = useShareStore((s) => s.localRides);
  const navigate = useNavigate();
  const user = useCurrentUser();
  const riderName = useShareStore((s) => s.riderName);
  const isDriverApproved = useShareStore((s) => s.isDriverApproved);
  const setLocalRideStatus = useShareStore((s) => s.setLocalRideStatus);
  const { driverActive } = useMyAppStatus();
  const [from, setFrom] = useState("Any");
  const [to, setTo] = useState("Any");
  const [query, setQuery] = useState("");
  const [cloudVol, setCloudVol] = useState<VolunteerRide[]>([]);
  const [nearCity, setNearCity] = useState("Lafayette, LA");
  const [rideRadius, setRideRadius] = useState(DEFAULT_RADIUS_RIDE_HUB);

  useEffect(() => {
    setNearCity(loadSearchCity());
    setRideRadius(loadSearchRadius(DEFAULT_RADIUS_RIDE_HUB));
  }, []);

  // Cloud corridor trips — visible on every device
  useEffect(() => {
    let cancelled = false;
    listTripsFn()
      .then(async (res) => {
        if (cancelled) return;
        const cloudIds = new Set(res.trips.map((tr) => tr.id));
        useShareStore.setState((s) => {
          const byId = new Map(s.trips.map((tr) => [tr.id, tr]));
          for (const tr of res.trips) byId.set(tr.id, tr);
          return { trips: Array.from(byId.values()) };
        });
        // One-time push: publish this device's user posts that never hit cloud
        const localOnly = useShareStore
          .getState()
          .trips.filter(
            (tr) =>
              (tr.id.startsWith("user_") || tr.postedByEmail) &&
              !cloudIds.has(tr.id) &&
              !tr.id.match(/^(t\d+|trip)/),
          );
        const { createTripFn } = await import("@/lib/share/server-fns");
        for (const tr of localOnly.slice(0, 20)) {
          try {
            await createTripFn({
              data: tr as unknown as Record<string, unknown>,
            });
          } catch {
            /* ignore single failure */
          }
        }
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
          // Only merge privacy-scoped rides into store (never the full public board)
          useShareStore.setState((s) => {
            const byId = new Map(s.volunteerRides.map((r) => [r.id, r]));
            for (const r of res.rides) byId.set(r.id, r);
            return { volunteerRides: Array.from(byId.values()) };
          });
        })
        .catch(() => {});
    }
    pull();
    const t = window.setInterval(pull, 5000);
    return () => window.clearInterval(t);
  }, [user?.primaryEmail, user?.displayName, riderName]);

  const activeMatched = useMemo(() => {
    const byId = new Map<string, VolunteerRide>();
    for (const r of enrichVolunteerWithRiderApp(cloudVol, riderApps))
      byId.set(r.id, r);
    for (const r of enrichVolunteerWithRiderApp(volunteerRides, riderApps))
      byId.set(r.id, r);
    const me = (user?.displayName || riderName || "").toLowerCase();
    const meFirst = me.split(/\s+/)[0] || "";
    let guestPhone = "";
    try {
      guestPhone = localStorage.getItem("share-vol-guest-phone") || "";
    } catch {
      /* ignore */
    }
    const phone10 = guestPhone.replace(/\D/g, "").slice(-10);
    const isMine = (r: VolunteerRide) => {
      if (phone10.length >= 10) {
        const rp = r.phone.replace(/\D/g, "").slice(-10);
        if (rp === phone10) return true;
      }
      const n = (r.matchedDriverName || "").toLowerCase();
      if (me && n) {
        if (n === me) return true;
        if (meFirst.length >= 3 && n.includes(meFirst)) return true;
      }
      return false;
    };
    return Array.from(byId.values())
      .filter((r) => r.status === "matched")
      .filter(isMine)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [cloudVol, volunteerRides, riderApps, user?.displayName, riderName]);

  /** Completed trips still needing a rider review (or recently done) */
  const needsReview = useMemo(() => {
    const byId = new Map<string, VolunteerRide>();
    for (const r of cloudVol) byId.set(r.id, r);
    for (const r of volunteerRides) byId.set(r.id, r);
    let guestPhone = "";
    try {
      guestPhone = localStorage.getItem("share-vol-guest-phone") || "";
    } catch {
      /* ignore */
    }
    const phone10 = guestPhone.replace(/\D/g, "").slice(-10);
    return Array.from(byId.values())
      .filter((r) => r.status === "completed" && !r.riderRating)
      .filter((r) => {
        if (phone10.length >= 10) {
          const rp = r.phone.replace(/\D/g, "").slice(-10);
          if (rp === phone10) return true;
        }
        // also show to matched driver so they can open / remind
        const me = (user?.displayName || riderName || "").toLowerCase();
        const n = (r.matchedDriverName || "").toLowerCase();
        if (me && n && (n === me || me.split(/\s+/)[0].length >= 3 && n.includes(me.split(/\s+/)[0])))
          return true;
        return false;
      })
      .sort(
        (a, b) =>
          +new Date(b.completedAt || b.createdAt) -
          +new Date(a.completedAt || a.createdAt),
      )
      .slice(0, 8);
  }, [cloudVol, volunteerRides, user?.displayName, riderName]);

  const activeLocal = useMemo(
    () =>
      localRides.filter(
        (r) => r.status === "matched" || r.status === "broadcasting",
      ),
    [localRides],
  );

  /** Open local ride offers — visible to approved active drivers */
  const openLocalOffers = useMemo(
    () =>
      localRides
        .filter((r) => r.status === "broadcasting")
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
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
    // Corridor-aware: Houston sees LA → Corpus; pure local goods logic does NOT apply
    const scored = filterSortCorridors(
      texted,
      (t) => t.from,
      (t) => t.to,
      nearCity,
      rideRadius,
      DEFAULT_RADIUS_RIDE_PATH,
    );
    // Then by depart time within distance bands
    return scored.sort((a, b) => {
      if (Math.abs(a.distanceMiles - b.distanceMiles) > 40) {
        return a.distanceMiles - b.distanceMiles;
      }
      return new Date(a.departAt).getTime() - new Date(b.departAt).getTime();
    });
  }, [trips, from, to, query, nearCity, rideRadius]);

  return (
    <AppShell
      title="Share a ride"
      subtitle="Local now · or long-distance"
      solidHeader
      action={
        <div className="flex gap-1">
          <Button size="sm" variant="outline" asChild>
            <Link to="/rides/requests">Requests</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/rides/post">
              <Plus className="size-4" />
              Post
            </Link>
          </Button>
        </div>
      }
    >
      {/* Fast path: local rides (primary launch focus) */}
      <Link
        to="/local"
        className="mt-3 flex items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-[var(--color-primary)] px-5 py-5 text-[var(--color-primary-fg)] shadow-[var(--shadow-md)] transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/15">
            <MapPinned className="size-6" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">Local ride</p>
            <p className="text-sm opacity-90">
              Nearby now · fastest way to request
            </p>
          </div>
        </div>
        <span className="text-2xl font-light opacity-80">→</span>
      </Link>

      {/* Volunteer / free community rides */}
      <Link
        to="/volunteer"
        className="mt-2 flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border-2 border-[var(--color-primary)]/35 bg-[var(--color-bg-elevated)] px-5 py-4 text-[var(--color-fg)] shadow-[var(--shadow-sm)] transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <HeartHandshake className="size-6" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">Volunteer ride</p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Free help for elders, vets, medical, hardship & work
            </p>
          </div>
        </div>
        <span className="text-2xl font-light text-[var(--color-fg-subtle)]">
          →
        </span>
      </Link>

      
      {/* Matched / active rides — rider + driver home base */}
      {(activeMatched.length > 0 || activeLocal.length > 0) && (
        <section className="mt-5">
          <h2 className="font-display text-lg font-semibold">Your rides</h2>
          <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
            Matched trips live here — open one to call, edit, or complete. Edit
            requires a new accept.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {activeMatched.map((r) => {
              const live =
                !!r.tripStartedAt && !r.tripEndedAt && r.status === "matched";
              return (
              <Link
                key={r.id}
                to="/rides/matched/$id"
                params={{ id: r.id }}
                className={
                  live
                    ? "block rounded-[var(--radius-lg)] border-2 border-[#b42318]/50 bg-[#b42318]/8 p-4"
                    : "block rounded-[var(--radius-lg)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4 transition-colors active:bg-[var(--color-primary)]/10"
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {r.riderSelfie ? (
                        <img
                          src={r.riderSelfie}
                          alt=""
                          className="size-8 shrink-0 rounded-full object-cover"
                        />
                      ) : null}
                      <p className="font-semibold">
                        {r.riderLegalName || r.fullName}
                      </p>
                    </div>
                    <p className="truncate text-sm text-[var(--color-fg-muted)]">
                      {r.pickup} → {r.dropoff}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                      {r.when}
                      {r.matchedDriverName
                        ? ` · Driver: ${r.matchedDriverName}`
                        : ""}
                    </p>
                    <p className="text-[11px] text-[var(--color-fg-subtle)]">
                      Requested {formatRequestedAt(r.createdAt)}
                    </p>
                  </div>
                  <Badge variant={live ? "outline" : "success"}>
                    {live ? "In progress" : "Matched"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs font-medium text-[var(--color-primary)]">
                  {live
                    ? "Open for SOS · Record audio →"
                    : "Open ride →"}
                </p>
              </Link>
            );
            })}
            {activeLocal.map((r) => (
              <div
                key={r.id}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4"
              >
                <Link
                  to="/rides/matched/$id"
                  params={{ id: r.id }}
                  className="block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">Local · {r.requesterName}</p>
                      <p className="truncate text-sm text-[var(--color-fg-muted)]">
                        {r.pickup} → {r.dropoff}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[var(--color-primary)]">
                        Offer{" "}
                        {r.sharePrice > 0
                          ? formatCurrency(r.sharePrice)
                          : "FREE / $0"}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {r.status === "broadcasting"
                        ? "Broadcasting"
                        : r.status}
                    </Badge>
                  </div>
                </Link>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link to="/rides/matched/$id" params={{ id: r.id }}>
                      Open
                    </Link>
                  </Button>
                  {r.status === "broadcasting" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#b42318]/40 text-[#b42318]"
                      onClick={() => {
                        if (
                          !confirm(
                            "Cancel this local ride request?",
                          )
                        )
                          return;
                        setLocalRideStatus(
                          r.id,
                          "cancelled",
                          "Cancelled by rider",
                        );
                        toast.success("Local ride cancelled");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {driverActive && openLocalOffers.length > 0 && (
        <section className="mt-5">
          <h2 className="font-display text-lg font-semibold">
            Local offers nearby
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
            Open requests from riders — OFFER is what they'll pay (pilot:
            settle in person).
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {openLocalOffers.map((r) => (
              <div
                key={`offer-${r.id}`}
                className="rounded-[var(--radius-lg)] border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/5 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.requesterName}</p>
                    <p className="truncate text-sm text-[var(--color-fg-muted)]">
                      {r.pickup} → {r.dropoff}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                      {r.when} · {r.seats} seat{r.seats === 1 ? "" : "s"}
                      {r.uberEstimate > 0 || r.lyftEstimate > 0
                        ? ` · Uber ~${formatCurrency(r.uberEstimate)} · Lyft ~${formatCurrency(r.lyftEstimate)}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
                      Offer
                    </p>
                    <p className="text-lg font-bold text-[var(--color-primary)]">
                      {r.sharePrice > 0
                        ? formatCurrency(r.sharePrice)
                        : "$0"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setLocalRideStatus(
                        r.id,
                        "matched",
                        `Accepted by ${user?.displayName || riderName || "driver"}`,
                      );
                      toast.success(
                        r.sharePrice > 0
                          ? `Accepted · offer ${formatCurrency(r.sharePrice)}`
                          : "Accepted · free local ride",
                      );
                      navigate({
                        to: "/rides/matched/$id",
                        params: { id: r.id },
                      });
                    }}
                  >
                    Accept offer
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/rides/matched/$id" params={{ id: r.id }}>
                      Details
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {needsReview.length > 0 && (
        <section className="mt-5">
          <h2 className="font-display text-lg font-semibold">
            Rate your ride
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
            Trip complete — leave stars for your driver (optional short review).
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {needsReview.map((r) => (
              <Link
                key={`review-${r.id}`}
                to="/rides/matched/$id"
                params={{ id: r.id }}
                className="block rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/8 p-4"
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
                      Driver: {r.matchedDriverName || "Share driver"}
                      {r.completedAt
                        ? ` · Done ${formatRequestedAt(r.completedAt)}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="accent">Rate</Badge>
                </div>
                <p className="mt-2 text-xs font-medium text-[var(--color-accent)]">
                  Open to rate 1–5 stars →
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
        Long-distance / corridor
      </p>

      <div className="mt-2">
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
            { value: 100, label: "100 mi ends" },
            { value: 150, label: "150 mi ends" },
            { value: 250, label: "250 mi ends" },
            { value: 400, label: "400 mi ends" },
          ]}
          hint="Corridors: if you’re in Houston, a Louisiana → Corpus Christi trip still shows when you’re along the path — not only exact city matches."
        />
      </div>

      <Card className="mt-2 border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="text-sm">
            <strong>Need a seat with no listings?</strong>
            <span className="text-[var(--color-fg-muted)]">
              {" "}
              Set a private offer · drivers bid · you approve.
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/rides/requests">Browse requests</Link>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/rides/request/new">Request a trip</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/local">
            <MapPinned className="size-4" />
            Need a local ride instead?
          </Link>
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 pb-6">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-fg-muted)]">
            No corridors near {nearCity.split(",")[0] || "you"}. Widen the
            radius, change city, or post a trip.
          </p>
        ) : (
          filtered.map((trip) => (
            <div key={trip.id} className="space-y-1">
              {(trip.corridorReason || trip.distanceMiles != null) && (
                <p className="px-1 text-[11px] font-medium text-[var(--color-primary)]">
                  {trip.corridorReason === "along_path"
                    ? "Along your corridor"
                    : trip.corridorReason === "near_to"
                      ? "Near your destination side"
                      : trip.corridorReason === "near_from"
                        ? "Near your area"
                        : "Nearby"}
                  {trip.distanceMiles != null && trip.distanceMiles < 900
                    ? ` · ${formatMiles(trip.distanceMiles)}`
                    : ""}
                </p>
              )}
              <TripCard trip={trip} />
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

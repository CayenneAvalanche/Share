import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  Clock,
  HeartHandshake,
  MapPin,
  Package,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { SosPanel } from "@/components/share/sos-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShareStore } from "@/lib/share/store";
import type { VolunteerRide } from "@/lib/share/data";
import { VOLUNTEER_LABELS } from "@/lib/share/data";
import { listVolunteerRidesFn } from "@/lib/share/server-fns";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  formatCurrency,
  formatDate,
  formatTime,
} from "@/lib/utils";

export const Route = createFileRoute("/trips")({
  component: TripsPage,
});

function formatWhen(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDuration(start?: string, end?: string) {
  if (!start || !end) return null;
  const ms = +new Date(end) - +new Date(start);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h ${mm}m`;
  }
  return `${m} min ${String(s).padStart(2, "0")}s`;
}

function phone10(p: string) {
  return p.replace(/\D/g, "").slice(-10);
}

function TripsPage() {
  const bookings = useShareStore((s) => s.bookings);
  const trips = useShareStore((s) => s.trips);
  const cancelBooking = useShareStore((s) => s.cancelBooking);
  const tripRatings = useShareStore((s) => s.tripRatings);
  const rateTrip = useShareStore((s) => s.rateTrip);
  const volunteerRides = useShareStore((s) => s.volunteerRides);
  const localRides = useShareStore((s) => s.localRides);
  const riderName = useShareStore((s) => s.riderName);
  const { user } = useCurrentUserState();
  const [cloudVol, setCloudVol] = useState<VolunteerRide[]>([]);

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

  const historyVolunteer = useMemo(() => {
    const byId = new Map<string, VolunteerRide>();
    for (const r of cloudVol) byId.set(r.id, r);
    for (const r of volunteerRides) byId.set(r.id, r);
    const me = (user?.displayName || riderName || "").toLowerCase().trim();
    const meFirst = me.split(/\s+/)[0] || "";
    let guestPhone = "";
    try {
      guestPhone = localStorage.getItem("share-vol-guest-phone") || "";
    } catch {
      /* ignore */
    }
    const myPhone = phone10(guestPhone);
    const isMine = (r: VolunteerRide) => {
      if (myPhone.length >= 10 && phone10(r.phone) === myPhone) return true;
      const driver = (r.matchedDriverName || "").toLowerCase();
      if (me && driver) {
        if (driver === me) return true;
        if (meFirst.length >= 3 && driver.includes(meFirst)) return true;
      }
      // Name match on rider side (booked under your account name)
      const rider = (r.fullName || r.requesterName || "").toLowerCase();
      if (me && rider && (rider === me || (meFirst.length >= 3 && rider.includes(meFirst)))) {
        return true;
      }
      return false;
    };
    return Array.from(byId.values())
      .filter(
        (r) =>
          r.status === "completed" ||
          r.status === "cancelled" ||
          r.status === "matched",
      )
      .filter(isMine)
      .sort((a, b) => {
        const ta =
          +new Date(a.completedAt || a.cancelledAt || a.createdAt) || 0;
        const tb =
          +new Date(b.completedAt || b.cancelledAt || b.createdAt) || 0;
        return tb - ta;
      });
  }, [cloudVol, volunteerRides, user?.displayName, riderName]);

  const meLabel = (user?.displayName || riderName || "").toLowerCase();
  const myLocal = useMemo(() => {
    return localRides
      .filter((r) => {
        const n = (r.requesterName || "").toLowerCase();
        if (!meLabel) return r.status !== "broadcasting";
        return (
          n === meLabel ||
          n.includes(meLabel.split(/\s+/)[0] || "") ||
          r.status === "matched" ||
          r.status === "cancelled"
        );
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [localRides, meLabel]);

  const hasAnything =
    historyVolunteer.length > 0 || bookings.length > 0 || myLocal.length > 0;

  return (
    <AppShell
      title="My trips"
      subtitle="Volunteer · local · corridor"
      solidHeader
    >
      {bookings.length > 0 && (
        <div className="mt-3">
          <SosPanel tripLabel="Active Share trip" />
        </div>
      )}

      {!hasAnything ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]">
            <CalendarCheck className="size-7" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">
            No trips yet
          </h2>
          <p className="mt-1 max-w-xs text-sm text-[var(--color-fg-muted)]">
            Completed volunteer rides, local rides, and corridor bookings all
            show up here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to="/rides">Rides</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/volunteer">Volunteer rides</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-6 pb-8">
          {historyVolunteer.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-0.5">
                <HeartHandshake className="size-4 text-[var(--color-primary)]" />
                <h2 className="font-display text-lg font-semibold">
                  Volunteer & free rides
                </h2>
              </div>
              {historyVolunteer.map((r) => {
                const duration = formatDuration(
                  r.tripStartedAt,
                  r.tripEndedAt,
                );
                return (
                  <Card key={r.id}>
                    <CardContent className="space-y-2 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            r.status === "completed"
                              ? "success"
                              : r.status === "cancelled"
                                ? "outline"
                                : "default"
                          }
                          className="capitalize"
                        >
                          {r.status === "matched" ? "Matched" : r.status}
                        </Badge>
                        <Badge variant="outline">
                          {VOLUNTEER_LABELS[r.category] || r.category}
                        </Badge>
                      </div>
                      <p className="font-display text-lg font-semibold">
                        {r.riderLegalName || r.fullName}
                      </p>
                      <p className="flex items-start gap-1.5 text-sm text-[var(--color-fg-muted)]">
                        <MapPin className="mt-0.5 size-3.5 shrink-0" />
                        <span>
                          {r.pickup} → {r.dropoff}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--color-fg-subtle)]">
                        Requested {formatWhen(r.createdAt)}
                        {r.when ? ` · When: ${r.when}` : ""}
                      </p>
                      {r.status === "completed" && (
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-fg)]">
                          <span>
                            Completed{" "}
                            {formatWhen(
                              r.completedAt || r.tripEndedAt || r.createdAt,
                            )}
                          </span>
                          {duration && (
                            <span className="inline-flex items-center gap-1 font-medium text-[var(--color-primary)]">
                              <Clock className="size-3.5" />
                              In car {duration}
                            </span>
                          )}
                        </p>
                      )}
                      {r.status === "cancelled" && (
                        <p className="text-sm text-[var(--color-fg-muted)]">
                          Cancelled {formatWhen(r.cancelledAt)}
                          {r.cancelledBy
                            ? ` · by ${r.cancelledByName || r.cancelledBy}`
                            : ""}
                        </p>
                      )}
                      {r.matchedDriverName && (
                        <p className="text-xs text-[var(--color-fg-subtle)]">
                          Driver: {r.matchedDriverName}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="secondary" asChild>
                          <Link
                            to="/rides/matched/$id"
                            params={{ id: r.id }}
                          >
                            Open trip
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/rides">All rides</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}

          {myLocal.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold">Local rides</h2>
              {myLocal.map((r) => (
                <Card key={r.id}>
                  <CardContent className="space-y-2 p-4">
                    <Badge variant="outline" className="capitalize">
                      {r.status}
                    </Badge>
                    <p className="font-semibold">
                      {r.pickup} → {r.dropoff}
                    </p>
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      {r.when} · Requested {formatWhen(r.createdAt)}
                    </p>
                    <p className="text-sm text-[var(--color-fg-muted)]">
                      {r.requesterName}
                      {r.sharePrice === 0
                        ? " · FREE (pilot)"
                        : ` · $${r.sharePrice}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {bookings.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold">
                Corridor bookings
              </h2>
              {bookings.map((b) => {
                const trip = trips.find((t) => t.id === b.tripId);
                if (!trip) return null;
                const rating = tripRatings[b.id];
                return (
                  <Card key={b.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                b.kind === "ride" ? "default" : "accent"
                              }
                            >
                              {b.kind === "ride" ? (
                                <>
                                  <Users className="mr-1 size-3" />
                                  Ride
                                </>
                              ) : (
                                <>
                                  <Package className="mr-1 size-3" />
                                  Delivery
                                </>
                              )}
                            </Badge>
                            <Badge variant="success" className="capitalize">
                              {b.status}
                            </Badge>
                          </div>
                          <p className="mt-2 font-display text-xl font-semibold">
                            {trip.fromShort} → {trip.toShort}
                          </p>
                          <p className="text-sm text-[var(--color-fg-muted)]">
                            {formatDate(trip.departAt)} ·{" "}
                            {formatTime(trip.departAt)}
                          </p>
                          {b.cargoNote && (
                            <p className="mt-1 text-sm text-[var(--color-fg-subtle)]">
                              {b.cargoNote}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(b.total)}
                        </p>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-medium text-[var(--color-fg-muted)]">
                          Rate this trip
                        </p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              className="p-1"
                              onClick={() => {
                                rateTrip(b.id, n);
                                toast.success(`Rated ${n} stars`);
                              }}
                              aria-label={`${n} stars`}
                            >
                              <Star
                                className={`size-6 ${
                                  rating && rating >= n
                                    ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                                    : "text-[var(--color-border-strong)]"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" asChild>
                          <a href={`/rides/${trip.id}`}>Rebook route</a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/messages">Message</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            cancelBooking(b.id);
                            toast.message(
                              "Booking cancelled (free if 12h+ out)",
                            );
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}

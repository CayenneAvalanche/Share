import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Package, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { SosPanel } from "@/components/share/sos-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShareStore } from "@/lib/share/store";
import {
  formatCurrency,
  formatDate,
  formatTime,
} from "@/lib/utils";

export const Route = createFileRoute("/trips")({
  component: TripsPage,
});

function TripsPage() {
  const bookings = useShareStore((s) => s.bookings);
  const trips = useShareStore((s) => s.trips);
  const cancelBooking = useShareStore((s) => s.cancelBooking);
  const tripRatings = useShareStore((s) => s.tripRatings);
  const rateTrip = useShareStore((s) => s.rateTrip);

  return (
    <AppShell title="My trips" subtitle="SOS · rate · rebook" solidHeader>
      {bookings.length > 0 && (
        <div className="mt-3">
          <SosPanel tripLabel="Active Share trip" />
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]">
            <CalendarCheck className="size-7" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">
            No trips yet
          </h2>
          <p className="mt-1 max-w-xs text-sm text-[var(--color-fg-muted)]">
            Book a seat or package. SOS and in-trip audio appear here once you
            have a reservation.
          </p>
          <div className="mt-5 flex gap-2">
            <Button asChild>
              <Link to="/rides">Find a ride</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/deliveries">Send a package</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3 pb-6">
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
                          variant={b.kind === "ride" ? "default" : "accent"}
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
                        {formatDate(trip.departAt)} · {formatTime(trip.departAt)}
                      </p>
                      {b.cargoNote && (
                        <p className="mt-1 text-sm text-[var(--color-fg-subtle)]">
                          {b.cargoNote}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold">{formatCurrency(b.total)}</p>
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
                      <a href={`/rides/${trip.id}`}>
                        Rebook route
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/messages">Message</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        cancelBooking(b.id);
                        toast.message("Booking cancelled (free if 12h+ out)");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

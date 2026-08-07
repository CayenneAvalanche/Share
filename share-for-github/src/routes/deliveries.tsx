import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { Package, Plus, Truck, Radar, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { DeliveryCard, TripCard } from "@/components/share/trip-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShareStore } from "@/lib/share/store";
import { matchDeliveryToTrips } from "@/lib/share/corridor";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { getDriver } from "@/lib/share/data";

export const Route = createFileRoute("/deliveries")({
  component: DeliveriesLayout,
});

function DeliveriesLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <DeliveriesPage />;
}

function DeliveriesPage() {
  const deliveries = useShareStore((s) => s.deliveries);
  const trips = useShareStore((s) => s.trips);
  const claimDeliveryOnTrip = useShareStore((s) => s.claimDeliveryOnTrip);
  const cargoTrips = trips.filter((t) => t.seatsAvailable >= 0).slice(0, 4);
  const active = deliveries.filter(
    (d) => d.status !== "open" && d.status !== "cancelled",
  );
  const open = deliveries.filter((d) => d.status === "open");

  return (
    <AppShell
      title="Share a delivery"
      subtitle="Packages · corridor match · track"
      solidHeader
      action={
        <Button size="sm" asChild>
          <Link to="/deliveries/request">
            <Plus className="size-4" />
            Request
          </Link>
        </Button>
      }
    >
      <Card className="mt-3 border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5">
        <CardContent className="flex gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
            <Truck className="size-5" />
          </div>
          <div>
            <p className="font-semibold">Already on the route?</p>
            <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
              Tom LFT→SHV via Alexandria: an AEX→SHV package lights up his trip
              with estimated pickup & drop times.
            </p>
          </div>
        </CardContent>
      </Card>

      {active.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Radar className="size-4 text-[var(--color-primary)]" />
            <h2 className="font-display text-lg font-semibold">
              Live tracking
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {active.map((d) => (
              <Link
                key={d.id}
                to="/track/$code"
                params={{ code: d.trackingCode ?? d.id }}
                className="block"
              >
                <Card className="transition-shadow hover:shadow-[var(--shadow-md)]">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{d.item}</p>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {d.trackingCode ?? d.id} · {d.driverName ?? "Driver TBD"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant="default" className="capitalize">
                        {d.status.replace("_", " ")}
                      </Badge>
                      <p className="mt-1 text-sm font-semibold text-[var(--color-accent)]">
                        {formatCurrency(d.offer)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Open delivery requests
            </h2>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Corridor matches expand under each package
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {open.map((d) => {
            const matches = matchDeliveryToTrips(d, trips).slice(0, 3);
            return (
              <div key={d.id} className="space-y-2">
                <DeliveryCard
                  from={d.from}
                  to={d.to}
                  item={d.item}
                  offer={d.offer}
                  size={d.size}
                  notes={d.notes}
                  isBusiness={d.isBusiness}
                />
                {matches.length > 0 && (
                  <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
                    <CardContent className="space-y-2 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                        <RouteIcon className="size-3.5" />
                        Drivers already on this corridor
                      </p>
                      {matches.map((m) => {
                        const driver = getDriver(m.trip.driverId);
                        return (
                          <div
                            key={m.trip.id}
                            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 text-sm"
                          >
                            <div className="flex justify-between gap-2">
                              <div>
                                <p className="font-semibold">
                                  {m.trip.fromShort} → {m.trip.toShort}
                                  {driver ? ` · ${driver.name}` : ""}
                                </p>
                                <p className="text-xs text-[var(--color-fg-muted)]">
                                  {m.detourNote}
                                </p>
                              </div>
                              <Badge variant="success">Match</Badge>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-[var(--color-fg-subtle)]">
                                  Est. pickup
                                </p>
                                <p className="font-medium">
                                  {formatDate(m.estimatedPickupAt)}{" "}
                                  {formatTime(m.estimatedPickupAt)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[var(--color-fg-subtle)]">
                                  Est. drop
                                </p>
                                <p className="font-medium">
                                  {formatDate(m.estimatedDropAt)}{" "}
                                  {formatTime(m.estimatedDropAt)}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="mt-2 w-full"
                              onClick={() => {
                                claimDeliveryOnTrip(
                                  d.id,
                                  m.trip.id,
                                  driver?.name,
                                );
                                toast.success(
                                  `Claimed on ${m.trip.fromShort}→${m.trip.toShort}`,
                                );
                              }}
                            >
                              Claim on this route · {formatCurrency(d.offer)}
                            </Button>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
                {d.trackingCode && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      to="/track/$code"
                      params={{ code: d.trackingCode }}
                    >
                      Track {d.trackingCode}
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <Button variant="outline" className="mt-3 w-full" asChild>
          <Link to="/deliveries/request">
            <Package className="size-4" />
            Post a delivery request
          </Link>
        </Button>
      </section>

      <section className="mt-8 pb-4">
        <h2 className="font-display text-lg font-semibold">
          Trips accepting cargo
        </h2>
        <p className="mb-3 text-sm text-[var(--color-fg-muted)]">
          Book a delivery seat on any of these routes
        </p>
        <div className="flex flex-col gap-3">
          {cargoTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

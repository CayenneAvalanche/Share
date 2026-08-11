import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { Car, Plus, Star, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { NearMeBar } from "@/components/share/near-me-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { DashcamBadge } from "@/components/share/dashcam-badge";
import { useShareStore } from "@/lib/share/store";
import { PLATFORM_TAKE_RATE } from "@/lib/share/data";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useMyAppStatus } from "@/lib/share/use-my-apps";
import { PhotoField } from "@/components/share/photo-field";
import { listCarListingsFn } from "@/lib/share/server-fns";
import {
  DEFAULT_RADIUS_CARS,
  filterSortByRadius,
  formatMiles,
  loadSearchCity,
  loadSearchRadius,
  saveSearchCity,
  saveSearchRadius,
} from "@/lib/share/geo";

export const Route = createFileRoute("/cars")({
  component: CarsLayout,
});

function CarsLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <CarsPage />;
}

function CarsPage() {
  const cars = useShareStore((s) => s.carListings);

  useEffect(() => {
    let cancelled = false;
    listCarListingsFn()
      .then(async (res) => {
        if (cancelled) return;
        const cloudIds = new Set(res.cars.map((c) => c.id));
        useShareStore.setState((s) => {
          const byId = new Map(s.carListings.map((c) => [c.id, c]));
          for (const c of res.cars) byId.set(c.id, c);
          return { carListings: Array.from(byId.values()) };
        });
        const localOnly = useShareStore
          .getState()
          .carListings.filter(
            (c) => c.id.startsWith("car_") && !cloudIds.has(c.id),
          );
        const { createCarListingFn } = await import("@/lib/share/server-fns");
        for (const c of localOnly.slice(0, 15)) {
          try {
            await createCarListingFn({
              data: c as unknown as Record<string, unknown>,
            });
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const bookCar = useShareStore((s) => s.bookCar);
  const carBookings = useShareStore((s) => s.carBookings);
  const idVerified = useShareStore((s) => s.idVerified);
  const riderName = useShareStore((s) => s.riderName);
  const drivingHistoryDoc = useShareStore((s) => s.drivingHistoryDoc);
  const setDrivingHistory = useShareStore((s) => s.setDrivingHistory);
  const isDriverApproved = useShareStore((s) => s.isDriverApproved);
  const user = useCurrentUser();
  const { driverActive, canApplyDriver, latestDriver } = useMyAppStatus();
  const canRent =
    (driverActive || isDriverApproved) && Boolean(drivingHistoryDoc);
  const [daysById, setDaysById] = useState<Record<string, number>>({});
  const [nearCity, setNearCity] = useState("Lafayette, LA");
  const [radius, setRadius] = useState(DEFAULT_RADIUS_CARS);

  useEffect(() => {
    setNearCity(loadSearchCity());
    setRadius(loadSearchRadius(DEFAULT_RADIUS_CARS));
  }, []);

  const nearbyCars = useMemo(() => {
    return filterSortByRadius(
      cars.filter((c) => c.available),
      (c) => c.city,
      nearCity,
      radius,
    );
  }, [cars, nearCity, radius]);

  const me = (user?.displayName || riderName || "").toLowerCase();
  const myCars = useMemo(
    () =>
      cars.filter(
        (c) =>
          c.id.startsWith("car_") ||
          (me && c.ownerName.toLowerCase().includes(me.split(" ")[0] || me)),
      ),
    [cars, me],
  );

  return (
    <AppShell
      title="Share a car"
      subtitle="List · reserve · pay host in person (pilot)"
      solidHeader
      action={
        <Button size="sm" asChild>
          <Link to="/cars/new">
            <Plus className="size-4" />
            List
          </Link>
        </Button>
      }
    >
      <Card className="mt-3 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
        <CardContent className="flex gap-3 p-4">
          <Car className="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
          <div className="text-sm text-[var(--color-fg-muted)]">
            <p className="font-semibold text-[var(--color-fg)]">
              Peer cars by the day
            </p>
            <p className="mt-1">
              Host lists a car → renter reserves → meet up and settle payment
              in person for the pilot. Platform take ~{Math.round(PLATFORM_TAKE_RATE * 100)}%
              only when card payments go live. Tools stay under{" "}
              <Link to="/share-stuff" className="underline">
                Lagniappe
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-3 border-[var(--color-border)]">
        <CardContent className="space-y-3 p-4 text-sm">
          <p className="font-semibold text-[var(--color-fg)]">
            To rent a car on Share
          </p>
          <ul className="list-disc space-y-1 pl-5 text-[var(--color-fg-muted)]">
            <li>
              Be an{" "}
              <strong className="text-[var(--color-fg)]">approved driver</strong>{" "}
              (same application under Drivers in founder inbox)
            </li>
            <li>
              Upload your{" "}
              <strong className="text-[var(--color-fg)]">
                DMV driving history
              </strong>{" "}
              (motor vehicle record / official printout or clear photo)
            </li>
            <li>Then Reserve — pay host in person during the pilot</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            {driverActive || isDriverApproved ? (
              <Badge variant="success">Driver approved</Badge>
            ) : (
              <Button size="sm" asChild>
                <Link to="/apply/driver">Apply as driver first</Link>
              </Button>
            )}
            {drivingHistoryDoc ? (
              <Badge variant="success">Driving history on file</Badge>
            ) : (
              <Badge variant="outline">Driving history needed</Badge>
            )}
          </div>
          {!drivingHistoryDoc && (driverActive || isDriverApproved || canApplyDriver) && (
            <div className="border-t border-[var(--color-border)] pt-3">
              <PhotoField
                id="dmv-history"
                label="DMV driving history"
                hint="Photo of your official driving record from the DMV / OMV. Required before any car rental."
                value={drivingHistoryDoc}
                onChange={(url) => {
                  setDrivingHistory(url);
                  toast.success("Driving history saved — you can reserve when approved");
                }}
                facing="environment"
                kind="document"
                captureFirst={false}
              />
            </div>
          )}
          {drivingHistoryDoc && (
            <p className="text-xs text-[var(--color-fg-subtle)]">
              History on file
              {latestDriver?.fullName ? ` for ${latestDriver.fullName}` : ""}.
              Re-upload anytime by clearing from You (or re-save below).
            </p>
          )}
          {drivingHistoryDoc && (
            <PhotoField
              id="dmv-history-replace"
              label="Replace driving history"
              value={drivingHistoryDoc}
              onChange={(url) => {
                setDrivingHistory(url);
                toast.success("Driving history updated");
              }}
              facing="environment"
              kind="document"
              captureFirst={false}
            />
          )}
        </CardContent>
      </Card>

      {myCars.some((c) => c.id.startsWith("car_")) && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-[var(--color-fg-muted)]">
            Your listings
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-fg-subtle)]">
            Saved on this phone — open an incognito window or another account to
            test Reserve as a renter.
          </p>
        </section>
      )}

      {carBookings.length > 0 && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-[var(--color-fg-muted)]">
            Your car reservations
          </h2>
          <div className="mt-2 space-y-2">
            {carBookings.map((b) => {
              const car = cars.find((c) => c.id === b.carId);
              return (
                <Card key={b.id}>
                  <CardContent className="space-y-1 p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">
                        {car?.makeModel ?? "Car"} · {b.days} day
                        {b.days > 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(b.total)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      Status: {b.status} · Pay host in person ·{" "}
                      {car?.ownerName ? `Host: ${car.ownerName}` : "Host TBD"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-4">
        <NearMeBar
          idPrefix="cars"
          city={nearCity}
          radius={radius}
          onCityChange={(c) => {
            setNearCity(c);
            saveSearchCity(c);
          }}
          onRadiusChange={(mi) => {
            setRadius(mi);
            saveSearchRadius(mi);
          }}
          hint="Metro radius — Kansas City MO can see Kansas City KS. Far states stay out of the list."
        />
      </div>

      <section className="mt-5 space-y-3 pb-8">
        <h2 className="font-display text-lg font-semibold">
          Cars near {nearCity.split(",")[0] || "you"}
        </h2>
        {nearbyCars.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-[var(--color-fg-muted)]">
              No cars in this radius. Widen miles, switch city, or tap{" "}
              <Link to="/cars/new" className="font-semibold underline">
                List
              </Link>
              .
            </CardContent>
          </Card>
        )}
        {nearbyCars.map((car) => {
            const days = daysById[car.id] ?? 2;
            const total = car.ratePerDay * days;
            const hostKeeps = Math.round(total * (1 - PLATFORM_TAKE_RATE));
            const isMine = car.id.startsWith("car_");
            return (
              <Card key={car.id} className="overflow-hidden">
                {car.photoUrl ? (
                  <div className="relative aspect-[16/10] w-full bg-[var(--color-bg-subtle)]">
                    <img
                      src={car.photoUrl}
                      alt={`${car.year} ${car.makeModel}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                      {car.year} {car.makeModel}
                    </div>
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                      {formatCurrency(car.ratePerDay)}
                      <span className="font-normal opacity-80"> / day</span>
                    </div>
                    {isMine && (
                      <div className="absolute left-2 top-2 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[11px] font-semibold text-white">
                        Your listing
                      </div>
                    )}
                  </div>
                ) : null}
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">
                        {car.year} {car.makeModel}
                      </p>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {car.city} · {car.ownerName}
                        {isMine ? " · you" : ""}
                        {car.distanceMiles != null
                          ? ` · ${formatMiles(car.distanceMiles)}`
                          : ""}
                      </p>
                    </div>
                    {!car.photoUrl && (
                      <div className="text-right">
                        <p className="font-display text-xl font-semibold text-[var(--color-primary)]">
                          {formatCurrency(car.ratePerDay)}
                        </p>
                        <p className="text-xs text-[var(--color-fg-subtle)]">
                          / day
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">
                      <Users className="mr-1 size-3" />
                      {car.seats} seats
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {car.transmission}
                    </Badge>
                    <Badge variant="outline">
                      Deposit {formatCurrency(car.deposit)}
                    </Badge>
                    <DashcamBadge hasDashcam={car.hasDashcam} />
                    <Badge variant="success">
                      <Star className="mr-1 size-3 fill-current" />
                      {car.rating.toFixed(2)}
                    </Badge>
                    {isMine && <Badge>Your car</Badge>}
                  </div>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    {car.rules}
                  </p>
                  <p className="flex items-start gap-1.5 text-xs text-[var(--color-fg-subtle)]">
                    <Shield className="mt-0.5 size-3.5 shrink-0" />
                    {car.insuranceNote}
                  </p>
                  <div className="flex items-end gap-2 border-t border-[var(--color-border)] pt-3">
                    <div className="flex-1">
                      <Label htmlFor={`d-${car.id}`}>Days</Label>
                      <Input
                        id={`d-${car.id}`}
                        type="number"
                        min={1}
                        max={14}
                        value={days}
                        onChange={(e) =>
                          setDaysById((m) => ({
                            ...m,
                            [car.id]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-[var(--color-fg-muted)]">You pay</p>
                      <p className="font-semibold">{formatCurrency(total)}</p>
                      <p className="text-[10px] text-[var(--color-fg-subtle)]">
                        Host ~{formatCurrency(hostKeeps)} after take (when live)
                      </p>
                    </div>
                    <Button
                      disabled={isMine || (!canRent && !isMine)}
                      onClick={() => {
                        if (isMine) {
                          toast.message(
                            "This is your listing — reserve from another phone/account",
                          );
                          return;
                        }
                        if (!(driverActive || isDriverApproved)) {
                          toast.error(
                            "You must be an approved Share driver to rent a car",
                          );
                          return;
                        }
                        if (!drivingHistoryDoc) {
                          toast.error(
                            "Upload your DMV driving history above before reserving",
                          );
                          return;
                        }
                        if (!idVerified) {
                          toast.message(
                            "Tip: finish ID verify under You when you can",
                          );
                        }
                        bookCar(car.id, days);
                        toast.success("Car reserved", {
                          description:
                            "Contact the host and pay in person for the pilot. Deposit terms are on the listing.",
                        });
                      }}
                    >
                      {isMine
                        ? "Yours"
                        : !driverActive && !isDriverApproved
                          ? "Driver required"
                          : !drivingHistoryDoc
                            ? "Need DMV history"
                            : "Reserve"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </section>
    </AppShell>
  );
}

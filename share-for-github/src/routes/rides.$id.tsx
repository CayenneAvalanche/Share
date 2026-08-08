import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Star,
  ShieldCheck,
  Heart,
  Users,
  Package,
  Clock,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { DashcamBadge } from "@/components/share/dashcam-badge";
import { DriverStory } from "@/components/share/driver-story";
import {
  getDriver,
  SCHEDULE_LABELS,
  PLATFORM_TAKE_RATE,
  type DriverPreference,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import {
  formatCurrency,
  formatDate,
  formatTime,
} from "@/lib/utils";

export const Route = createFileRoute("/rides/$id")({
  component: RideDetailPage,
});

function RideDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const trips = useShareStore((s) => s.trips);
  const bookRide = useShareStore((s) => s.bookRide);
  const bookDelivery = useShareStore((s) => s.bookDelivery);
  const favorites = useShareStore((s) => s.favoriteDriverIds);
  const toggleFavoriteDriver = useShareStore((s) => s.toggleFavoriteDriver);
  const startThread = useShareStore((s) => s.startThread);

  const [mode, setMode] = useState<"ride" | "delivery">("ride");
  const [seats, setSeats] = useState(1);
  const [dashcamAck, setDashcamAck] = useState(false);
  const [cargo, setCargo] = useState("");
  const [driverPreference, setDriverPreference] =
    useState<DriverPreference>("any");
  const [done, setDone] = useState(false);

  const trip = trips.find((t) => t.id === id);

  if (!trip) {
    return (
      <AppShell title="Trip" backTo="/rides" solidHeader>
        <p className="py-12 text-center text-[var(--color-fg-muted)]">
          Trip not found.
        </p>
        <Button asChild className="mx-auto block w-fit">
          <Link to="/rides">Browse rides</Link>
        </Button>
      </AppShell>
    );
  }

  const driver = getDriver(trip.driverId);
  const total =
    mode === "ride" ? seats * trip.pricePerSeat : trip.deliveryRate;
  const driverEarns = Math.round(total * (1 - PLATFORM_TAKE_RATE));
  const isFav = driver ? favorites.includes(driver.id) : false;

  function handleBook() {
    if (!trip) return;
    if (driver?.hasDashcam && !dashcamAck) {
      toast.error("Confirm you understand dashcam may record audio/video");
      return;
    }
    if (mode === "ride") {
      if (
        driverPreference === "woman" &&
        driver &&
        driver.gender !== "woman"
      ) {
        toast.error(
          "This trip’s driver doesn’t match woman-driver preference.",
        );
        return;
      }
      if (driverPreference === "man" && driver && driver.gender !== "man") {
        toast.error("This trip’s driver doesn’t match man-driver preference.");
        return;
      }
      const booking = bookRide(trip.id, seats, cargo, {
        driverPreference,
        preferredDriverId: driver?.id,
      });
      if (!booking) {
        toast.error("Not enough seats available");
        return;
      }
      toast.success("Ride reserved");
    } else {
      if (!cargo.trim()) {
        toast.error("Describe what you are sending");
        return;
      }
      bookDelivery(trip.id, cargo);
      toast.success("Delivery reserved with this trip");
    }
    setDone(true);
  }

  if (done) {
    return (
      <AppShell title="Confirmed" backTo="/trips" solidHeader>
        <div className="flex flex-col items-center py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <ShieldCheck className="size-8" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold">
            You’re on the trip
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-muted)]">
            Chat in Messages, pay in Checkout, and use SOS on My trips while
            you’re rolling.
          </p>
          <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
            <Button onClick={() => navigate({ to: "/checkout" })}>
              Pay with Stripe (demo)
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (!driver) return;
                const tid = startThread({
                  subject: `${trip.fromShort} → ${trip.toShort} · ${driver.name}`,
                  withName: driver.name,
                  relatedType: "ride",
                  relatedId: trip.id,
                  firstMessage:
                    "Hi — just booked. Confirming pickup details here.",
                });
                navigate({ to: "/messages/$id", params: { id: tid } });
              }}
            >
              Message driver
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/trips" })}>
              My trips (SOS lives here)
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`${trip.fromShort} → ${trip.toShort}`}
      subtitle={`${formatDate(trip.departAt)} · ${formatTime(trip.departAt)}`}
      backTo="/rides"
      solidHeader
    >
      <div className="space-y-4 py-3 pb-10">
        {trip.vehiclePhoto && (
          <Card className="overflow-hidden">
            <div className="aspect-[16/9] w-full bg-[var(--color-bg-subtle)]">
              <img
                src={trip.vehiclePhoto}
                alt={trip.vehicleLabel || trip.vehicleType || "Vehicle"}
                className="h-full w-full object-cover"
              />
            </div>
            {(trip.vehicleType || trip.vehicleLabel) && (
              <CardContent className="p-3 text-sm text-[var(--color-fg-muted)]">
                {[trip.vehicleType, trip.vehicleLabel].filter(Boolean).join(" · ")}
              </CardContent>
            )}
          </Card>
        )}
        <Card className="overflow-hidden">
          <div className="bg-[var(--color-bg-inverse)] px-5 py-5 text-[var(--color-fg-inverse)]">
            <p className="text-xs uppercase tracking-wide opacity-70">
              {formatDate(trip.departAt)} · {formatTime(trip.departAt)}
            </p>
            <p className="mt-1 font-display text-3xl font-semibold">
              {trip.fromShort} → {trip.toShort}
            </p>
            <p className="mt-1 text-sm opacity-80">
              {trip.from} → {trip.to}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span>{formatCurrency(total)} you pay</span>
              <span>
                ~{formatCurrency(driverEarns)} driver (
                {Math.round((1 - PLATFORM_TAKE_RATE) * 100)}%)
              </span>
            </div>
          </div>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-[var(--color-primary)]" />
              {trip.distanceMiles} mi · ~{trip.durationHours}h
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-[var(--color-primary)]" />
              Arrive {formatTime(trip.arriveAt)}
            </div>
            {trip.stops.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-fg-subtle)]">
                  Stops
                </p>
                <p className="mt-0.5 text-sm">{trip.stops.join(" · ")}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-fg-subtle)]">
                Schedule
              </p>
              <p className="mt-0.5 text-sm">{SCHEDULE_LABELS[trip.schedule]}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-fg-subtle)]">
                Cargo
              </p>
              <p className="mt-0.5 text-sm">{trip.cargoCapacity}</p>
            </div>
            {trip.notes && (
              <p className="text-sm text-[var(--color-fg-muted)]">{trip.notes}</p>
            )}
          </CardContent>
        </Card>

        {driver && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                style={{
                  background: `hsl(${driver.avatarHue} 35% 38%)`,
                }}
              >
                {driver.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold">{driver.name}</p>
                  {driver.verified && (
                    <ShieldCheck className="size-4 text-[var(--color-primary)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {driver.city} · {driver.trips} trips · {driver.vehicle}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {driver.gender === "woman" && (
                    <Badge variant="accent">Woman driver</Badge>
                  )}
                  <DashcamBadge
                    hasDashcam={driver.hasDashcam}
                    note={driver.dashcamNote}
                  />
                  <Badge variant="success">Screened</Badge>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1 font-semibold">
                  <Star className="size-4 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                  {driver.rating.toFixed(2)}
                </div>
                <Button
                  size="sm"
                  variant={isFav ? "default" : "outline"}
                  onClick={() => {
                    toggleFavoriteDriver(driver.id);
                    toast.message(
                      isFav ? "Removed preferred driver" : "Saved as preferred",
                    );
                  }}
                >
                  <Heart
                    className={`size-3.5 ${isFav ? "fill-current" : ""}`}
                  />
                  {isFav ? "Preferred" : "Prefer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {driver && <DriverStory driver={driver} />}

        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-display text-lg font-semibold">Book this trip</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("ride")}
                className={`flex items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  mode === "ride"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-fg-muted)]"
                }`}
              >
                <Users className="size-4" />
                Ride
              </button>
              <button
                type="button"
                onClick={() => setMode("delivery")}
                className={`flex items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  mode === "delivery"
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/8 text-[var(--color-accent)]"
                    : "border-[var(--color-border)] text-[var(--color-fg-muted)]"
                }`}
              >
                <Package className="size-4" />
                Delivery
              </button>
            </div>

            {mode === "ride" && (
              <>
                <div>
                  <Label htmlFor="seats">Seats</Label>
                  <Input
                    id="seats"
                    type="number"
                    min={1}
                    max={trip.seatsAvailable}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                  />
                  <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                    {trip.seatsAvailable} available
                  </p>
                </div>
                <div>
                  <Label htmlFor="pref">Driver preference note</Label>
                  <select
                    id="pref"
                    className="mt-1 flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm"
                    value={driverPreference}
                    onChange={(e) =>
                      setDriverPreference(e.target.value as DriverPreference)
                    }
                  >
                    <option value="any">Any verified driver</option>
                    <option value="woman">Woman driver preferred</option>
                    <option value="man">Man driver preferred</option>
                    <option value="preferred">Use my preferred list</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="cargo">
                {mode === "ride" ? "Bags / notes" : "What are you sending?"}
              </Label>
              <Textarea
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder={
                  mode === "ride"
                    ? "One medium suitcase…"
                    : "Boxed printer, fragile…"
                }
              />
            </div>

            {driver?.hasDashcam && (
              <label className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-[var(--color-primary)]"
                  checked={dashcamAck}
                  onChange={(e) => setDashcamAck(e.target.checked)}
                />
                <span>
                  I understand this driver may record <strong>road and cabin
                  audio/video</strong> for safety
                  {driver.dashcamNote ? ` (${driver.dashcamNote})` : ""}.
                </span>
              </label>
            )}

            <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-sm">
              <div className="flex justify-between">
                <span>You pay · driver ~{Math.round((1 - PLATFORM_TAKE_RATE) * 100)}%</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
              {mode === "delivery" && (
                <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
                  Flat cargo rate {formatCurrency(trip.deliveryRate)}
                </p>
              )}
            </div>

            <Button className="w-full" size="lg" onClick={handleBook}>
              Confirm {mode === "ride" ? "seat" : "delivery"}
            </Button>
            <p className="text-center text-[10px] text-[var(--color-fg-subtle)]">
              Cancel free until 12h before depart · no-show may lose fare (pilot
              rules)
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

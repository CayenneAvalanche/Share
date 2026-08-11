import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Star,
  ShieldCheck,
  Heart,
  Users,
  Package,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { DashcamBadge } from "@/components/share/dashcam-badge";
import { DriverStory } from "@/components/share/driver-story";
import { PlatformGigsFromText } from "@/components/share/platform-gigs";
import { parsePlatformsText } from "@/lib/share/parse-platforms";
import {
  getDriver,
  SCHEDULE_LABELS,
  PLATFORM_TAKE_RATE,
  type DriverPreference,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { useMyAppStatus } from "@/lib/share/use-my-apps";
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
  const deleteTrip = useShareStore((s) => s.deleteTrip);
  const profileSelfie = useShareStore((s) => s.profileSelfie);
  const riderName = useShareStore((s) => s.riderName);
  const driverApps = useShareStore((s) => s.driverApps);
  const myVehicles = useShareStore((s) => s.myVehicles);
  const { latestDriver } = useMyAppStatus();

  const [mode, setMode] = useState<"ride" | "delivery">("ride");
  const [seats, setSeats] = useState(1);
  const [dashcamAck, setDashcamAck] = useState(false);
  const [cargo, setCargo] = useState("");
  const [driverPreference, setDriverPreference] =
    useState<DriverPreference>("any");
  const [done, setDone] = useState(false);
  const [showDriverMore, setShowDriverMore] = useState(false);

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

  const item = trip;
  // Member posts must NEVER pull demo seed drivers (d1 = Travis + Highlander)
  const isMemberTrip =
    item.id.startsWith("user_") ||
    item.driverId === "member" ||
    Boolean(item.postedByEmail);
  const seedDriver = isMemberTrip ? undefined : getDriver(item.driverId);
  const driver = seedDriver;
  const total =
    mode === "ride" ? seats * item.pricePerSeat : item.deliveryRate;
  const driverEarns = Math.round(total * (1 - PLATFORM_TAKE_RATE));
  const isFav = driver ? favorites.includes(driver.id) : false;
  const isOwner = isMemberTrip;
  const face =
    item.driverSelfie ||
    (isMemberTrip ? profileSelfie : "") ||
    "";
  // Real vehicle for this trip (what the poster entered) — not demo garage
  const tripVehicle =
    [item.vehicleType, item.vehicleLabel].filter(Boolean).join(" · ") ||
    item.vehicleLabel ||
    item.vehicleType ||
    myVehicles.find((v) => v.isDefault)?.label ||
    myVehicles[0]?.label ||
    "";
  // Real bio from driver application when this is a member post
  const appDriver =
    isMemberTrip
      ? latestDriver ||
        driverApps.find(
          (a) =>
            item.postedByEmail &&
            a.email?.toLowerCase() === item.postedByEmail.toLowerCase(),
        ) ||
        driverApps[0]
      : undefined;

  function handleDelete() {
    if (
      !window.confirm(
        "Delete this trip post? Riders will no longer see it. This cannot be undone.",
      )
    ) {
      return;
    }
    deleteTrip(item.id);
    toast.success("Trip deleted");
    navigate({ to: "/rides" });
  }

  function handleBook() {
    if (!item) return;
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
      const booking = bookRide(item.id, seats, cargo, {
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
      bookDelivery(item.id, cargo);
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
                  subject: `${item.fromShort} → ${item.toShort} · ${driver.name}`,
                  withName: driver.name,
                  relatedType: "ride",
                  relatedId: item.id,
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
      title={`${item.fromShort} → ${item.toShort}`}
      subtitle={`${formatDate(item.departAt)} · ${formatTime(item.departAt)}`}
      backTo="/rides"
      solidHeader
    >
      <div className="space-y-4 py-3 pb-10">

        {isOwner && (
          <Card className="border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Your trip post</p>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Edit details or remove it and post again.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    navigate({
                      to: "/rides/post",
                      search: { edit: item.id },
                    })
                  }
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={handleDelete}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="bg-[var(--color-bg-inverse)] px-5 py-5 text-[var(--color-fg-inverse)]">
            <p className="text-xs uppercase tracking-wide opacity-70">
              {formatDate(item.departAt)} · {formatTime(item.departAt)}
            </p>
            <p className="mt-1 font-display text-3xl font-semibold">
              {item.fromShort} → {item.toShort}
            </p>
            <p className="mt-1 text-sm opacity-80">
              {item.from} → {item.to}
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
              {item.distanceMiles} mi · ~{item.durationHours}h
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-[var(--color-primary)]" />
              Arrive {formatTime(item.arriveAt)}
            </div>
            {item.stops.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-fg-subtle)]">
                  Stops
                </p>
                <p className="mt-0.5 text-sm">{item.stops.join(" · ")}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-fg-subtle)]">
                Schedule
              </p>
              <p className="mt-0.5 text-sm">{SCHEDULE_LABELS[item.schedule]}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-fg-subtle)]">
                Cargo
              </p>
              <p className="mt-0.5 text-sm">{item.cargoCapacity}</p>
            </div>
            {item.notes && (
              <p className="text-sm text-[var(--color-fg-muted)]">{item.notes}</p>
            )}
          </CardContent>
        </Card>

        {(driver || item.postedByName || face) && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              {face ? (
                <img
                  src={face}
                  alt=""
                  className="size-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                  style={{
                    background: `hsl(${driver?.avatarHue ?? 150} 35% 38%)`,
                  }}
                >
                  {(item.postedByName || driver?.name || "?").charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold">
                    {item.postedByName || driver?.name || "Share driver"}
                  </p>
                  {driver?.verified && (
                    <ShieldCheck className="size-4 text-[var(--color-primary)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {driver
                    ? `${driver.city} · ${driver.trips} trips · ${driver.vehicle}`
                    : tripVehicle || "Member trip"}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {driver?.gender === "woman" && (
                    <Badge variant="accent">Woman driver</Badge>
                  )}
                  {driver && (
                    <DashcamBadge
                      hasDashcam={driver.hasDashcam}
                      note={driver.dashcamNote}
                    />
                  )}
                  <Badge variant="success">Screened</Badge>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {driver && (
                  <div className="flex items-center gap-1 font-semibold">
                    <Star className="size-4 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                    {driver.rating.toFixed(2)}
                  </div>
                )}
                {driver && (
                  <Button
                    size="sm"
                    variant={isFav ? "default" : "outline"}
                    onClick={() => {
                      toggleFavoriteDriver(driver.id);
                      toast.message(
                        isFav
                          ? "Removed preferred driver"
                          : "Saved as preferred",
                      );
                    }}
                  >
                    <Heart
                      className={`size-3.5 ${isFav ? "fill-current" : ""}`}
                    />
                    {isFav ? "Preferred" : "Prefer"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {driver && <DriverStory driver={driver} />}

                {isMemberTrip && !driver && (
          <Card>
            <CardContent className="space-y-3 p-5">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  Know your driver
                </h3>
                <p className="text-xs text-[var(--color-fg-subtle)]">
                  From their Share profile · this trip's vehicle is listed
                  above
                </p>
              </div>
              {appDriver?.publicBio ? (
                <p className="text-sm leading-relaxed text-[var(--color-fg-muted)]">
                  {appDriver.publicBio}
                </p>
              ) : (
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {item.postedByName || "This driver"} posted this corridor trip
                  on Share.
                </p>
              )}
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
                  Vehicle on this trip
                </p>
                <p className="font-semibold text-[var(--color-fg)]">
                  {tripVehicle || "See photo above"}
                </p>
                {appDriver?.city && (
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Based in {appDriver.city}
                  </p>
                )}
              </div>
              {parsePlatformsText(appDriver?.platformsText).length > 0 && (
                <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => setShowDriverMore((v) => !v)}
                  >
                    <span>
                      {showDriverMore
                        ? "Hide platform history"
                        : "Learn more about this driver"}
                    </span>
                    {showDriverMore ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </Button>
                  {showDriverMore && (
                    <PlatformGigsFromText text={appDriver?.platformsText} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}


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
                    max={item.seatsAvailable}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                  />
                  <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                    {item.seatsAvailable} available
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
                  Flat cargo rate {formatCurrency(item.deliveryRate)}
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

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCircle2, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  DRIVERS,
  LOCAL_SPOTS,
  PREF_LABELS,
  estimateLocalFares,
  type DriverPreference,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { formatCurrency } from "@/lib/utils";
import {
  countAvailableDriversFn,
  setDriverAvailableFn,
} from "@/lib/share/server-fns";

export const Route = createFileRoute("/local")({
  component: LocalRidePage,
});

function LocalRidePage() {
  const requestLocalRide = useShareStore((s) => s.requestLocalRide);
  const localRides = useShareStore((s) => s.localRides);
  const riderName = useShareStore((s) => s.riderName);
  const favorites = useShareStore((s) => s.favoriteDriverIds);

  const [pickup, setPickup] = useState<string>(LOCAL_SPOTS[0]);
  const [dropoff, setDropoff] = useState<string>(LOCAL_SPOTS[1]);
  const [when, setWhen] = useState("ASAP");
  const [seats, setSeats] = useState(1);
  const [notes, setNotes] = useState("");
  const [driverPreference, setDriverPreference] =
    useState<DriverPreference>("any");
  const [preferredDriverId, setPreferredDriverId] = useState(
    favorites[0] ?? DRIVERS[0].id,
  );
  const [doneId, setDoneId] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [availCount, setAvailCount] = useState(0);
  const [presenceId, setPresenceId] = useState<string | undefined>();

  useEffect(() => {
    void countAvailableDriversFn()
      .then((r) => setAvailCount(r.availableCount))
      .catch(() => {});
  }, []);

  const fares = useMemo(
    () => estimateLocalFares(pickup, dropoff),
    [pickup, dropoff],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pickup === dropoff) {
      toast.error("Pick two different places");
      return;
    }
    const ride = requestLocalRide({
      pickup,
      dropoff,
      when,
      seats,
      notes: notes.trim(),
      sharePrice: fares.sharePrice,
      uberEstimate: fares.uberEstimate,
      lyftEstimate: fares.lyftEstimate,
      requesterName: riderName || "Guest",
      driverPreference,
      preferredDriverId:
        driverPreference === "preferred" ? preferredDriverId : undefined,
    });
    setDoneId(ride.id);
    toast.success("Pinged nearby Share drivers");
  }

  if (doneId) {
    const ride = localRides.find((r) => r.id === doneId);
    return (
      <AppShell title="Broadcasting" backTo="/app" solidHeader>
        <div className="flex flex-col items-center py-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <Bell className="size-8" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold">
            Drivers notified
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-muted)]">
            Preference:{" "}
            <strong className="text-[var(--color-fg)]">
              {ride ? PREF_LABELS[ride.driverPreference] : "—"}
            </strong>
            . Share price{" "}
            <strong className="text-[var(--color-fg)]">
              {ride ? formatCurrency(ride.sharePrice) : "—"}
            </strong>
            . Founder inbox can match from Admin.
          </p>
          {ride && (
            <Card className="mt-6 w-full text-left">
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--color-fg-muted)]">From</span>
                  <span className="text-right font-medium">{ride.pickup}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--color-fg-muted)]">To</span>
                  <span className="text-right font-medium">{ride.dropoff}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-fg-muted)]">Share</span>
                  <span className="font-semibold text-[var(--color-primary)]">
                    {formatCurrency(ride.sharePrice)}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--color-fg-subtle)]">
                  <span>Uber est.</span>
                  <span>{formatCurrency(ride.uberEstimate)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-fg-subtle)]">
                  <span>Lyft est.</span>
                  <span>{formatCurrency(ride.lyftEstimate)}</span>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button onClick={() => setDoneId(null)}>Request another</Button>
            <Button variant="outline" asChild>
              <Link to="/profile">Your profile</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Local ride"
      subtitle="Compare Share · Uber · Lyft"
      solidHeader
      backTo="/app"
    >
      <Card className="mt-3">
        <CardContent className="flex gap-3 p-4">
          <MapPinned className="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-fg-muted)]">
            Shop needs a part across town for $10? Same flow as a ride — post it
            under Deliveries, or request a local seat with driver preferences
            (woman driver, favorite driver).
          </p>
        </CardContent>
      </Card>

      <Card className="mt-3 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">Driver Available</p>
            <p className="text-xs text-[var(--color-fg-muted)]">
              {availCount} Share driver{availCount === 1 ? "" : "s"} online nearby
              (demo radius · Lafayette hub)
            </p>
          </div>
          <Button
            type="button"
            variant={available ? "default" : "outline"}
            onClick={async () => {
              const next = !available;
              setAvailable(next);
              try {
                const res = await setDriverAvailableFn({
                  data: {
                    displayName: riderName || "Driver",
                    city: "Lafayette, LA",
                    available: next,
                    presenceId,
                  },
                });
                setPresenceId(res.presenceId);
                setAvailCount(res.availableCount);
                toast.success(next ? "You're Available" : "Went offline");
              } catch {
                toast.message(next ? "Available (local)" : "Offline (local)");
              }
            }}
          >
            {available ? "● Available" : "Go available"}
          </Button>
        </CardContent>
      </Card>

      <form onSubmit={onSubmit} className="mt-4 space-y-4 pb-8">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <Label htmlFor="pickup">Pickup</Label>
              <Select
                id="pickup"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              >
                {LOCAL_SPOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="dropoff">Drop-off</Label>
              <Select
                id="dropoff"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
              >
                {LOCAL_SPOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="when">When</Label>
                <Select
                  id="when"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                >
                  <option>ASAP</option>
                  <option>In 30 minutes</option>
                  <option>In 1 hour</option>
                  <option>Tonight</option>
                  <option>Tomorrow morning</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  max={4}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pref">Driver preference</Label>
              <Select
                id="pref"
                value={driverPreference}
                onChange={(e) =>
                  setDriverPreference(e.target.value as DriverPreference)
                }
              >
                <option value="any">Any approved driver</option>
                <option value="woman">Woman driver preferred</option>
                <option value="man">Man driver preferred</option>
                <option value="preferred">Specific preferred driver</option>
              </Select>
            </div>
            {driverPreference === "preferred" && (
              <div>
                <Label htmlFor="fav">Preferred driver</Label>
                <Select
                  id="fav"
                  value={preferredDriverId}
                  onChange={(e) => setPreferredDriverId(e.target.value)}
                >
                  {DRIVERS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {favorites.includes(d.id) ? " ★" : ""} — {d.city}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bags, package handoff, curb pickup…"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-display text-lg font-semibold">
              Price comparison
            </h2>
            <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
              Demo estimates — not live Uber/Lyft API prices.
            </p>
            <div className="mt-4 space-y-2">
              <PriceRow
                label="Share"
                amount={fares.sharePrice}
                highlight
                note="~10% platform take target"
              />
              <PriceRow
                label="Uber (est.)"
                amount={fares.uberEstimate}
                note="typical on-demand"
              />
              <PriceRow
                label="Lyft (est.)"
                amount={fares.lyftEstimate}
                note="typical on-demand"
              />
            </div>
            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-primary)]/8 px-3 py-2 text-sm">
              Save about{" "}
              <strong>
                {formatCurrency(fares.uberEstimate - fares.sharePrice)}
              </strong>{" "}
              vs Uber — drivers keep more of the pie.
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="xl" className="w-full">
          Choose Share · notify drivers
        </Button>
      </form>
    </AppShell>
  );
}

function PriceRow({
  label,
  amount,
  note,
  highlight,
}: {
  label: string;
  amount: number;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-3 ${
        highlight
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
          : "border-[var(--color-border)]"
      }`}
    >
      <div>
        <p className="flex items-center gap-1.5 font-semibold">
          {highlight && (
            <CheckCircle2 className="size-4 text-[var(--color-primary)]" />
          )}
          {label}
        </p>
        <p className="text-xs text-[var(--color-fg-subtle)]">{note}</p>
      </div>
      <p
        className={`font-display text-xl font-semibold ${
          highlight ? "text-[var(--color-primary)]" : ""
        }`}
      >
        {formatCurrency(amount)}
      </p>
    </div>
  );
}

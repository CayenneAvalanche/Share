import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { AddressField } from "@/components/share/address-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  DRIVERS,
  PREF_LABELS,
  estimateLocalFares,
  type DriverPreference,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { formatCurrency } from "@/lib/utils";
import {
  countAvailableDriversFn,
  setDriverAvailableFn,
  getMyDriverPresenceFn,
} from "@/lib/share/server-fns";
import { useMyAppStatus } from "@/lib/share/use-my-apps";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { SHARE_BUILD } from "@/lib/share/contact";

const PRESENCE_KEY = "share-driver-presence-v1";

function loadStoredPresence(): { presenceId?: string; available?: boolean } {
  try {
    const raw = localStorage.getItem(PRESENCE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as { presenceId?: string; available?: boolean };
  } catch {
    return {};
  }
}

function saveStoredPresence(presenceId: string, available: boolean) {
  try {
    localStorage.setItem(
      PRESENCE_KEY,
      JSON.stringify({ presenceId, available }),
    );
  } catch {
    /* ignore */
  }
}

export const Route = createFileRoute("/local")({
  component: LocalRidePage,
});

function LocalRidePage() {
  const requestLocalRide = useShareStore((s) => s.requestLocalRide);
  const localRides = useShareStore((s) => s.localRides);
  const riderName = useShareStore((s) => s.riderName);
  const favorites = useShareStore((s) => s.favoriteDriverIds);
  const { driverActive, latestDriver } = useMyAppStatus();
  const user = useCurrentUser();

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [when, setWhen] = useState("ASAP");
  const [seats, setSeats] = useState(1);
  const [notes, setNotes] = useState("");
  const [driverPreference, setDriverPreference] =
    useState<DriverPreference>("any");
  const [preferredDriverId, setPreferredDriverId] = useState(
    favorites[0] ?? DRIVERS[0].id,
  );
  const [doneId, setDoneId] = useState<string | null>(null);
  const stored = loadStoredPresence();
  const [available, setAvailable] = useState(Boolean(stored.available));
  const [availCount, setAvailCount] = useState(0);
  const [presenceId, setPresenceId] = useState<string | undefined>(
    stored.presenceId,
  );
  const [toggling, setToggling] = useState(false);

  const driverEmail = user?.primaryEmail || latestDriver?.email;
  const driverName =
    latestDriver?.fullName || user?.displayName || riderName || "Driver";
  const driverCity = latestDriver?.city || "Lafayette, LA";

  // Restore online status after refresh + keep count honest
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const me = await getMyDriverPresenceFn({
          data: {
            email: driverEmail,
            presenceId,
          },
        });
        if (cancelled) return;
        if (me.presenceId) {
          setPresenceId(me.presenceId);
          saveStoredPresence(me.presenceId, me.available);
        }
        setAvailable(me.available);
        setAvailCount(me.availableCount);
      } catch {
        void countAvailableDriversFn()
          .then((r) => {
            if (!cancelled) setAvailCount(r.availableCount);
          })
          .catch(() => {});
      }
    }
    void boot();
    const id = setInterval(() => {
      void countAvailableDriversFn()
        .then((r) => {
          if (!cancelled) setAvailCount(r.availableCount);
        })
        .catch(() => {});
    }, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once email/presence ready
  }, [driverEmail]);

  // Heartbeat while online so one tab/refresh doesn't leave ghost counts
  useEffect(() => {
    if (!available || !driverActive) return;
    let cancelled = false;
    async function beat() {
      try {
        const res = await setDriverAvailableFn({
          data: {
            displayName: driverName,
            email: driverEmail,
            city: driverCity,
            available: true,
            presenceId,
          },
        });
        if (cancelled) return;
        setPresenceId(res.presenceId);
        setAvailCount(res.availableCount);
        saveStoredPresence(res.presenceId, true);
      } catch {
        /* stay optimistic */
      }
    }
    void beat();
    const id = setInterval(() => void beat(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [
    available,
    driverActive,
    driverName,
    driverEmail,
    driverCity,
    presenceId,
  ]);

  const fares = useMemo(
    () => estimateLocalFares(pickup || "a", dropoff || "b"),
    [pickup, dropoff],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pu = pickup.trim();
    const doff = dropoff.trim();
    if (pu.length < 5) {
      toast.error("Enter a full pickup address (street + city)");
      return;
    }
    if (doff.length < 5) {
      toast.error("Enter a full drop-off address (street + city)");
      return;
    }
    if (pu.toLowerCase() === doff.toLowerCase()) {
      toast.error("Pickup and drop-off need to be different places");
      return;
    }
    const ride = requestLocalRide({
      pickup: pu,
      dropoff: doff,
      when,
      seats,
      notes: notes.trim(),
      sharePrice: 0, // Free local rides during pilot
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

  async function toggleAvailable() {
    if (!driverActive) {
      toast.error("Only approved active drivers can go available");
      return;
    }
    const next = !available;
    setToggling(true);
    setAvailable(next);
    try {
      const res = await setDriverAvailableFn({
        data: {
          displayName: driverName,
          email: driverEmail,
          city: driverCity,
          available: next,
          presenceId,
        },
      });
      setPresenceId(res.presenceId);
      setAvailCount(res.availableCount);
      saveStoredPresence(res.presenceId, next);
      toast.success(next ? "You're online for local rides" : "You're offline");
    } catch (e) {
      setAvailable(!next);
      toast.error(
        e instanceof Error ? e.message : "Could not update availability",
      );
    } finally {
      setToggling(false);
    }
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
            <strong className="text-[var(--color-fg)]">FREE</strong>
            .
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
                    FREE
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

  const driverLabel =
    availCount === 0
      ? "No Share drivers online nearby"
      : availCount === 1
        ? "1 Share driver online nearby"
        : `${availCount} Share drivers online nearby`;

  return (
    <AppShell
      title="Local ride"
      subtitle="Share is FREE · Uber & Lyft for comparison"
      solidHeader
      backTo="/rides"
    >
      <Card className="mt-3 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Drivers online</p>
            <p className="text-sm text-[var(--color-fg-muted)]">{driverLabel}</p>
            {driverActive && available && (
              <Badge variant="success" className="mt-2">
                You are online
              </Badge>
            )}
          </div>
          {driverActive ? (
            <Button
              type="button"
              variant={available ? "default" : "outline"}
              disabled={toggling}
              onClick={() => void toggleAvailable()}
            >
              {available ? "● Available" : "Go available"}
            </Button>
          ) : (
            <p className="max-w-[11rem] text-right text-xs text-[var(--color-fg-subtle)]">
              Active drivers can go online here
            </p>
          )}
        </CardContent>
      </Card>

      <form onSubmit={onSubmit} className="mt-4 space-y-4 pb-8">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPinned className="size-4 text-[var(--color-primary)]" />
              Where to?
            </div>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Type a full street address — suggestions appear as you type
              (Lafayette area).
            </p>
            <AddressField
              id="local-pickup"
              label="Pickup address"
              required
              value={pickup}
              onChange={setPickup}
              placeholder="Start typing street or place…"
            />
            <AddressField
              id="local-dropoff"
              label="Drop-off address"
              required
              value={dropoff}
              onChange={setDropoff}
              placeholder="Where are you going?"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="when">When</Label>
                <Input
                  id="when"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  placeholder="ASAP"
                />
              </div>
              <div>
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  max={6}
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
                {(Object.keys(PREF_LABELS) as DriverPreference[]).map((k) => (
                  <option key={k} value={k}>
                    {PREF_LABELS[k]}
                  </option>
                ))}
              </Select>
            </div>
            {driverPreference === "preferred" && (
              <div>
                <Label htmlFor="fav">Favorite driver</Label>
                <Select
                  id="fav"
                  value={preferredDriverId}
                  onChange={(e) => setPreferredDriverId(e.target.value)}
                >
                  {DRIVERS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
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
                placeholder="Apt #, gate code, bags, bus stop nearby…"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid grid-cols-3 gap-2 p-4 text-center">
            <div>
              <p className="text-xs text-[var(--color-fg-subtle)]">Share</p>
              <p className="font-semibold text-[var(--color-primary)]">FREE</p>
              <p className="mt-0.5 text-[10px] text-[var(--color-fg-subtle)]">
                pilot
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-fg-subtle)]">Uber est.</p>
              <p className="font-semibold">
                {formatCurrency(fares.uberEstimate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-fg-subtle)]">Lyft est.</p>
              <p className="font-semibold">
                {formatCurrency(fares.lyftEstimate)}
              </p>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-[10px] text-[var(--color-fg-subtle)]">
          Share local rides are free during the pilot · Uber/Lyft are rough
          comparison only · {SHARE_BUILD}
        </p>

        <Button type="submit" size="xl" className="w-full">
          Request local ride
        </Button>
      </form>
    </AppShell>
  );
}

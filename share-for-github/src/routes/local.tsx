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
  suggestedOfferFromEstimates,
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
  const [uberEst, setUberEst] = useState<string>("");
  const [lyftEst, setLyftEst] = useState<string>("");
  const [offer, setOffer] = useState<string>("");
  const [offerTouched, setOfferTouched] = useState(false);
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

  // Prefill comparison estimates from address heuristic (editable)
  useEffect(() => {
    if (!pickup.trim() || !dropoff.trim()) return;
    if (!uberEst && !lyftEst) {
      setUberEst(String(fares.uberEstimate));
      setLyftEst(String(fares.lyftEstimate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup, dropoff, fares.uberEstimate, fares.lyftEstimate]);

  const uberNum = Number(uberEst);
  const lyftNum = Number(lyftEst);
  const guideOffer = useMemo(
    () =>
      suggestedOfferFromEstimates(
        Number.isFinite(uberNum) && uberNum > 0 ? uberNum : null,
        Number.isFinite(lyftNum) && lyftNum > 0 ? lyftNum : null,
      ),
    [uberNum, lyftNum],
  );

  useEffect(() => {
    if (offerTouched) return;
    if (guideOffer != null) setOffer(String(guideOffer));
  }, [guideOffer, offerTouched]);

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
    const offerAmt = Math.max(0, Math.round(Number(offer) || 0));
    const u =
      Number.isFinite(uberNum) && uberNum > 0
        ? Math.round(uberNum)
        : fares.uberEstimate;
    const l =
      Number.isFinite(lyftNum) && lyftNum > 0
        ? Math.round(lyftNum)
        : fares.lyftEstimate;
    const ride = requestLocalRide({
      pickup: pu,
      dropoff: doff,
      when,
      seats,
      notes: notes.trim(),
      sharePrice: offerAmt,
      uberEstimate: u,
      lyftEstimate: l,
      requesterName:
        user?.displayName || riderName || "Guest",
      driverPreference,
      preferredDriverId:
        driverPreference === "preferred" ? preferredDriverId : undefined,
    });
    setDoneId(ride.id);
    toast.success(
      offerAmt > 0
        ? `Drivers notified · your offer ${formatCurrency(offerAmt)}`
        : "Drivers notified · free / $0 offer",
    );
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
            . Your offer{" "}
            <strong className="text-[var(--color-fg)]">
              {ride && ride.sharePrice > 0
                ? formatCurrency(ride.sharePrice)
                : "FREE / $0"}
            </strong>
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
                  <span className="text-[var(--color-fg-muted)]">Your offer</span>
                  <span className="font-semibold text-[var(--color-primary)]">
                    {ride.sharePrice > 0
                      ? formatCurrency(ride.sharePrice)
                      : "FREE / $0"}
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
            {ride && ride.status === "broadcasting" && (
              <Button
                variant="outline"
                className="border-[#b42318]/40 text-[#b42318]"
                onClick={() => {
                  if (
                    !confirm(
                      "Cancel this local ride? Drivers will stop seeing it.",
                    )
                  )
                    return;
                  useShareStore
                    .getState()
                    .setLocalRideStatus(
                      ride.id,
                      "cancelled",
                      "Cancelled by rider",
                    );
                  toast.success("Request cancelled");
                  setDoneId(null);
                }}
              >
                Cancel request
              </Button>
            )}
            <Button variant="secondary" asChild>
              <Link to="/rides/requests">View in Requests</Link>
            </Button>
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
      subtitle="You set the offer · Uber/Lyft optional guide"
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
          <CardContent className="space-y-4 p-4">
            <div>
              <p className="text-sm font-semibold">Price guide (optional)</p>
              <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
                Enter what Uber and Lyft show for this trip. We average them and
                take <strong className="text-[var(--color-fg)]">30% off</strong>{" "}
                as a suggested Share offer. Edit freely.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="uber-est">Uber est. $</Label>
                <Input
                  id="uber-est"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="decimal"
                  placeholder="e.g. 18"
                  value={uberEst}
                  onChange={(e) => setUberEst(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lyft-est">Lyft est. $</Label>
                <Input
                  id="lyft-est"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="decimal"
                  placeholder="e.g. 17"
                  value={lyftEst}
                  onChange={(e) => setLyftEst(e.target.value)}
                />
              </div>
            </div>
            {guideOffer != null && (
              <p className="rounded-[var(--radius-md)] bg-[var(--color-primary)]/8 px-3 py-2 text-sm text-[var(--color-fg)]">
                Suggested offer{" "}
                <strong className="text-[var(--color-primary)]">
                  {formatCurrency(guideOffer)}
                </strong>
                <span className="block text-xs text-[var(--color-fg-muted)]">
                  (avg of Uber + Lyft, then −30%)
                </span>
              </p>
            )}
            <div>
              <Label htmlFor="offer">Your OFFER $</Label>
              <Input
                id="offer"
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                required
                value={offer}
                onChange={(e) => {
                  setOfferTouched(true);
                  setOffer(e.target.value);
                }}
                placeholder={guideOffer != null ? String(guideOffer) : "0"}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                What you'll pay the driver (cash/app at drop-off for now).
                Use $0 for a free community ride.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-2">
                <p className="text-[var(--color-fg-subtle)]">Offer</p>
                <p className="font-semibold text-[var(--color-primary)]">
                  {Number(offer) > 0
                    ? formatCurrency(Math.round(Number(offer) || 0))
                    : "$0"}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-2">
                <p className="text-[var(--color-fg-subtle)]">Uber</p>
                <p className="font-semibold">
                  {Number(uberEst) > 0
                    ? formatCurrency(Math.round(Number(uberEst)))
                    : "—"}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-2">
                <p className="text-[var(--color-fg-subtle)]">Lyft</p>
                <p className="font-semibold">
                  {Number(lyftEst) > 0
                    ? formatCurrency(Math.round(Number(lyftEst)))
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-[10px] text-[var(--color-fg-subtle)]">
          Approved drivers see your offer under Rides · pay driver in person
          (pilot) · {SHARE_BUILD}
        </p>

        <Button type="submit" size="xl" className="w-full">
          Request local ride
          {Number(offer) > 0
            ? ` · offer ${formatCurrency(Math.round(Number(offer) || 0))}`
            : " · free"}
        </Button>
      </form>
    </AppShell>
  );
}

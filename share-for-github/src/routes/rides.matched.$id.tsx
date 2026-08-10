import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Phone,
  Pencil,
  CheckCircle2,
  Star,
  RotateCcw,
  Play,
  Square,
  Timer,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { AddressField } from "@/components/share/address-field";
import { SosPanel } from "@/components/share/sos-panel";
import { OpenInMaps } from "@/components/share/open-in-maps";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  VOLUNTEER_LABELS,
  type VolunteerRide,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { formatRequestedAt, formatInCarTripSummary, formatDurationSeconds, tripInCarSeconds, formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import {
  listVolunteerRidesFn,
  getVolunteerRideFn,
  reopenVolunteerRideFn,
  completeVolunteerRideFn,
  submitVolunteerReviewFn,
  cancelVolunteerRideFn,
  beginVolunteerTripFn,
  endVolunteerTripFn,
} from "@/lib/share/server-fns";

export const Route = createFileRoute("/rides/matched/$id")({
  component: MatchedRidePage,
});

function formatElapsed(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function MatchedRidePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const riderName = useShareStore((s) => s.riderName);
  const volunteerRides = useShareStore((s) => s.volunteerRides);
  const reopen = useShareStore((s) => s.reopenVolunteerForReaccept);
  const complete = useShareStore((s) => s.completeVolunteerRide);
  const rateVolunteerRide = useShareStore((s) => s.rateVolunteerRide);
  const beginTripLocal = useShareStore((s) => s.beginVolunteerTrip);
  const endTripLocal = useShareStore((s) => s.endVolunteerTrip);
  const cancelLocal = useShareStore((s) => s.cancelVolunteerRide);
  const localRides = useShareStore((s) => s.localRides);
  const setLocalRideStatus = useShareStore((s) => s.setLocalRideStatus);
  const startThread = useShareStore((s) => s.startThread);
  const threads = useShareStore((s) => s.threads);

  const [cloudRide, setCloudRide] = useState<VolunteerRide | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  /** idle → in_progress (timer) → ended (can mark complete) */
  const [tripPhase, setTripPhase] = useState<"idle" | "in_progress" | "ended">(
    "idle",
  );
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [endedDuration, setEndedDuration] = useState<string | null>(null);

  // Prefer store, then cloud
  const vol =
    volunteerRides.find((r) => r.id === id) ||
    cloudRide ||
    null;
  const local = localRides.find((r) => r.id === id);

  useEffect(() => {
    let cancelled = false;
    function guestPhone() {
      try {
        return localStorage.getItem("share-vol-guest-phone") || "";
      } catch {
        return "";
      }
    }
    function founderPin() {
      try {
        return sessionStorage.getItem("share-admin-pin") || "";
      } catch {
        return "";
      }
    }
    const pin = founderPin();
    // Direct fetch by id (founder pin unlocks any completed ride)
    getVolunteerRideFn({
      data: {
        id,
        pin: pin || undefined,
        email: user?.primaryEmail || undefined,
        phone: guestPhone(),
        driverName: user?.displayName || riderName || undefined,
      },
    })
      .then((res) => {
        if (cancelled || !res.ride) return;
        setCloudRide(res.ride);
        useShareStore.setState((s) => {
          const exists = s.volunteerRides.some((r) => r.id === res.ride!.id);
          return {
            volunteerRides: exists
              ? s.volunteerRides.map((r) =>
                  r.id === res.ride!.id ? res.ride! : r,
                )
              : [res.ride!, ...s.volunteerRides],
          };
        });
      })
      .catch(() => {});
    // Fallback list (scoped) for older deploys
    listVolunteerRidesFn({
      data: {
        email: user?.primaryEmail || undefined,
        phone: guestPhone(),
        driverName: user?.displayName || riderName || undefined,
        pin: pin || undefined,
      },
    })
      .then((res) => {
        if (cancelled) return;
        const hit = res.rides.find((r) => r.id === id);
        if (hit) {
          setCloudRide(hit);
          useShareStore.setState((s) => {
            const exists = s.volunteerRides.some((r) => r.id === hit.id);
            return {
              volunteerRides: exists
                ? s.volunteerRides.map((r) => (r.id === hit.id ? hit : r))
                : [hit, ...s.volunteerRides],
            };
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, user?.primaryEmail, user?.displayName, riderName]);

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [when, setWhen] = useState("ASAP");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");

  // Sync trip phase from cloud ride (driver Begin → rider sees SOS)
  useEffect(() => {
    if (!vol) return;
    if (vol.tripStartedAt && !vol.tripEndedAt) {
      const ms = +new Date(vol.tripStartedAt);
      if (!Number.isNaN(ms)) {
        setTripPhase("in_progress");
        setStartedAt(ms);
      }
    } else if (vol.tripStartedAt && vol.tripEndedAt) {
      setTripPhase("ended");
      const a = +new Date(vol.tripStartedAt);
      const b = +new Date(vol.tripEndedAt);
      if (!Number.isNaN(a) && !Number.isNaN(b) && b >= a) {
        setEndedDuration(formatElapsed(Math.floor((b - a) / 1000)));
      }
    }
  }, [vol?.id, vol?.tripStartedAt, vol?.tripEndedAt]);

  // Poll cloud so rider gets Begin without refresh
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        let pin = "";
        try {
          pin = sessionStorage.getItem("share-admin-pin") || "";
        } catch {
          /* ignore */
        }
        const res = await getVolunteerRideFn({
          data: {
            id,
            pin: pin || undefined,
            email: user?.primaryEmail || undefined,
            phone: (() => {
              try {
                return localStorage.getItem("share-vol-guest-phone") || "";
              } catch {
                return "";
              }
            })(),
            driverName: user?.displayName || riderName || undefined,
          },
        });
        if (cancelled || !res.ride) return;
        const hit = res.ride;
        setCloudRide(hit);
        useShareStore.setState((s) => ({
          volunteerRides: s.volunteerRides.some((r) => r.id === hit.id)
            ? s.volunteerRides.map((r) =>
                r.id === hit.id ? { ...r, ...hit } : r,
              )
            : [hit, ...s.volunteerRides],
        }));
      } catch {
        /* ignore */
      }
    }
    const t = window.setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [id, user?.primaryEmail, user?.displayName, riderName]);

  // Live timer while ride is in progress
  useEffect(() => {
    if (tripPhase !== "in_progress" || !startedAt) return;
    const tick = () =>
      setElapsedSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [tripPhase, startedAt]);

  useEffect(() => {
    if (!vol) return;
    setPickup(vol.pickup);
    setDropoff(vol.dropoff);
    setWhen(vol.when);
    setNotes(vol.notes || "");
    setPhone(vol.phone);
    setFullName(vol.fullName);
  }, [vol?.id, vol?.pickup, vol?.dropoff, vol?.when, vol?.notes, vol?.phone, vol?.fullName]);

  async function onSaveEdit() {
    if (!vol) return;
    const pu = pickup.trim();
    const doff = dropoff.trim();
    if (pu.length < 5 || doff.length < 5) {
      toast.error("Enter full pickup and drop-off addresses");
      return;
    }
    if (
      !confirm(
        "Saving changes will un-match this ride. A driver must accept it again. Continue?",
      )
    ) {
      return;
    }
    setBusy(true);
    const patch = {
      pickup: pu,
      dropoff: doff,
      when: when.trim() || "ASAP",
      notes: notes.trim(),
      phone: phone.trim(),
      fullName: fullName.trim(),
    };
    reopen(vol.id, patch);
    try {
      await reopenVolunteerRideFn({
        data: {
          id: vol.id,
          category: vol.category,
          fullName: patch.fullName,
          phone: patch.phone,
          pickup: patch.pickup,
          dropoff: patch.dropoff,
          when: patch.when,
          notes: patch.notes,
          escalateAfterHours: vol.escalateAfterHours,
          paidOffer: vol.paidOffer,
        },
      });
      toast.success("Saved — ride is open again until a driver re-accepts");
      setEditing(false);
      navigate({ to: "/rides", replace: true });
    } catch {
      toast.message("Saved on this phone — cloud sync pending");
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function onComplete() {
    if (!vol) return;
    if (!confirm("Mark this ride complete?")) return;
    try {
      sessionStorage.removeItem(`share-trip-run-${id}`);
    } catch {
      /* ignore */
    }
    // If driver forgot End ride, close the stopwatch so duration is saved
    let endedAt = vol.tripEndedAt;
    if (vol.tripStartedAt && !endedAt) {
      endedAt = new Date().toISOString();
      endTripLocal(id, endedAt);
      try {
        await endVolunteerTripFn({ data: { id: vol.id } });
      } catch {
        /* local duration still kept */
      }
    }
    complete(vol.id);
    const inCar = formatInCarTripSummary({
      tripStartedAt: vol.tripStartedAt,
      tripEndedAt: endedAt || vol.tripEndedAt,
    });
    // Go to Rides tab immediately so the driver isn't stuck on the trip screen
    navigate({ to: "/rides", replace: true });
    toast.success(
      inCar ? `Ride completed · ${inCar}` : "Ride completed — back on Rides",
    );
    try {
      await completeVolunteerRideFn({ data: { id: vol.id } });
    } catch {
      toast.message("Marked complete on this phone — cloud sync pending");
    }
  }

  async function onCancel() {
    if (!vol) return;
    if (!confirm("Cancel this ride? It moves to history.")) return;
    const actorName = user?.displayName || riderName || "Driver";
    cancelLocal(vol.id, { cancelledBy: "driver", cancelledByName: actorName });
    try {
      await cancelVolunteerRideFn({
        data: {
          id: vol.id,
          cancelledBy: "driver",
          cancelledByName: actorName,
        },
      });
      toast.success("Cancelled");
    } catch {
      toast.message("Cancelled on this phone");
    }
    navigate({ to: "/rides", replace: true });
  }

  function openTripChat(opts: {
    withName: string;
    relatedType: "volunteer" | "local";
    subject: string;
    withPhone?: string;
    withEmail?: string;
  }) {
    const first = opts.withName.split(" ")[0] || "there";
    const me = user?.displayName || riderName || "Your driver";
    let guestPhone = "";
    try {
      guestPhone = localStorage.getItem("share-vol-guest-phone") || "";
    } catch {
      /* ignore */
    }
    const phone10 = String(opts.withPhone || "")
      .replace(/\D/g, "")
      .slice(-10);
    // Same rider (phone) already has a chat → don't spam a second intro
    const already = threads.some((th) => {
      if (phone10.length >= 10) {
        if (th.id === `th_rider_${phone10}`) return true;
        if (
          (th.participantPhones || []).some(
            (p) => p.replace(/\D/g, "").slice(-10) === phone10,
          )
        ) {
          return true;
        }
      }
      return th.relatedId === id && th.relatedType === opts.relatedType;
    });
    const threadId = startThread({
      subject: opts.subject,
      withName: opts.withName,
      relatedType: opts.relatedType,
      relatedId: id,
      firstMessage: already
        ? undefined
        : `Hi ${first} — I'm ${me}. Message me here about the ride.`,
      withPhone: opts.withPhone,
      withEmail: opts.withEmail,
      myEmail: user?.primaryEmail || undefined,
      myPhone: guestPhone || undefined,
    });
    navigate({ to: "/messages/$id", params: { id: threadId } });
  }

  // Local ride detail (matched / broadcasting)
  if (!vol && local) {
    return (
      <AppShell title="Local ride" backTo="/rides" solidHeader>
        <Card className="mt-3">
          <CardContent className="space-y-3 p-5">
            <Badge>{local.status}</Badge>
            <p className="font-semibold text-lg">
              {local.pickup} → {local.dropoff}
            </p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              When: {local.when} · {local.requesterName}
            </p>
            <p className="text-base font-semibold text-[var(--color-primary)]">
              Offer{" "}
              {local.sharePrice > 0
                ? formatCurrency(local.sharePrice)
                : "FREE / $0"}
              <span className="ml-2 text-xs font-normal text-[var(--color-fg-muted)]">
                Uber ~{formatCurrency(local.uberEstimate)} · Lyft ~
                {formatCurrency(local.lyftEstimate)}
              </span>
            </p>
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Requested {formatRequestedAt(local.createdAt)}
            </p>
            {(local.status === "matched" || local.status === "broadcasting") && (
              <Button
                className="w-full"
                onClick={() =>
                  openTripChat({
                    withName: local.requesterName || "Rider",
                    relatedType: "local",
                    subject: `Local · ${local.pickup.split(",")[0]} → ${local.dropoff.split(",")[0]}`,
                    withPhone: (local as { phone?: string }).phone,
                  })
                }
              >
                <MessageCircle className="size-4" />
                Message {local.requesterName.split(" ")[0] || "rider"}
              </Button>
            )}
            {local.status === "matched" && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  setLocalRideStatus(local.id, "cancelled", "Cancelled after match");
                  toast.success("Local ride cancelled");
                  navigate({ to: "/rides", replace: true });
                }}
              >
                Cancel local ride
              </Button>
            )}
            <p className="text-xs text-[var(--color-fg-muted)]">
              Full edit + re-accept for local cloud trips is next — for now use
              Volunteer matched rides for free community trips.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (!vol) {
    return (
      <AppShell title="Ride" backTo="/rides" solidHeader>
        <Card className="mt-6">
          <CardContent className="space-y-3 p-6 text-center">
            <p className="font-semibold">Loading ride…</p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              If this stays blank, open it again from Founder inbox → Trips
              (after entering your PIN), or from Rides while signed in as the
              matched driver.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/admin">Founder inbox</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/rides">Back to Rides</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const tel = vol.phone.replace(/\D/g, "");
  const telHref = tel.length >= 10 ? `tel:+1${tel.slice(-10)}` : undefined;

  return (
    <AppShell
      title={vol.status === "matched" ? "Matched ride" : "Ride request"}
      subtitle={VOLUNTEER_LABELS[vol.category] ?? vol.category}
      backTo="/rides"
      solidHeader
    >
      <div className="mt-3 space-y-4 pb-10">
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-xl font-semibold">
                  {vol.riderLegalName || vol.fullName}
                </p>
                {vol.riderLegalName &&
                  vol.fullName &&
                  vol.riderLegalName !== vol.fullName && (
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      Request was entered as “{vol.fullName}”
                    </p>
                  )}
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {vol.phone}
                </p>
              </div>
              <Badge
                variant={
                  vol.status === "matched"
                    ? "success"
                    : vol.status === "seeking_volunteer"
                      ? "outline"
                      : "secondary"
                }
              >
                {vol.status.replace(/_/g, " ")}
              </Badge>
            </div>

            {/* Rider face: approved selfie after accept; else prompt first-ride apply */}
            {(vol.status === "matched" ||
              vol.status === "completed" ||
              vol.status === "cancelled") && (
              <div className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
                {vol.riderSelfie ? (
                  <img
                    src={vol.riderSelfie}
                    alt={`${vol.fullName} face`}
                    className="size-16 shrink-0 rounded-full object-cover ring-2 ring-[var(--color-primary)]/30"
                  />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-lg font-semibold text-[var(--color-fg-subtle)]">
                    {(vol.fullName || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1 text-sm">
                  {vol.riderSelfie ? (
                    <>
                      <p className="font-semibold text-[var(--color-fg)]">
                        Active rider · {vol.riderLegalName || vol.fullName}
                      </p>
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        Full name + selfie from their rider application — match
                        faces at pickup.
                      </p>
                    </>
                  ) : vol.riderAppStatus &&
                    vol.riderAppStatus !== "none" &&
                    vol.riderAppStatus !== "active" &&
                    vol.riderAppStatus !== "approved" ? (
                    <>
                      <p className="font-semibold text-[var(--color-fg)]">
                        Rider application:{" "}
                        {String(vol.riderAppStatus).replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        Face photo shows here once they are approved / active.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[var(--color-fg)]">
                        First ride — face not on file yet
                      </p>
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        Rider should apply so drivers can recognize them. After
                        founder approval, their selfie appears here.
                      </p>
                      <Button size="sm" className="mt-2" variant="secondary" asChild>
                        <Link to="/apply/rider">Apply as rider</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {(vol.status === "completed" ||
              (vol.tripStartedAt && vol.tripEndedAt)) && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/8 p-3 text-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
                  Trip timing (saved)
                </p>
                <p className="mt-1 font-semibold text-[var(--color-fg)]">
                  Phase 1 · Accepted / en route
                </p>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Matched
                  {vol.matchedDriverName ? ` with ${vol.matchedDriverName}` : ""}
                  {" · "}
                  requested {formatRequestedAt(vol.createdAt)}
                </p>
                {vol.tripStartedAt && vol.tripEndedAt ? (
                  <>
                    <p className="mt-2 font-semibold text-[var(--color-fg)]">
                      Phase 2 · In the car (Begin → End)
                    </p>
                    <p className="font-mono text-lg font-semibold tabular-nums text-[var(--color-primary)]">
                      {formatDurationSeconds(
                        tripInCarSeconds(vol.tripStartedAt, vol.tripEndedAt) ??
                          0,
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      Begin {formatRequestedAt(vol.tripStartedAt)} → End{" "}
                      {formatRequestedAt(vol.tripEndedAt)}
                    </p>
                  </>
                ) : vol.tripStartedAt ? (
                  <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
                    Phase 2 started {formatRequestedAt(vol.tripStartedAt)} — end
                    not recorded yet
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
                    No Begin/End ride times on this trip (older complete).
                  </p>
                )}
                {vol.status === "completed" && (
                  <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
                    Marked complete{" "}
                    {formatRequestedAt(
                      vol.completedAt || vol.tripEndedAt || vol.createdAt,
                    )}
                  </p>
                )}
              </div>
            )}

            {vol.status === "completed" && (
              <Card className="border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5">
                <CardContent className="space-y-3 p-4">
                  {vol.riderRating ? (
                    <>
                      <p className="text-sm font-semibold text-[var(--color-fg)]">
                        Your rating for{" "}
                        {vol.matchedDriverName || "your driver"}
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`size-6 ${
                              n <= (vol.riderRating ?? 0)
                                ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                                : "text-[var(--color-fg-subtle)]"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-semibold">
                          {vol.riderRating}/5
                        </span>
                      </div>
                      {vol.riderReview && (
                        <p className="text-sm text-[var(--color-fg-muted)]">
                          “{vol.riderReview}”
                        </p>
                      )}
                      {vol.ratedAt && (
                        <p className="text-xs text-[var(--color-fg-subtle)]">
                          Submitted {formatRequestedAt(vol.ratedAt)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[var(--color-fg)]">
                        Rate your driver
                      </p>
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        How was your ride with{" "}
                        <strong className="text-[var(--color-fg)]">
                          {vol.matchedDriverName || "your driver"}
                        </strong>
                        ? Tap a star, optional note below.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-label={`${n} star${n > 1 ? "s" : ""}`}
                            onClick={() => setReviewStars(n)}
                            className="rounded-[var(--radius-md)] p-1.5 transition-transform active:scale-95"
                          >
                            <Star
                              className={`size-9 ${
                                n <= reviewStars
                                  ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                                  : "text-[var(--color-fg-subtle)]"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <div>
                        <Label htmlFor="rider-review">Review (optional)</Label>
                        <Textarea
                          id="rider-review"
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Safe, kind, on time…"
                          rows={3}
                        />
                      </div>
                      <Button
                        size="lg"
                        className="w-full"
                        disabled={reviewBusy}
                        onClick={() => {
                          void (async () => {
                            setReviewBusy(true);
                            rateVolunteerRide(
                              vol.id,
                              reviewStars,
                              reviewText.trim(),
                            );
                            try {
                              await submitVolunteerReviewFn({
                                data: {
                                  id: vol.id,
                                  rating: reviewStars,
                                  review: reviewText.trim() || undefined,
                                  reviewerName: vol.fullName,
                                },
                              });
                              toast.success("Thanks — review saved");
                            } catch {
                              toast.message(
                                "Saved on this phone — cloud sync pending",
                              );
                            } finally {
                              setReviewBusy(false);
                            }
                          })();
                        }}
                      >
                        {reviewBusy
                          ? "Sending…"
                          : `Submit ${reviewStars}-star review`}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {!editing ? (
              <>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 text-sm">
                  <p className="font-semibold">{vol.pickup}</p>
                  <OpenInMaps
                    address={vol.pickup}
                    label="Open pickup in Maps"
                    className="mt-1"
                    compact
                  />
                  <p className="my-2 text-center text-[var(--color-fg-subtle)]">
                    ↓
                  </p>
                  <p className="font-semibold">{vol.dropoff}</p>
                  <OpenInMaps
                    address={vol.dropoff}
                    label="Open drop-off in Maps"
                    className="mt-1"
                    compact
                  />
                </div>
                <p className="text-sm">
                  <span className="text-[var(--color-fg-muted)]">When: </span>
                  {vol.when}
                </p>
                {vol.matchedDriverName && (
                  <p className="text-sm text-[var(--color-primary)]">
                    Driver: {vol.matchedDriverName}
                  </p>
                )}
                {vol.notes && (
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Notes: {vol.notes}
                  </p>
                )}
                <p className="text-xs text-[var(--color-fg-subtle)]">
                  Requested {formatRequestedAt(vol.createdAt)}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-fg-muted)]">
                  Editing a matched ride puts it back on the open board. Someone
                  must accept again.
                </p>
                <div>
                  <Label htmlFor="name">Rider name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <AddressField
                  id="pu"
                  label="Pickup"
                  required
                  value={pickup}
                  onChange={setPickup}
                />
                <AddressField
                  id="do"
                  label="Drop-off"
                  required
                  value={dropoff}
                  onChange={setDropoff}
                />
                <div>
                  <Label htmlFor="when">When</Label>
                  <Input
                    id="when"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void onSaveEdit()}
                  >
                    <RotateCcw className="size-4" />
                    {busy ? "Saving…" : "Save & require re-accept"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Discard edits
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!editing && (
          <div className="flex flex-col gap-3">
            {tripPhase === "in_progress" && (
              <Card className="border-[#b42318]/40 bg-[#b42318]/5">
                <CardContent className="space-y-3 p-4">
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#b42318]">
                      Ride in progress
                    </p>
                    <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-[var(--color-fg)]">
                      {formatElapsed(elapsedSec)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                      Safety tools are live for you and your driver
                    </p>
                  </div>
                  <SosPanel
                    tripLabel={`${vol.fullName} · ${vol.pickup} → ${vol.dropoff}`}
                  />
                </CardContent>
              </Card>
            )}
            {vol.status === "matched" && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  const riderLabel =
                    vol.riderLegalName || vol.fullName || "Rider";
                  openTripChat({
                    withName: riderLabel,
                    relatedType: "volunteer",
                    subject: `Ride · ${riderLabel}`,
                    withPhone: vol.phone,
                  });
                }}
              >
                <MessageCircle className="size-4" />
                Message{" "}
                {(vol.riderLegalName || vol.fullName || "rider").split(
                  " ",
                )[0] || "rider"}
              </Button>
            )}
            {telHref && tripPhase === "idle" && (
              <Button size="lg" variant="secondary" asChild>
                <a href={telHref}>
                  <Phone className="size-4" />
                  Call{" "}
                  {(vol.riderLegalName || vol.fullName || "rider").split(
                    " ",
                  )[0] || "rider"}
                </a>
              </Button>
            )}

            {vol.status === "matched" && (
              <Card className="border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Trip control</p>
                    {tripPhase === "in_progress" && (
                      <Badge variant="success" className="gap-1 font-mono">
                        <Timer className="size-3" />
                        {formatElapsed(elapsedSec)}
                      </Badge>
                    )}
                    {tripPhase === "ended" && endedDuration && (
                      <Badge variant="outline" className="font-mono">
                        Drove {endedDuration}
                      </Badge>
                    )}
                  </div>

                  {tripPhase === "idle" && (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        const at = Date.now();
                        const iso = new Date(at).toISOString();
                        setTripPhase("in_progress");
                        setStartedAt(at);
                        setElapsedSec(0);
                        setEndedDuration(null);
                        beginTripLocal(id, iso);
                        void beginVolunteerTripFn({ data: { id } })
                          .then((res) => {
                            if (res.tripStartedAt) {
                              beginTripLocal(id, res.tripStartedAt);
                            }
                            toast.success(
                              "Ride started — rider can open Rides for SOS",
                            );
                          })
                          .catch(() =>
                            toast.message(
                              "Started on this phone — cloud sync pending",
                            ),
                          );
                      }}
                    >
                      <Play className="size-4" />
                      Begin ride
                    </Button>
                  )}

                  {tripPhase === "in_progress" && (
                    <>
                      <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] px-4 py-3 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
                          Elapsed
                        </p>
                        <p className="font-mono text-3xl font-semibold tabular-nums text-[var(--color-primary)]">
                          {formatElapsed(elapsedSec)}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
                          {vol.pickup.split(",")[0]} →{" "}
                          {vol.dropoff.split(",")[0]}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="w-full"
                        variant="secondary"
                        onClick={() => {
                          const dur = formatElapsed(elapsedSec);
                          const iso = new Date().toISOString();
                          setTripPhase("ended");
                          setEndedDuration(dur);
                          endTripLocal(id, iso);
                          void endVolunteerTripFn({ data: { id } })
                            .then(() => toast.success(`Ride ended · ${dur}`))
                            .catch(() =>
                              toast.message(`Ended on this phone · ${dur}`),
                            );
                        }}
                      >
                        <Square className="size-4" />
                        End ride
                      </Button>
                      <p className="text-center text-xs text-[var(--color-fg-muted)]">
                        SOS & Record audio are above for both rider and driver.
                      </p>
                    </>
                  )}

                  {tripPhase === "ended" && (
                    <>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        Trip finished
                        {endedDuration ? ` in ${endedDuration}` : ""}. Mark
                        complete to close it out, or begin again if needed.
                      </p>
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => void onComplete()}
                      >
                        <CheckCircle2 className="size-4" />
                        Mark complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          const at = Date.now();
                          setTripPhase("in_progress");
                          setStartedAt(at);
                          setElapsedSec(0);
                          setEndedDuration(null);
                        }}
                      >
                        Begin again
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {tripPhase === "idle" && (
              <>
                {(vol.status === "matched" ||
                  vol.status === "seeking_volunteer" ||
                  vol.status === "escalated_paid") && (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="size-4" />
                    Edit ride
                  </Button>
                )}
                {vol.status === "matched" && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => void onComplete()}
                  >
                    <CheckCircle2 className="size-4" />
                    Mark complete
                  </Button>
                )}
                {(vol.status === "matched" ||
                  vol.status === "seeking_volunteer" ||
                  vol.status === "escalated_paid") && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#b42318]/40 text-[#b42318]"
                    onClick={() => void onCancel()}
                  >
                    Cancel ride
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

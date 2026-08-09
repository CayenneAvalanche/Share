import { useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useChildMatches,
} from "@tanstack/react-router";
import { Phone, Timer, BadgeDollarSign } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  VOLUNTEER_LABELS,
  type VolunteerRide,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { hoursUntilEscalate } from "@/lib/share/tracking";
import { formatCurrency } from "@/lib/utils";
import { SHARE_PHONE_DISPLAY, SHARE_PHONE_TEL } from "@/lib/share/contact";
import { isDemoMode } from "@/lib/share/mode";
import {
  claimVolunteerRideFn,
  escalateVolunteerRideFn,
  listVolunteerRidesFn,
  cancelVolunteerRideFn,
} from "@/lib/share/server-fns";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/volunteer")({
  component: VolunteerLayout,
});

function VolunteerLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <VolunteerPage />;
}

function VolunteerPage() {
  const [searchPosted, setSearchPosted] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("share-vol-posted") === "1") {
        setSearchPosted(true);
        sessionStorage.removeItem("share-vol-posted");
      }
    } catch {
      /* ignore */
    }
  }, []);
  const localRides = useShareStore((s) => s.volunteerRides);
  const processVolunteerEscalations = useShareStore(
    (s) => s.processVolunteerEscalations,
  );
  const claimVolunteer = useShareStore((s) => s.claimVolunteer);
  const forceEscalateVolunteer = useShareStore((s) => s.forceEscalateVolunteer);
  const isDriverApproved = useShareStore((s) => s.isDriverApproved);
  const riderName = useShareStore((s) => s.riderName);
  const user = useCurrentUser();
  const signedIn = !!user?.primaryEmail;
  const [cloudRides, setCloudRides] = useState<VolunteerRide[]>([]);
  const [cloudStatus, setCloudStatus] = useState<
    "loading" | "ok" | "offline" | "signed_out"
  >("loading");
  const [, tick] = useState(0);
  const demo = isDemoMode();
  // Open board only for signed-in approved drivers (demo always open)
  const canSeeOpenBoard = demo || (signedIn && isDriverApproved);

  function refreshCloud() {
    if (!demo && !signedIn) {
      setCloudRides([]);
      setCloudStatus("signed_out");
      return;
    }
    listVolunteerRidesFn()
      .then((data) => {
        setCloudRides(data.rides);
        setCloudStatus("ok");
      })
      .catch(() => setCloudStatus("offline"));
  }

  useEffect(() => {
    refreshCloud();
    const id = setInterval(refreshCloud, 20_000);
    return () => clearInterval(id);
  }, [signedIn, demo]);

  useEffect(() => {
    const n = processVolunteerEscalations();
    if (n > 0) {
      toast.message(
        `${n} volunteer ride${n > 1 ? "s" : ""} switched to paid`,
        { description: "No free driver in the window — now open as paid." },
      );
    }
    const id = setInterval(() => {
      processVolunteerEscalations();
      tick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, [processVolunteerEscalations]);

  const volunteerRides = useMemo(() => {
    // Signed out: never merge cloud board (privacy for real requests)
    if (!demo && !signedIn) {
      return [...localRides].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    }
    const byId = new Map<string, VolunteerRide>();
    for (const r of cloudRides) byId.set(r.id, r);
    for (const r of localRides) byId.set(r.id, r);
    return Array.from(byId.values()).sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [cloudRides, localRides, signedIn, demo]);

  // Riders only see their own local requests (not the full open board)
  const myLocal = localRides;
  const myOpen = myLocal.filter(
    (r) =>
      r.status === "seeking_volunteer" || r.status === "escalated_paid",
  );
  const myMatched = myLocal.filter(
    (r) => r.status === "matched" || r.status === "completed",
  );
  const myCancelled = myLocal.filter((r) => r.status === "cancelled");

  const open = canSeeOpenBoard
    ? volunteerRides.filter(
        (r) =>
          r.status === "seeking_volunteer" || r.status === "escalated_paid",
      )
    : [];
  const rest = canSeeOpenBoard
    ? volunteerRides.filter(
        (r) => r.status === "matched" || r.status === "completed",
      )
    : [];

  const driverLabel = user?.displayName || riderName || "Share driver";

  async function onClaim(r: VolunteerRide) {
    claimVolunteer(r.id, driverLabel);
    try {
      await claimVolunteerRideFn({
        data: { id: r.id, driverName: driverLabel },
      });
      toast.success(
        r.status === "seeking_volunteer"
          ? "You claimed this ride"
          : "You claimed this paid community ride",
        {
          description:
            "Ask the rider to create an account + selfie so you can confirm identity at pickup.",
        },
      );
      refreshCloud();
    } catch {
      toast.message("Claimed on this phone — cloud sync pending");
    }
  }

  return (
    <AppShell
      title="Volunteer rides"
      subtitle="Elders · veterans · medical · hardship · work"
      solidHeader
    >
      <Link
        to="/volunteer/new"
        className="mt-3 flex min-h-[64px] w-full items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-primary)] px-6 py-5 text-center text-lg font-bold tracking-wide text-[var(--color-primary-fg)] shadow-[var(--shadow-md)] transition-transform active:scale-[0.98]"
      >
        REQUEST A RIDE
      </Link>

      <Link
        to="/volunteer/manage"
        className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2.5 text-sm font-semibold text-[var(--color-fg)]"
      >
        Manage / cancel my request (phone only)
      </Link>

      <a
        href={SHARE_PHONE_TEL}
        className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-[var(--color-primary)]/40 bg-[var(--color-bg-elevated)] px-4 py-3 text-[var(--color-fg)] transition-transform active:scale-[0.99]"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
          <Phone className="size-5" />
        </span>
        <span className="text-left">
          <span className="block text-sm font-semibold">Call Share</span>
          <span className="block text-base font-bold tracking-wide">
            {SHARE_PHONE_DISPLAY}
          </span>
        </span>
      </a>

      {searchPosted && (
        <Card className="mt-4 border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-semibold text-[var(--color-primary)]">
              Request sent — no account needed yet
            </p>
            <p className="text-[var(--color-fg-muted)]">
              Signed-in approved drivers can see open requests. When someone
              accepts your ride, create an account and add a selfie so they can
              recognize you at pickup.
            </p>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/login">I already got accepted — set up account</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="mt-3 text-center text-sm text-[var(--color-fg-muted)]">
        Free volunteer first. If no driver in time, becomes a paid request.
      </p>

      {/* Your requests — edit allowed until a driver accepts */}
      {(myOpen.length > 0 || myMatched.length > 0 || myCancelled.length > 0) && (
        <section className="mt-6">
          <h2 className="font-display text-lg font-semibold">Your requests</h2>
          <div className="mt-3 flex flex-col gap-3">
            {[...myOpen, ...myMatched].map((r) => (
              <VolunteerCard
                key={r.id}
                ride={r}
                canEdit={
                  r.status === "seeking_volunteer" ||
                  r.status === "escalated_paid"
                }
                canCancel={
                  r.status === "seeking_volunteer" ||
                  r.status === "escalated_paid" ||
                  r.status === "matched"
                }
              />
            ))}
          </div>
          {myCancelled.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[var(--color-fg-muted)]">
                Cancelled (kept for your records)
              </h3>
              <div className="mt-2 flex flex-col gap-2">
                {myCancelled.map((r) => (
                  <VolunteerCard key={r.id} ride={r} />
                ))}
              </div>
            </div>
          )}
          {myMatched.some((r) => r.status === "matched") && (
            <Card className="mt-3 border-[var(--color-accent)]/40 bg-[var(--color-accent)]/8">
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="font-semibold">Driver accepted — finish setup</p>
                <p className="text-[var(--color-fg-muted)]">
                  Create your Share account and add a recent selfie so your
                  driver can confirm it's you.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" asChild>
                    <Link to="/login">Create account</Link>
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link to="/apply/rider">Add selfie (rider app)</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {!signedIn && !demo && (
        <Card className="mt-6 border-[var(--color-border)]">
          <CardContent className="space-y-3 p-4 text-sm text-[var(--color-fg-muted)]">
            <p className="font-semibold text-[var(--color-fg)]">
              Sign in to see the ride board
            </p>
            <p>
              Open requests are private. Sign in as an approved driver to view
              and claim rides. Anyone can still request a ride above without an
              account.
            </p>
            <Button size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {signedIn && !canSeeOpenBoard && !demo && (
        <Card className="mt-6 border-[var(--color-border)]">
          <CardContent className="space-y-3 p-4 text-sm text-[var(--color-fg-muted)]">
            <p className="font-semibold text-[var(--color-fg)]">
              Open requests are for approved drivers
            </p>
            <p>
              You're signed in. Apply as a driver and get approved to see
              the board and claim rides.
            </p>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/apply/driver">Apply as driver</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {canSeeOpenBoard && (
        <>
          <section className="mt-6">
            <h2 className="font-display text-lg font-semibold">
              Open requests
              {cloudStatus === "ok" && (
                <span className="ml-2 text-xs font-normal text-[var(--color-primary)]">
                  live board
                </span>
              )}
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {open.length === 0 ? (
                <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-fg-muted)]">
                  No open requests yet.
                </p>
              ) : (
                open.map((r) => (
                  <VolunteerCard
                    key={r.id}
                    ride={r}
                    demo={demo}
                    canClaim
                    onClaim={() => void onClaim(r)}
                    onForceEscalate={() => {
                      forceEscalateVolunteer(r.id);
                      void escalateVolunteerRideFn({ data: { id: r.id } })
                        .then(refreshCloud)
                        .catch(() => {});
                      toast.message("Switched to paid request");
                    }}
                  />
                ))
              )}
            </div>
          </section>

          {rest.length > 0 && (
            <section className="mt-8 pb-6">
              <h2 className="font-display text-lg font-semibold">Matched</h2>
              <div className="mt-3 flex flex-col gap-3">
                {rest.map((r) => (
                  <VolunteerCard key={r.id} ride={r} demo={demo} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </AppShell>
  );
}

function VolunteerCard({
  ride,
  onClaim,
  onForceEscalate,
  demo,
  canClaim,
  canEdit,
  canCancel,
}: {
  ride: VolunteerRide;
  onClaim?: () => void;
  onForceEscalate?: () => void;
  demo?: boolean;
  canClaim?: boolean;
  canEdit?: boolean;
  canCancel?: boolean;
}) {
  const hrs = hoursUntilEscalate(ride);
  const free = ride.status === "seeking_volunteer";
  const cancelLocal = useShareStore((s) => s.cancelVolunteerRide);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{ride.fullName}</p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              {ride.pickup} → {ride.dropoff}
            </p>
            <p className="text-xs text-[var(--color-fg-subtle)]">{ride.when}</p>
          </div>
          <div className="text-right">
            {free ? (
              <Badge variant="success">Free volunteer</Badge>
            ) : ride.status === "escalated_paid" ? (
              <Badge variant="accent">
                <BadgeDollarSign className="mr-1 size-3" />
                Paid {formatCurrency(ride.paidOffer)}
              </Badge>
            ) : (
              <Badge variant="secondary" className="capitalize">
                {ride.status}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="default">
            {(VOLUNTEER_LABELS as Record<string, string>)[ride.category] ??
              ride.category}
          </Badge>
          {free && (
            <Badge variant="outline">
              <Timer className="mr-1 size-3" />
              {hrs <= 0
                ? "Escalating…"
                : hrs < 1
                  ? `${Math.round(hrs * 60)}m to paid`
                  : `${hrs.toFixed(1)}h to paid`}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button size="sm" variant="secondary" asChild>
              <a href={`/volunteer/new?edit=${encodeURIComponent(ride.id)}`}>
                Edit request
              </a>
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              className="border-[#b42318]/40 text-[#b42318]"
              onClick={() => {
                if (
                  !confirm(
                    "Cancel this request? It will leave the live board and stay in history.",
                  )
                )
                  return;
                cancelLocal(ride.id);
                void cancelVolunteerRideFn({ data: { id: ride.id } })
                  .then(() => toast.success("Cancelled on the live board"))
                  .catch(() =>
                    toast.error(
                      "Server cancel failed — try Manage with your phone",
                    ),
                  );
              }}
            >
              Cancel
            </Button>
          )}
        </div>
        {ride.notes && (
          <p className="text-sm text-[var(--color-fg-muted)]">{ride.notes}</p>
        )}
        {ride.matchedDriverName && (
          <p className="text-sm text-[var(--color-primary)]">
            Driver: {ride.matchedDriverName}
          </p>
        )}
        {onClaim &&
          canClaim &&
          (ride.status === "seeking_volunteer" ||
            ride.status === "escalated_paid") && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onClaim}>
                {free ? "Volunteer for this ride" : "Accept paid ride"}
              </Button>
              {demo && free && onForceEscalate && (
                <Button size="sm" variant="ghost" onClick={onForceEscalate}>
                  Demo: force to paid
                </Button>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}

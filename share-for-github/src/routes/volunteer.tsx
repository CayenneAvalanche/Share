import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { HeartHandshake, Plus, Timer, BadgeDollarSign } from "lucide-react";
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

export const Route = createFileRoute("/volunteer")({
  component: VolunteerLayout,
});

function VolunteerLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <VolunteerPage />;
}

function VolunteerPage() {
  const volunteerRides = useShareStore((s) => s.volunteerRides);
  const processVolunteerEscalations = useShareStore(
    (s) => s.processVolunteerEscalations,
  );
  const claimVolunteer = useShareStore((s) => s.claimVolunteer);
  const forceEscalateVolunteer = useShareStore((s) => s.forceEscalateVolunteer);
  const riderName = useShareStore((s) => s.riderName);
  const [, tick] = useState(0);

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

  const open = volunteerRides.filter(
    (r) =>
      r.status === "seeking_volunteer" || r.status === "escalated_paid",
  );
  const rest = volunteerRides.filter(
    (r) => r.status === "matched" || r.status === "completed",
  );

  return (
    <AppShell
      title="Volunteer rides"
      subtitle="Veterans · disabled · elders 75+"
      solidHeader
      action={
        <Button size="sm" asChild>
          <Link to="/volunteer/new">
            <Plus className="size-4" />
            Request
          </Link>
        </Button>
      }
    >
      <Card className="mt-3 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
        <CardContent className="flex gap-3 p-4">
          <HeartHandshake className="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
          <div className="text-sm text-[var(--color-fg-muted)]">
            <p className="font-semibold text-[var(--color-fg)]">
              Free first — then paid if needed
            </p>
            <p className="mt-1">
              Post a volunteer ride for a veteran, disabled rider, or elder
              (75+). Drivers can claim for free. If nobody picks it up in{" "}
              <strong className="text-[var(--color-fg)]">0–2 hours</strong>{" "}
              (you set the window), it auto-switches to a paid request so they
              still get help.
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="mt-5">
        <h2 className="font-display text-lg font-semibold">Open requests</h2>
        <div className="mt-3 flex flex-col gap-3">
          {open.length === 0 ? (
            <p className="text-sm text-[var(--color-fg-muted)]">
              No open volunteer rides. Request one for someone who needs it.
            </p>
          ) : (
            open.map((r) => (
              <VolunteerCard
                key={r.id}
                ride={r}
                onClaim={() => {
                  claimVolunteer(r.id, riderName || "Share driver");
                  toast.success(
                    r.status === "seeking_volunteer"
                      ? "You claimed this as a volunteer"
                      : "You claimed this paid community ride",
                  );
                }}
                onForceEscalate={() => {
                  forceEscalateVolunteer(r.id);
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
              <VolunteerCard key={r.id} ride={r} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function VolunteerCard({
  ride,
  onClaim,
  onForceEscalate,
}: {
  ride: VolunteerRide;
  onClaim?: () => void;
  onForceEscalate?: () => void;
}) {
  const hrs = hoursUntilEscalate(ride);
  const free = ride.status === "seeking_volunteer";

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{ride.fullName}</p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              {ride.pickup.split(",")[0]} → {ride.dropoff.split(",")[0]}
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
          <Badge variant="default">{VOLUNTEER_LABELS[ride.category]}</Badge>
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
        {ride.notes && (
          <p className="text-sm text-[var(--color-fg-muted)]">{ride.notes}</p>
        )}
        {ride.matchedDriverName && (
          <p className="text-sm text-[var(--color-primary)]">
            Driver: {ride.matchedDriverName}
          </p>
        )}
        {onClaim &&
          (ride.status === "seeking_volunteer" ||
            ride.status === "escalated_paid") && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onClaim}>
                {free ? "Volunteer for this ride" : "Accept paid ride"}
              </Button>
              {free && onForceEscalate && (
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

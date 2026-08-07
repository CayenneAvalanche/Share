import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { HeartHandshake, Phone, Timer, BadgeDollarSign } from "lucide-react";
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
  const demo = isDemoMode();

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
    >
      {/* Large REQUEST — easy for elders / less dexterity */}
      <Link
        to="/volunteer/new"
        className="mt-3 flex min-h-[64px] w-full items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-primary)] px-6 py-5 text-center text-lg font-bold tracking-wide text-[var(--color-primary-fg)] shadow-[var(--shadow-md)] transition-transform active:scale-[0.98]"
      >
        REQUEST A RIDE
      </Link>

      {/* Call Share anytime */}
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

      <p className="mt-3 text-center text-sm text-[var(--color-fg-muted)]">
        Free volunteer first. If no driver in time, becomes a paid request.
      </p>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Open requests</h2>
        <div className="mt-3 flex flex-col gap-3">
          {open.length === 0 ? (
            <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-fg-muted)]">
              No open requests yet. Tap <strong>REQUEST A RIDE</strong> above —
              or call Share.
            </p>
          ) : (
            open.map((r) => (
              <VolunteerCard
                key={r.id}
                ride={r}
                demo={demo}
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
              <VolunteerCard key={r.id} ride={r} demo={demo} />
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
  demo,
}: {
  ride: VolunteerRide;
  onClaim?: () => void;
  onForceEscalate?: () => void;
  demo?: boolean;
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

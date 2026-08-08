import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { Car, User, Package, Video, ArrowRight, BadgeCheck } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  statusLabel,
  useMyAppStatus,
} from "@/lib/share/use-my-apps";

export const Route = createFileRoute("/apply")({
  component: ApplyLayout,
});

function ApplyLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <ApplyHubPage />;
}

function ApplyHubPage() {
  const {
    driverStatus,
    riderStatus,
    driverActive,
    riderActive,
    canApplyDriver,
    canApplyRider,
  } = useMyAppStatus();

  return (
    <AppShell
      title="Apply to Share"
      subtitle="Short interview · in person or Zoom"
      solidHeader
      backTo="/app"
    >
      <Card className="mt-3 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
        <CardContent className="flex gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
            <Video className="size-5" />
          </div>
          <div>
            <p className="font-semibold">How approval works</p>
            <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
              Apply once → short interview → you're cleared. Active
              members can't reapply.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 flex flex-col gap-3">
        <ApplyCard
          to="/apply/driver"
          icon={Car}
          title="Driver"
          body={
            driverActive
              ? "You're cleared to drive corridor seats, local pings, and cargo."
              : "Corridor seats, local pings, cargo"
          }
          badge={statusLabel(driverStatus)}
          locked={!canApplyDriver}
          active={driverActive}
        />
        <ApplyCard
          to="/apply/rider"
          icon={User}
          title="Rider"
          body={
            riderActive
              ? "You're cleared to book seats and local rides."
              : "Book seats and local rides"
          }
          badge={statusLabel(riderStatus)}
          locked={!canApplyRider}
          active={riderActive}
        />
        <ApplyCard
          to="/apply/delivery"
          icon={Package}
          title="Delivery / business"
          body="Packages and shop handoffs"
          badge="Quick ID check"
        />
      </div>
    </AppShell>
  );
}

function ApplyCard({
  to,
  icon: Icon,
  title,
  body,
  badge,
  locked,
  active,
}: {
  to: "/apply/driver" | "/apply/rider" | "/apply/delivery";
  icon: typeof Car;
  title: string;
  body: string;
  badge: string;
  locked?: boolean;
  active?: boolean;
}) {
  const content = (
    <Card
      className={
        locked
          ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5"
          : "transition-all hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)] active:scale-[0.99]"
      }
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{title}</p>
            {!locked && (
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-[var(--color-fg-subtle)]" />
            )}
            {active && (
              <BadgeCheck className="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
            )}
          </div>
          <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">{body}</p>
          <Badge
            variant={active ? "success" : locked ? "secondary" : "secondary"}
            className="mt-2 capitalize"
          >
            {badge}
          </Badge>
          {locked && !active && (
            <p className="mt-2 text-xs text-[var(--color-fg-subtle)]">
              Application already on file — no need to reapply.
            </p>
          )}
          {active && (
            <p className="mt-2 text-xs font-medium text-[var(--color-primary)]">
              Already approved · reapply closed
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (locked) {
    return <div className="block">{content}</div>;
  }

  return (
    <Link to={to} className="block">
      {content}
    </Link>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, User, Package, Video, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShareStore } from "@/lib/share/store";

export const Route = createFileRoute("/apply")({
  component: ApplyHubPage,
});

function ApplyHubPage() {
  const driverApps = useShareStore((s) => s.driverApps);
  const riderApps = useShareStore((s) => s.riderApps);

  return (
    <AppShell
      title="Apply to Share"
      subtitle="Interview required · in person or Zoom"
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
              Submit an application → we schedule a short interview (coffee in
              Lafayette or Zoom) → background screen → you’re cleared to book or
              post.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 flex flex-col gap-3">
        <ApplyCard
          to="/apply/driver"
          icon={Car}
          title="Driver application"
          body="Post long-distance trips, accept local ride pings, and carry cargo."
          badge={
            driverApps[0]
              ? `Status: ${driverApps[0].status.replace("_", " ")}`
              : "Interview required"
          }
        />
        <ApplyCard
          to="/apply/rider"
          icon={User}
          title="Rider application"
          body="Book corridor seats and local Share rides after a quick screen."
          badge={
            riderApps[0]
              ? `Status: ${riderApps[0].status.replace("_", " ")}`
              : "Interview required"
          }
        />
        <ApplyCard
          to="/apply/delivery"
          icon={Package}
          title="Delivery / business request"
          body="Ship a package or set up recurring corridor handoffs for your shop."
          badge="No full interview for one-off — ID check"
        />
      </div>

      <p className="mt-6 text-center text-xs text-[var(--color-fg-subtle)]">
        Demo saves applications on this device so you can walk through the flow.
      </p>
    </AppShell>
  );
}

function ApplyCard({
  to,
  icon: Icon,
  title,
  body,
  badge,
}: {
  to: string;
  icon: typeof Car;
  title: string;
  body: string;
  badge: string;
}) {
  return (
    <Link to={to} className="block">
      <Card className="transition-all hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)] active:scale-[0.99]">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{title}</p>
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-[var(--color-fg-subtle)]" />
            </div>
            <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">{body}</p>
            <Badge variant="secondary" className="mt-2 capitalize">
              {badge}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

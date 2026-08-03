import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { HandCoins, Plus, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShareStore } from "@/lib/share/store";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/rides/requests")({
  component: RideRequestsLayout,
});

function RideRequestsLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <RideRequestsList />;
}

function RideRequestsList() {
  const rideRequests = useShareStore((s) => s.rideRequests);
  const open = rideRequests.filter((r) => r.status === "open");
  const matched = rideRequests.filter((r) => r.status === "matched");

  return (
    <AppShell
      title="Request a ride"
      subtitle="Under Share a ride · private offer · driver bids"
      solidHeader
      backTo="/rides"
      action={
        <Button size="sm" asChild>
          <Link to="/rides/request/new">
            <Plus className="size-4" />
            New
          </Link>
        </Button>
      }
    >
      <Card className="mt-3 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
        <CardContent className="flex gap-3 p-4">
          <HandCoins className="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
          <div className="text-sm text-[var(--color-fg-muted)]">
            <p className="font-semibold text-[var(--color-fg)]">
              How offers & bids work
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>
                <strong className="text-[var(--color-fg)]">You offer</strong> a
                private max you’ll pay (drivers never see the number).
              </li>
              <li>
                <strong className="text-[var(--color-fg)]">Drivers bid</strong>{" "}
                what they want for the seat.
              </li>
              <li>
                If their bid fits your offer → you{" "}
                <strong className="text-[var(--color-fg)]">approve</strong>.
                Deal locks at their bid.
              </li>
              <li>
                If too high → they’re told to{" "}
                <strong className="text-[var(--color-fg)]">lower the bid</strong>
                — still no number shown.
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <section className="mt-5 space-y-3">
        <h2 className="font-display text-lg font-semibold">
          Open requests ({open.length})
        </h2>
        {open.length === 0 && (
          <p className="text-sm text-[var(--color-fg-muted)]">
            No open requests — post one.
          </p>
        )}
        {open.map((r) => {
          const pending = r.offers.filter(
            (o) => o.status === "pending_approval" || o.status === "open",
          );
          const best = [...pending].sort((a, b) => a.amount - b.amount)[0];
          return (
            <Link
              key={r.id}
              to="/rides/requests/$id"
              params={{ id: r.id }}
              className="block"
            >
              <Card className="transition-shadow hover:shadow-[var(--shadow-md)]">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-xl font-semibold">
                        {r.from.split(",")[0]} → {r.to.split(",")[0]}
                      </p>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {r.requesterName} · {formatDate(r.neededBy)}
                        {r.flexibleWindow ? ` · ${r.flexibleWindow}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-fg-subtle)]">
                        Driver view
                      </p>
                      <p className="text-sm font-semibold text-[var(--color-primary)]">
                        Bid to ride
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{r.seats} seat(s)</Badge>
                    <Badge variant="outline">
                      {pending.length} bid
                      {pending.length === 1 ? "" : "s"} pending
                    </Badge>
                    {best && (
                      <Badge variant="success">
                        Lowest bid {formatCurrency(best.amount)}
                      </Badge>
                    )}
                    <ArrowRight className="ml-auto size-4 text-[var(--color-fg-subtle)]" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      {matched.length > 0 && (
        <section className="mt-8 space-y-3 pb-8">
          <h2 className="font-display text-lg font-semibold">Matched deals</h2>
          {matched.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-semibold">
                    {r.from.split(",")[0]} → {r.to.split(",")[0]}
                  </p>
                  <p className="text-[var(--color-fg-muted)]">
                    {r.requesterName} × {r.matchedDriverName}
                  </p>
                </div>
                <p className="font-semibold text-[var(--color-primary)]">
                  {formatCurrency(r.matchedAmount ?? 0)}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </AppShell>
  );
}

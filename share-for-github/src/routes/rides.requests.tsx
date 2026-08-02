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
  // Detail routes render themselves; list only when no child
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
      title="Trip requests"
      subtitle="Bid max · drivers offer · match"
      solidHeader
      action={
        <Button size="sm" asChild>
          <Link to="/rides/request/new">
            <Plus className="size-4" />
            Request
          </Link>
        </Button>
      }
    >
      <Card className="mt-3 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
        <CardContent className="flex gap-3 p-4">
          <HandCoins className="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
          <div className="text-sm text-[var(--color-fg-muted)]">
            <p className="font-semibold text-[var(--color-fg)]">
              No posted seats? Post a request
            </p>
            <p className="mt-1">
              Amy needs SHV Saturday · max $40. Tom was going anyway · offers
              $25. She accepts → deal at <strong>$25</strong> (driver offer ≤
              rider max bid).
            </p>
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
          const best = [...r.offers]
            .filter((o) => o.status === "open")
            .sort((a, b) => a.amount - b.amount)[0];
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
                        Max bid
                      </p>
                      <p className="font-display text-lg font-semibold text-[var(--color-primary)]">
                        {formatCurrency(r.maxBid)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{r.seats} seat(s)</Badge>
                    <Badge variant="outline">
                      {r.offers.filter((o) => o.status === "open").length} offer
                      {r.offers.filter((o) => o.status === "open").length === 1
                        ? ""
                        : "s"}
                    </Badge>
                    {best && (
                      <Badge variant="success">
                        Best offer {formatCurrency(best.amount)}
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

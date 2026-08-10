import { createFileRoute, Link, Outlet, useChildMatches, useNavigate } from "@tanstack/react-router";
import { HandCoins, Plus, ArrowRight, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShareStore } from "@/lib/share/store";
import { formatCurrency, formatDate, formatRequestedAt } from "@/lib/utils";

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
  const localRides = useShareStore((s) => s.localRides);
  const setLocalRideStatus = useShareStore((s) => s.setLocalRideStatus);
  const navigate = useNavigate();
  const open = rideRequests.filter((r) => r.status === "open");
  const matched = rideRequests.filter((r) => r.status === "matched");
  const localOpen = localRides
    .filter((r) => r.status === "broadcasting" || r.status === "matched")
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const localHistory = localRides
    .filter((r) => r.status === "cancelled")
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 8);

  return (
    <AppShell
      title="Request a ride"
      subtitle="Local offers · corridor requests · driver bids"
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
      <section className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            Local rides ({localOpen.length})
          </h2>
          <Button size="sm" variant="outline" asChild>
            <Link to="/local">
              <MapPinned className="size-4" />
              New local
            </Link>
          </Button>
        </div>
        <p className="text-xs text-[var(--color-fg-muted)]">
          Broadcasting = waiting for a driver. Cancel anytime before match.
        </p>
        {localOpen.length === 0 && (
          <p className="text-sm text-[var(--color-fg-muted)]">
            No open local rides — request one from Local ride.
          </p>
        )}
        {localOpen.map((r) => (
          <Card key={r.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {r.pickup} → {r.dropoff}
                  </p>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    {r.when} · {r.requesterName} ·{" "}
                    {formatRequestedAt(r.createdAt)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                    Offer{" "}
                    {r.sharePrice > 0
                      ? formatCurrency(r.sharePrice)
                      : "FREE / $0"}
                  </p>
                </div>
                <Badge
                  variant={
                    r.status === "matched" ? "success" : "secondary"
                  }
                >
                  {r.status === "broadcasting" ? "Broadcasting" : "Matched"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    navigate({
                      to: "/rides/matched/$id",
                      params: { id: r.id },
                    })
                  }
                >
                  Open
                </Button>
                {r.status === "broadcasting" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#b42318]/40 text-[#b42318]"
                    onClick={() => {
                      if (
                        !confirm(
                          "Cancel this local ride request? Drivers will stop seeing it.",
                        )
                      )
                        return;
                      setLocalRideStatus(
                        r.id,
                        "cancelled",
                        "Cancelled by rider",
                      );
                      toast.success("Local ride cancelled");
                    }}
                  >
                    Cancel request
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {localHistory.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
              Cancelled local
            </p>
            {localHistory.map((r) => (
              <p
                key={r.id}
                className="text-xs text-[var(--color-fg-muted)] line-through"
              >
                {r.pickup.split(",")[0]} → {r.dropoff.split(",")[0]} ·{" "}
                {formatRequestedAt(r.createdAt)}
              </p>
            ))}
          </div>
        )}
      </section>

      <Card className="mt-6 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
        <CardContent className="flex gap-3 p-4">
          <HandCoins className="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
          <div className="text-sm text-[var(--color-fg-muted)]">
            <p className="font-semibold text-[var(--color-fg)]">
              Corridor offers & bids
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
                If too high → driver can lower the bid or walk away. You still
                see <strong className="text-[var(--color-fg)]">interest</strong>{" "}
                and can raise your private offer to unlock them.
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <section className="mt-5 space-y-3">
        <h2 className="font-display text-lg font-semibold">
          Corridor requests ({open.length})
        </h2>
        {open.length === 0 && (
          <p className="text-sm text-[var(--color-fg-muted)]">
            No open corridor requests — post one.
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
          <h2 className="font-display text-lg font-semibold">
            Matched corridor deals
          </h2>
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

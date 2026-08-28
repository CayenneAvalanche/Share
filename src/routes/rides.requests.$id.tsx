import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useShareStore } from "@/lib/share/store";
import { matchedFare } from "@/lib/share/corridor";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { PLATFORM_TAKE_RATE } from "@/lib/share/data";

export const Route = createFileRoute("/rides/requests/$id")({
  component: RideRequestDetailPage,
});

function RideRequestDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const rideRequests = useShareStore((s) => s.rideRequests);
  const offerOnRideRequest = useShareStore((s) => s.offerOnRideRequest);
  const acceptRideOffer = useShareStore((s) => s.acceptRideOffer);
  const raisePrivateOffer = useShareStore((s) => s.raisePrivateOffer);
  const riderName = useShareStore((s) => s.riderName);
  const req = rideRequests.find((r) => r.id === id);

  const [amount, setAmount] = useState(25);
  const [note, setNote] = useState(
    "I was already heading that way — can knock it out Saturday.",
  );
  const [driverName, setDriverName] = useState("Tom K.");
  const [newOffer, setNewOffer] = useState(0);
  /** Demo role switch — real auth will use account type */
  const [viewAs, setViewAs] = useState<"driver" | "rider">("driver");

  if (!req) {
    return (
      <AppShell title="Request" backTo="/rides/requests" solidHeader>
        <p className="py-12 text-center text-[var(--color-fg-muted)]">
          Request not found.
        </p>
      </AppShell>
    );
  }

  const isRiderView = viewAs === "rider";
  const pending = req.offers.filter((o) => o.status === "pending_approval");
  const otherOffers = req.offers.filter(
    (o) => o.status !== "pending_approval",
  );

  return (
    <AppShell
      title={`${req.from.split(",")[0]} → ${req.to.split(",")[0]}`}
      subtitle={`${req.requesterName} · needs a ride`}
      backTo="/rides/requests"
      solidHeader
    >
      <div className="space-y-4 py-3 pb-10">
        {/* Role switch for demo */}
        <div className="flex gap-2 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-1">
          <button
            type="button"
            className={`flex-1 rounded-[var(--radius-sm)] py-2 text-xs font-semibold ${
              viewAs === "driver"
                ? "bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-sm"
                : "text-[var(--color-fg-muted)]"
            }`}
            onClick={() => setViewAs("driver")}
          >
            View as driver
          </button>
          <button
            type="button"
            className={`flex-1 rounded-[var(--radius-sm)] py-2 text-xs font-semibold ${
              viewAs === "rider"
                ? "bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-sm"
                : "text-[var(--color-fg-muted)]"
            }`}
            onClick={() => setViewAs("rider")}
          >
            View as rider
          </button>
        </div>

        {isRiderView &&
          req.offers.some((o) => o.status === "over_budget") &&
          req.status === "open" && (
            <Card className="border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10">
              <CardContent className="space-y-3 p-4 text-sm">
                <p className="font-semibold text-[var(--color-fg)]">
                  Drivers are interested — your private offer may be low
                </p>
                <p className="text-[var(--color-fg-muted)]">
                  Someone bid higher than your private max. They were told to
                  lower their bid (they never saw your number). You can{" "}
                  <strong className="text-[var(--color-fg)]">
                    raise your offer
                  </strong>{" "}
                  to unlock those bids for approval, or wait for a lower bid.
                </p>
                <ul className="list-disc space-y-1 pl-5 text-[var(--color-fg-muted)]">
                  {req.offers
                    .filter((o) => o.status === "over_budget")
                    .map((o) => (
                      <li key={o.id}>
                        {o.driverName} bid{" "}
                        <strong className="text-[var(--color-fg)]">
                          {formatCurrency(o.amount)}
                        </strong>
                        {o.note ? ` — “${o.note.slice(0, 60)}”` : ""}
                      </li>
                    ))}
                </ul>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[8rem] flex-1">
                    <Label htmlFor="raise">New private offer ($)</Label>
                    <Input
                      id="raise"
                      type="number"
                      min={req.maxBid + 1}
                      value={
                        newOffer ||
                        Math.max(
                          req.maxBid + 5,
                          ...req.offers
                            .filter((o) => o.status === "over_budget")
                            .map((o) => o.amount),
                        )
                      }
                      onChange={(e) => setNewOffer(Number(e.target.value))}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const target =
                        newOffer ||
                        Math.max(
                          req.maxBid + 5,
                          ...req.offers
                            .filter((o) => o.status === "over_budget")
                            .map((o) => o.amount),
                        );
                      if (target <= req.maxBid) {
                        toast.error("New offer must be higher than current");
                        return;
                      }
                      const n = raisePrivateOffer(req.id, target);
                      toast.success(
                        n
                          ? `Offer raised to ${formatCurrency(target)} — ${n} bid(s) unlocked`
                          : `Offer raised to ${formatCurrency(target)}`,
                      );
                    }}
                  >
                    Raise offer & unlock
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}


        <Card>
          <CardContent className="space-y-2 p-5">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  req.status === "matched"
                    ? "success"
                    : req.status === "open"
                      ? "default"
                      : "secondary"
                }
                className="capitalize"
              >
                {req.status}
              </Badge>
              <Badge variant="outline">{req.seats} seat(s)</Badge>
              {pending.length > 0 && (
                <Badge variant="success">
                  {pending.length} bid{pending.length === 1 ? "" : "s"} for
                  approval
                </Badge>
              )}
            </div>
            <p className="font-display text-2xl font-semibold">
              {req.from} → {req.to}
            </p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Needed {formatDate(req.neededBy)}
              {req.flexibleWindow ? ` · ${req.flexibleWindow}` : ""}
            </p>
            <p className="text-sm">{req.notes}</p>

            {/* Private offer only for rider view */}
            {isRiderView ? (
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-sm">
                <div className="flex justify-between">
                  <span>Your private offer (max pay)</span>
                  <strong>{formatCurrency(req.maxBid)}</strong>
                </div>
                <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                  Drivers never see this number. They place a bid; if it fits
                  your offer, you approve.
                </p>
                {req.status === "matched" && (
                  <div className="mt-2 flex justify-between text-[var(--color-primary)]">
                    <span>Deal with {req.matchedDriverName}</span>
                    <strong>{formatCurrency(req.matchedAmount ?? 0)}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3 text-sm text-[var(--color-fg-muted)]">
                <p className="font-medium text-[var(--color-fg)]">
                  Private offer hidden
                </p>
                <p className="mt-1 text-xs">
                  Rider set a max they’ll pay — you don’t see it. Place your{" "}
                  <strong className="text-[var(--color-fg)]">bid</strong> for
                  what this seat is worth to you.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {req.status === "open" && !isRiderView && (
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-display text-lg font-semibold">
                Place your bid
              </h2>
              <p className="text-sm text-[var(--color-fg-muted)]">
                Bid what you want for the seat. If it fits their private offer,
                they approve. If it’s high, we ask you to lower it — we never
                show their number. If you walk away, the rider still sees that
                someone bid (and can raise their offer).
              </p>
              <div>
                <Label htmlFor="dn">Your name</Label>
                <Input
                  id="dn"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="amt">Your bid ($)</Label>
                <Input
                  id="amt"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                  You’d keep ~
                  {formatCurrency(
                    Math.round(amount * (1 - PLATFORM_TAKE_RATE)),
                  )}{" "}
                  after Share’s ~10% if accepted.
                </p>
              </div>
              <div>
                <Label htmlFor="note">Note to rider</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  const o = offerOnRideRequest(req.id, {
                    driverName: driverName.trim() || "Driver",
                    driverId: "d1",
                    amount,
                    note,
                  });
                  if (!o) {
                    toast.error("Could not place bid");
                    return;
                  }
                  if (o.status === "over_budget") {
                    toast.error(
                      "Bid is above the rider’s private offer — lower your bid and try again",
                    );
                  } else {
                    toast.success(
                      `Bid ${formatCurrency(amount)} sent for rider approval`,
                    );
                  }
                }}
              >
                Send bid
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            {isRiderView ? "Bids to review" : "Your / other bids"}
          </h2>
          {req.offers.length === 0 && (
            <p className="text-sm text-[var(--color-fg-muted)]">
              No bids yet.
            </p>
          )}
          {[...pending, ...otherOffers].map((o) => {
            const within = matchedFare(req.maxBid, o.amount) != null;
            return (
              <Card key={o.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{o.driverName}</p>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {o.note}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                        {formatDate(o.createdAt)} · {formatTime(o.createdAt)}
                      </p>
                      <div className="mt-1">
                        {o.status === "pending_approval" && (
                          <Badge variant="success">Awaiting rider approval</Badge>
                        )}
                        {o.status === "over_budget" && (
                          <Badge variant="outline">
                            {isRiderView
                              ? "Above your offer — raise to unlock"
                              : "Too high — lower bid or wait"}
                          </Badge>
                        )}
                        {o.status === "accepted" && (
                          <Badge variant="success">Accepted</Badge>
                        )}
                        {o.status === "declined" && (
                          <Badge variant="secondary">Declined</Badge>
                        )}
                      </div>
                    </div>
                    <p className="font-display text-xl font-semibold text-[var(--color-primary)]">
                      {formatCurrency(o.amount)}
                    </p>
                  </div>
                  {isRiderView &&
                    req.status === "open" &&
                    o.status === "pending_approval" && (
                      <Button
                        size="sm"
                        disabled={!within}
                        onClick={() => {
                          const success = acceptRideOffer(req.id, o.id);
                          if (success) {
                            toast.success(
                              `Deal locked at ${formatCurrency(o.amount)}`,
                            );
                            navigate({ to: "/trips" });
                          } else {
                            toast.error("Could not accept this bid");
                          }
                        }}
                      >
                        Approve @ {formatCurrency(o.amount)}
                      </Button>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        {req.status === "matched" && (
          <Button asChild className="w-full">
            <Link to="/trips">View trip & SOS</Link>
          </Button>
        )}

        {isRiderView && (
          <p className="text-center text-xs text-[var(--color-fg-subtle)]">
            Playing as {riderName || "rider"}: only you see your private offer
            and approve bids under it.
          </p>
        )}
      </div>
    </AppShell>
  );
}

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
  const riderName = useShareStore((s) => s.riderName);
  const req = rideRequests.find((r) => r.id === id);

  const [amount, setAmount] = useState(25);
  const [note, setNote] = useState(
    "I was already heading that way — can knock it out Saturday.",
  );
  const [driverName, setDriverName] = useState("Tom K.");

  if (!req) {
    return (
      <AppShell title="Request" backTo="/rides/requests" solidHeader>
        <p className="py-12 text-center text-[var(--color-fg-muted)]">
          Request not found.
        </p>
      </AppShell>
    );
  }

  const openOffers = req.offers.filter((o) => o.status === "open");

  return (
    <AppShell
      title={`${req.from.split(",")[0]} → ${req.to.split(",")[0]}`}
      subtitle={`${req.requesterName} · max ${formatCurrency(req.maxBid)}`}
      backTo="/rides/requests"
      solidHeader
    >
      <div className="space-y-4 py-3 pb-10">
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
            </div>
            <p className="font-display text-2xl font-semibold">
              {req.from} → {req.to}
            </p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Needed {formatDate(req.neededBy)}
              {req.flexibleWindow ? ` · ${req.flexibleWindow}` : ""}
            </p>
            <p className="text-sm">{req.notes}</p>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-sm">
              <div className="flex justify-between">
                <span>Rider max bid</span>
                <strong>{formatCurrency(req.maxBid)}</strong>
              </div>
              {req.status === "matched" && (
                <div className="mt-1 flex justify-between text-[var(--color-primary)]">
                  <span>
                    Deal with {req.matchedDriverName}
                  </span>
                  <strong>{formatCurrency(req.matchedAmount ?? 0)}</strong>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {req.status === "open" && (
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-display text-lg font-semibold">
                Driver offer (Tom’s move)
              </h2>
              <p className="text-sm text-[var(--color-fg-muted)]">
                Offer ≤ {formatCurrency(req.maxBid)} to be accept-ready. Deal
                locks at <em>your</em> offer, not the max bid.
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
                <Label htmlFor="amt">Your offer ($)</Label>
                <Input
                  id="amt"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                {matchedFare(req.maxBid, amount) != null ? (
                  <p className="mt-1 text-xs text-[var(--color-primary)]">
                    Within bid — rider can accept at {formatCurrency(amount)} ·
                    you keep ~
                    {formatCurrency(
                      Math.round(amount * (1 - PLATFORM_TAKE_RATE)),
                    )}{" "}
                    after 10%
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-[var(--color-danger,#b42318)]">
                    Above max bid — rider can’t accept until you lower it
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="note">Note</Label>
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
                  if (!o) toast.error("Could not place offer");
                  else toast.success(`Offer ${formatCurrency(amount)} sent`);
                }}
              >
                Send offer
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Offers</h2>
          {req.offers.length === 0 && (
            <p className="text-sm text-[var(--color-fg-muted)]">
              No offers yet — drivers will see this request.
            </p>
          )}
          {req.offers.map((o) => {
            const ok = matchedFare(req.maxBid, o.amount) != null;
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
                        {formatDate(o.createdAt)} · {formatTime(o.createdAt)} ·{" "}
                        {o.status}
                      </p>
                    </div>
                    <p className="font-display text-xl font-semibold text-[var(--color-primary)]">
                      {formatCurrency(o.amount)}
                    </p>
                  </div>
                  {req.status === "open" && o.status === "open" && (
                    <Button
                      size="sm"
                      disabled={!ok}
                      onClick={() => {
                        const success = acceptRideOffer(req.id, o.id);
                        if (success) {
                          toast.success(
                            `Deal locked at ${formatCurrency(o.amount)}`,
                          );
                          navigate({ to: "/trips" });
                        } else {
                          toast.error("Offer above max bid or already closed");
                        }
                      }}
                    >
                      {ok
                        ? `Accept @ ${formatCurrency(o.amount)}`
                        : "Above max bid"}
                    </Button>
                  )}
                  {o.status === "accepted" && (
                    <Badge variant="success">Accepted deal</Badge>
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

        {openOffers.length > 0 && req.status === "open" && (
          <p className="text-center text-xs text-[var(--color-fg-subtle)]">
            Playing as {riderName || "rider"}: accept the best offer under your
            max bid.
          </p>
        )}
      </div>
    </AppShell>
  );
}

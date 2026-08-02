import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useShareStore } from "@/lib/share/store";
import { PLATFORM_TAKE_RATE } from "@/lib/share/data";
import { driverPayout, STRIPE_PILOT_NOTES } from "@/lib/share/payments";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const bookings = useShareStore((s) => s.bookings);
  const demoCheckout = useShareStore((s) => s.demoCheckout);
  const unpaid = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending",
  );
  const [selected, setSelected] = useState(unpaid[0]?.id ?? "");
  const [done, setDone] = useState<string | null>(null);

  const booking = useMemo(
    () => unpaid.find((b) => b.id === selected) ?? unpaid[0],
    [unpaid, selected],
  );

  const amount = booking?.total ?? 12;
  const driverGets = driverPayout(amount, PLATFORM_TAKE_RATE);

  function pay() {
    const label = booking
      ? `Booking ${booking.kind} ${booking.id.slice(-5)}`
      : "Share pilot fare";
    const p = demoCheckout(label, amount, booking?.id);
    setDone(p.stripeLikeId);
    toast.success("Demo payment complete");
  }

  if (done) {
    return (
      <AppShell title="Paid" backTo="/trips" solidHeader>
        <div className="py-12 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <Lock className="size-7" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold">
            Demo Stripe success
          </h2>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            PaymentIntent-style id:{" "}
            <strong className="text-[var(--color-fg)]">{done}</strong>
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--color-fg-muted)]">
            Live Stripe on {STRIPE_PILOT_NOTES.domain} needs your keys + webhook.
            This only simulates the happy path.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
              <Link to="/earnings">View earnings split</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/trips">My trips</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Checkout"
      subtitle="Stripe path · demo mode"
      backTo="/profile"
      solidHeader
    >
      <Card className="mt-3">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-[var(--color-primary)]" />
            <h2 className="font-display text-lg font-semibold">
              Pay with Share
            </h2>
            <Badge variant="secondary">Demo</Badge>
          </div>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Real launch: Stripe Checkout Session on the server, webhook marks
            booking paid, then driver payout queue. Domain:{" "}
            <strong className="text-[var(--color-fg)]">
              {STRIPE_PILOT_NOTES.domain}
            </strong>
          </p>

          {unpaid.length > 0 ? (
            <div>
              <Label htmlFor="bk">Unpaid booking</Label>
              <select
                id="bk"
                className="mt-1 flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm"
                value={booking?.id}
                onChange={(e) => setSelected(e.target.value)}
              >
                {unpaid.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.kind} · {formatCurrency(b.total)} · {b.id.slice(-6)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-fg-muted)]">
              No bookings yet — try a fixed demo fare of $12, or book a ride
              first.
            </p>
          )}

          <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-sm">
            <div className="flex justify-between">
              <span>You pay</span>
              <strong>{formatCurrency(amount)}</strong>
            </div>
            <div className="mt-1 flex justify-between text-[var(--color-fg-muted)]">
              <span>Driver keeps (~)</span>
              <span>{formatCurrency(driverGets)}</span>
            </div>
            <div className="mt-1 flex justify-between text-[var(--color-fg-muted)]">
              <span>Share take {Math.round(PLATFORM_TAKE_RATE * 100)}%</span>
              <span>{formatCurrency(amount - driverGets)}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Card (demo — not charged)</Label>
            <Input placeholder="4242 4242 4242 4242" disabled />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="12 / 28" disabled />
              <Input placeholder="CVC" disabled />
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={pay}>
            <Lock className="size-4" />
            Pay {formatCurrency(amount)} (demo)
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4 mb-8">
        <CardContent className="space-y-2 p-4 text-xs text-[var(--color-fg-muted)]">
          <p className="font-semibold text-[var(--color-fg)]">
            Path to real Stripe
          </p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Create Stripe account → activate US business</li>
            <li>
              Add keys as env: secret (server) + publishable (client)
            </li>
            <li>Server route creates Checkout Session for booking amount</li>
            <li>success_url → share.myendeavors.me/trips?paid=1</li>
            <li>Webhook checkout.session.completed → mark paid in DB</li>
            <li>Later: Stripe Connect to auto-pay drivers weekly</li>
          </ol>
        </CardContent>
      </Card>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShareStore } from "@/lib/share/store";
import { PLATFORM_TAKE_RATE } from "@/lib/share/data";
import { driverPayout } from "@/lib/share/payments";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/earnings")({
  component: EarningsPage,
});

function EarningsPage() {
  const bookings = useShareStore((s) => s.bookings);
  const payments = useShareStore((s) => s.payments);
  const referralCode = useShareStore((s) => s.referralCode);
  const referralCount = useShareStore((s) => s.referralCount);
  const recordReferral = useShareStore((s) => s.recordReferral);

  const gross = bookings.reduce((s, b) => s + b.total, 0);
  const paidGross = payments
    .filter((p) => p.status === "demo_paid")
    .reduce((s, p) => s + p.amount, 0);
  const driverNet = driverPayout(paidGross || gross, PLATFORM_TAKE_RATE);
  const platformCut = (paidGross || gross) - driverNet;

  return (
    <AppShell
      title="Driver earnings"
      subtitle={`~${Math.round((1 - PLATFORM_TAKE_RATE) * 100)}% to drivers`}
      backTo="/profile"
      solidHeader
    >
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <DollarSign className="size-5 text-[var(--color-primary)]" />
            <p className="mt-2 font-display text-2xl font-semibold">
              {formatCurrency(driverNet)}
            </p>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Your take-home (demo)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="size-5 text-[var(--color-accent)]" />
            <p className="mt-2 font-display text-2xl font-semibold">
              {formatCurrency(platformCut)}
            </p>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Share {Math.round(PLATFORM_TAKE_RATE * 100)}% platform
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-2 p-4 text-sm text-[var(--color-fg-muted)]">
          <p className="font-semibold text-[var(--color-fg)]">
            Why drivers join Share
          </p>
          <p>
            Uber/Lyft often keep ~20–30%+. Share pilot targets{" "}
            <strong className="text-[var(--color-fg)]">
              {Math.round(PLATFORM_TAKE_RATE * 100)}%
            </strong>{" "}
            so you keep more on corridor runs and $10 shop parts.
          </p>
        </CardContent>
      </Card>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Payments</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            No Stripe demo payments yet.{" "}
            <Link className="text-[var(--color-primary)] underline" to="/checkout">
              Try checkout
            </Link>
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {payments.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      {formatDate(p.createdAt)} · {p.stripeLikeId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(p.amount)}</p>
                    <Badge variant="success" className="text-[10px]">
                      {p.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 pb-8">
        <Card className="border-[var(--color-primary)]/25">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-[var(--color-primary)]" />
              <h2 className="font-display text-lg font-semibold">
                Refer a driver
              </h2>
            </div>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Your code:{" "}
              <strong className="text-[var(--color-fg)]">{referralCode}</strong>
              {" · "}
              {referralCount} demo referral{referralCount === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Text Uber/Lyft/Spark friends: interview → keep more of the pie.
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => recordReferral()}
            >
              Log a referral (demo)
            </Button>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

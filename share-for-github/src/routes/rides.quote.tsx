import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator, ArrowRightLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { AddressField } from "@/components/share/address-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatMiles, SHARE_TAXI_RATES } from "@/lib/share/fare";
import {
  formatDriveTime,
  quoteRoute,
  type GeoPoint,
  type RouteQuote,
} from "@/lib/share/route-quote";

export const Route = createFileRoute("/rides/quote")({
  component: FareQuotePage,
});

function FareQuotePage() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [fromPt, setFromPt] = useState<GeoPoint | null>(null);
  const [toPt, setToPt] = useState<GeoPoint | null>(null);
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState<RouteQuote | null>(null);

  async function runQuote() {
    const a = pickup.trim();
    const b = dropoff.trim();
    if (a.length < 3 || b.length < 3) {
      toast.error("Need a pickup and a drop-off");
      return;
    }
    if (a.toLowerCase() === b.toLowerCase()) {
      toast.error("Pickup and drop-off need to be different");
      return;
    }
    setBusy(true);
    setQuote(null);
    try {
      const q = await quoteRoute({
        from: fromPt && fromPt.label === a ? fromPt : a,
        to: toPt && toPt.label === b ? toPt : b,
      });
      setQuote(q);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not quote that route",
      );
    } finally {
      setBusy(false);
    }
  }

  function swap() {
    setPickup(dropoff);
    setDropoff(pickup);
    setFromPt(toPt);
    setToPt(fromPt);
    setQuote(null);
  }

  function copyQuote() {
    if (!quote) return;
    const text = [
      `Share base quote · no surge`,
      `${quote.from.label} → ${quote.to.label}`,
      `${formatMiles(quote.miles)} · ${formatDriveTime(quote.seconds)}`,
      `Suggested fare ${formatMoney(quote.fare.meter)}`,
      `(${formatMoney(SHARE_TAXI_RATES.flagDrop)} flag + ${formatMoney(SHARE_TAXI_RATES.perMile)}/mi + ${formatMoney(SHARE_TAXI_RATES.perMinute)}/min · min ${formatMoney(SHARE_TAXI_RATES.minFare)})`,
    ].join("\n");
    void navigator.clipboard.writeText(text).then(
      () => toast.success("Quote copied"),
      () => toast.message(text),
    );
  }

  return (
    <AppShell
      title="Fare quote"
      subtitle="Base rate · no surge"
      backTo="/rides"
      solidHeader
    >
      <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
        Type two addresses. We pull driving miles and time, then run Share’s
        taxi math. Use this when someone asks “what would that cost?”
      </p>

      <Card className="mt-4">
        <CardContent className="space-y-4 p-4">
          <AddressField
            label="Pickup"
            required
            value={pickup}
            onChange={(v) => {
              setPickup(v);
              setFromPt(null);
              setQuote(null);
            }}
            onResolved={(p) => setFromPt({ ...p })}
            placeholder="123 Main St, Lafayette, LA"
          />
          <div className="flex justify-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={swap}
              disabled={!pickup && !dropoff}
            >
              <ArrowRightLeft className="size-3.5" />
              Swap
            </Button>
          </div>
          <AddressField
            label="Drop-off"
            required
            value={dropoff}
            onChange={(v) => {
              setDropoff(v);
              setToPt(null);
              setQuote(null);
            }}
            onResolved={(p) => setToPt({ ...p })}
            placeholder="Cajundome, Lafayette, LA"
          />
          <Button
            type="button"
            className="w-full"
            disabled={busy}
            onClick={() => void runQuote()}
          >
            <Calculator className="size-4" />
            {busy ? "Mapping route…" : "Get suggested fare"}
          </Button>
        </CardContent>
      </Card>

      {quote && (
        <Card className="mt-4 border-[var(--color-primary)]/35 bg-[var(--color-primary)]/6">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
                Suggested fare
              </p>
              <p className="font-display text-4xl font-semibold tabular-nums text-[var(--color-primary)]">
                {formatMoney(quote.fare.meter)}
              </p>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                {formatMiles(quote.miles)} · {formatDriveTime(quote.seconds)}
                {quote.routeCount > 1
                  ? ` · averaged from ${quote.routeCount} routes`
                  : ""}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] px-2 py-2">
                <p className="text-[var(--color-fg-subtle)]">Flag</p>
                <p className="font-semibold tabular-nums">
                  {formatMoney(quote.fare.flagDrop)}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] px-2 py-2">
                <p className="text-[var(--color-fg-subtle)]">Miles</p>
                <p className="font-semibold tabular-nums">
                  {formatMoney(quote.fare.mileageCharge)}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] px-2 py-2">
                <p className="text-[var(--color-fg-subtle)]">Time</p>
                <p className="font-semibold tabular-nums">
                  {formatMoney(quote.fare.timeCharge)}
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[var(--color-fg-muted)]">
              {formatMoney(SHARE_TAXI_RATES.flagDrop)} flag +{" "}
              {formatMoney(SHARE_TAXI_RATES.perMile)}/mi +{" "}
              {formatMoney(SHARE_TAXI_RATES.perMinute)}/min. Floor{" "}
              {formatMoney(SHARE_TAXI_RATES.minFare)}. No surge, no time-of-day
              bump. Distance-only (no clock) would be{" "}
              <span className="font-semibold text-[var(--color-fg)]">
                {formatMoney(quote.distanceOnly.meter)}
              </span>
              .
            </p>

            <p className="truncate text-xs text-[var(--color-fg-subtle)]">
              {quote.from.label} → {quote.to.label}
            </p>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={copyQuote}
            >
              <Copy className="size-4" />
              Copy quote
            </Button>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

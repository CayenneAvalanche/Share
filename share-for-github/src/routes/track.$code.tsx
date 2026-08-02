import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  MapPin,
  CheckCircle2,
  Circle,
  Truck,
  Navigation,
} from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useShareStore } from "@/lib/share/store";
import { TRACK_STEPS } from "@/lib/share/tracking";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import type { DeliveryTrackStatus } from "@/lib/share/data";

export const Route = createFileRoute("/track/$code")({
  component: TrackPage,
});

const ORDER: DeliveryTrackStatus[] = [
  "open",
  "matched",
  "picked_up",
  "in_transit",
  "delivered",
];

function stepIndex(status: DeliveryTrackStatus) {
  if (status === "cancelled") return -1;
  return ORDER.indexOf(status);
}

function TrackPage() {
  const { code } = Route.useParams();
  const deliveries = useShareStore((s) => s.deliveries);
  const advanceDelivery = useShareStore((s) => s.advanceDelivery);
  const [photoNote, setPhotoNote] = useState("Counter handoff photo on file");

  const delivery = deliveries.find(
    (d) =>
      d.trackingCode?.toUpperCase() === code.toUpperCase() || d.id === code,
  );

  if (!delivery) {
    return (
      <AppShell title="Track delivery" backTo="/deliveries" solidHeader>
        <div className="py-16 text-center">
          <p className="font-display text-xl font-semibold">Not found</p>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            No package for code <strong>{code}</strong>
          </p>
          <Button className="mt-4" asChild>
            <Link to="/deliveries">Back to deliveries</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const idx = stepIndex(delivery.status);
  const next =
    idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null;

  return (
    <AppShell
      title="Track delivery"
      subtitle={delivery.trackingCode ?? delivery.id}
      backTo="/deliveries"
      solidHeader
    >
      <Card className="mt-3 overflow-hidden">
        <div className="bg-[var(--color-bg-inverse)] px-5 py-5 text-[var(--color-fg-inverse)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-70">
                Package
              </p>
              <p className="font-display text-xl font-semibold">
                {delivery.item}
              </p>
              <p className="mt-1 text-sm opacity-80">
                {delivery.from.split(",")[0]} → {delivery.to.split(",")[0]}
              </p>
            </div>
            <Badge className="border-0 bg-[#2a6b45] text-[var(--color-fg-inverse)] capitalize">
              {delivery.status.replace("_", " ")}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm opacity-85">
            <span className="inline-flex items-center gap-1">
              <Package className="size-3.5" />
              {formatCurrency(delivery.offer)}
            </span>
            {delivery.driverName && (
              <span className="inline-flex items-center gap-1">
                <Truck className="size-3.5" />
                {delivery.driverName}
              </span>
            )}
          </div>
        </div>
        <CardContent className="p-5">
          {/* Simple map-ish visual */}
          <div className="relative mb-5 h-28 overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-[#1a3d2a] via-[#2a6b45] to-[#3d8f5f]">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute left-[15%] top-[40%] h-px w-[70%] bg-white/80" />
              <div className="absolute left-[15%] top-[38%] size-2.5 rounded-full bg-white" />
              <div className="absolute right-[15%] top-[38%] size-2.5 rounded-full bg-[var(--color-accent)]" />
              <Navigation
                className="absolute left-[48%] top-[28%] size-6 text-white drop-shadow"
                style={{
                  transform: `translateX(${Math.min(40, Math.max(0, idx) * 10)}px)`,
                }}
              />
            </div>
            <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] font-medium text-white/90">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                Pickup
              </span>
              <span className="inline-flex items-center gap-1">
                Drop-off
                <MapPin className="size-3" />
              </span>
            </div>
          </div>

          <ol className="space-y-0">
            {TRACK_STEPS.map((step, i) => {
              const done = idx >= i;
              const current = idx === i;
              const event = delivery.events?.find((e) => e.status === step.status);
              return (
                <li key={step.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {done ? (
                      <CheckCircle2
                        className={`size-5 ${current ? "text-[var(--color-primary)]" : "text-[var(--color-primary)]/70"}`}
                      />
                    ) : (
                      <Circle className="size-5 text-[var(--color-border-strong)]" />
                    )}
                    {i < TRACK_STEPS.length - 1 && (
                      <div
                        className={`my-0.5 w-0.5 flex-1 min-h-6 ${done && idx > i ? "bg-[var(--color-primary)]/40" : "bg-[var(--color-border)]"}`}
                      />
                    )}
                  </div>
                  <div className="pb-4">
                    <p
                      className={`text-sm font-semibold ${done ? "text-[var(--color-fg)]" : "text-[var(--color-fg-subtle)]"}`}
                    >
                      {step.label}
                    </p>
                    {event && (
                      <>
                        <p className="text-xs text-[var(--color-fg-muted)]">
                          {formatDate(event.at)} · {formatTime(event.at)}
                        </p>
                        {event.note && (
                          <p className="mt-0.5 text-xs text-[var(--color-fg-subtle)]">
                            {event.note}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {delivery.status !== "delivered" &&
            delivery.status !== "cancelled" &&
            next && (
              <div className="mt-2 border-t border-[var(--color-border)] pt-4 space-y-2">
                <p className="text-xs text-[var(--color-fg-subtle)]">
                  Driver controls (demo) — advance the package
                </p>
                {(next === "picked_up" || delivery.status === "matched") && (
                  <label className="block text-xs text-[var(--color-fg-muted)]">
                    Pickup photo note
                    <input
                      className="mt-1 flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm"
                      value={photoNote}
                      onChange={(e) => setPhotoNote(e.target.value)}
                      placeholder="Photo of part at counter…"
                    />
                  </label>
                )}
                <Button
                  className="w-full"
                  onClick={() =>
                    advanceDelivery(
                      delivery.id,
                      next,
                      next === "delivered"
                        ? "Handed to recipient"
                        : `Moved to ${trackLabelSafe(next)}`,
                      delivery.driverName ?? "Share driver",
                      next === "picked_up" ? photoNote : undefined,
                    )
                  }
                >
                  Mark: {trackLabelSafe(next)}
                </Button>
              </div>
            )}
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-[var(--color-fg-subtle)]">
        Share tracking code with the shop or recipient:{" "}
        <strong className="text-[var(--color-fg)]">
          {delivery.trackingCode}
        </strong>
      </p>
    </AppShell>
  );
}

function trackLabelSafe(s: DeliveryTrackStatus) {
  return TRACK_STEPS.find((x) => x.status === s)?.label ?? s;
}

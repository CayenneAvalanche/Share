import { Link } from "@tanstack/react-router";
import { Star, Users, Package, Clock, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashcamBubble } from "@/components/share/dashcam-badge";
import {
  formatCurrency,
  formatDate,
  formatTime,
  cn,
} from "@/lib/utils";
import {
  getDriver,
  SCHEDULE_LABELS,
  type Trip,
} from "@/lib/share/data";

/** Sample vehicle photos until drivers upload their own */
const VEHICLE_PHOTOS: Record<string, string> = {
  d1: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
  d2: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
  d3: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80",
  d4: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80",
  d5: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",
};

export function TripCard({ trip, className }: { trip: Trip; className?: string }) {
  const driver = getDriver(trip.driverId);
  const tripPhoto = (trip as Trip & { vehiclePhoto?: string }).vehiclePhoto;
  const vehiclePhoto =
    tripPhoto || (driver ? VEHICLE_PHOTOS[driver.id] : undefined);

  return (
    <Link to="/rides/$id" params={{ id: trip.id }} className={cn("block", className)}>
      <Card className="overflow-hidden transition-all duration-150 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)] active:scale-[0.99]">
        {vehiclePhoto && (
          <div className="relative aspect-[16/9] w-full bg-[var(--color-bg-subtle)]">
            <img
              src={vehiclePhoto}
              alt={driver ? `${driver.vehicle}` : "Vehicle"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {driver?.vehicle ?? "Vehicle"}
            </div>
          </div>
        )}
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-fg-subtle)]">
                {formatDate(trip.departAt)} · {formatTime(trip.departAt)}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-xl font-semibold">
                  {trip.fromShort}
                </span>
                <span className="text-[var(--color-fg-subtle)]">→</span>
                <span className="font-display text-xl font-semibold">
                  {trip.toShort}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                {trip.from.split(",")[0]} to {trip.to.split(",")[0]}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-semibold text-[var(--color-primary)]">
                {formatCurrency(trip.pricePerSeat)}
              </p>
              <p className="text-xs text-[var(--color-fg-subtle)]">per seat</p>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              <Users className="mr-1 size-3" />
              {trip.seatsAvailable} seat{trip.seatsAvailable === 1 ? "" : "s"}
            </Badge>
            <Badge variant="secondary">
              <Package className="mr-1 size-3" />
              Cargo OK
            </Badge>
            <Badge variant="outline">
              <Clock className="mr-1 size-3" />
              {SCHEDULE_LABELS[trip.schedule].split(" ")[0]}
            </Badge>
            {driver?.gender === "woman" && (
              <Badge variant="accent">Woman driver</Badge>
            )}
            <DashcamBubble hasDashcam={driver?.hasDashcam} />
          </div>

          {driver && (
            <div className="flex items-center gap-3 border-t border-[var(--color-border)] pt-3">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{
                  background: `hsl(${driver.avatarHue} 35% 38%)`,
                }}
              >
                {driver.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium">{driver.name}</p>
                  {driver.verified && (
                    <ShieldCheck
                      className="size-3.5 shrink-0 text-[var(--color-primary)]"
                      aria-label="Verified driver"
                    />
                  )}
                </div>
                <p className="truncate text-xs text-[var(--color-fg-muted)]">
                  {driver.vehicle}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Star className="size-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                {driver.rating.toFixed(2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function DeliveryCard({
  from,
  to,
  item,
  offer,
  size,
  notes,
  isBusiness,
}: {
  from: string;
  to: string;
  item: string;
  offer: number;
  size: string;
  notes?: string;
  isBusiness?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold">{item}</p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              {from.split(",")[0]} → {to.split(",")[0]}
            </p>
          </div>
          <p className="font-display text-xl font-semibold text-[var(--color-accent)]">
            {formatCurrency(offer)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="capitalize">
            {size}
          </Badge>
          <Badge variant="outline">Open request</Badge>
          {isBusiness && <Badge variant="default">Business</Badge>}
        </div>
        {notes && (
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

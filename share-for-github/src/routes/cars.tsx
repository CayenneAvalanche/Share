import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Plus, Star, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { DashcamBadge } from "@/components/share/dashcam-badge";
import { useShareStore } from "@/lib/share/store";
import { PLATFORM_TAKE_RATE } from "@/lib/share/data";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/cars")({
  component: CarsPage,
});

function CarsPage() {
  const cars = useShareStore((s) => s.carListings);
  const bookCar = useShareStore((s) => s.bookCar);
  const carBookings = useShareStore((s) => s.carBookings);
  const idVerified = useShareStore((s) => s.idVerified);
  const [daysById, setDaysById] = useState<Record<string, number>>({});

  return (
    <AppShell
      title="Share a car"
      subtitle="Local peer cars · Turo-style"
      solidHeader
      action={
        <Button size="sm" asChild>
          <Link to="/cars/new">
            <Plus className="size-4" />
            List
          </Link>
        </Button>
      }
    >
      <Card className="mt-3 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
        <CardContent className="flex gap-3 p-4">
          <Car className="mt-0.5 size-5 shrink-0 text-[var(--color-primary)]" />
          <div className="text-sm text-[var(--color-fg-muted)]">
            <p className="font-semibold text-[var(--color-fg)]">
              Own lane — not tools, not seats
            </p>
            <p className="mt-1">
              Borrow a neighbor’s car by the day (Turo energy, Hub City scale).
              Drills and bikes stay under{" "}
              <Link to="/share-stuff" className="underline">
                Something else
              </Link>
              . Platform take still ~{Math.round(PLATFORM_TAKE_RATE * 100)}% when
              you take payments live.
            </p>
          </div>
        </CardContent>
      </Card>

      {carBookings.length > 0 && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-[var(--color-fg-muted)]">
            Your car reservations
          </h2>
          <div className="mt-2 space-y-2">
            {carBookings.map((b) => {
              const car = cars.find((c) => c.id === b.carId);
              return (
                <Card key={b.id}>
                  <CardContent className="flex justify-between p-3 text-sm">
                    <span>
                      {car?.makeModel ?? "Car"} · {b.days} day
                      {b.days > 1 ? "s" : ""}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(b.total)}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-5 space-y-3 pb-8">
        <h2 className="font-display text-lg font-semibold">Cars near you</h2>
        {cars
          .filter((c) => c.available)
          .map((car) => {
            const days = daysById[car.id] ?? 2;
            const total = car.ratePerDay * days;
            const hostKeeps = Math.round(total * (1 - PLATFORM_TAKE_RATE));
            return (
              <Card key={car.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">
                        {car.year} {car.makeModel}
                      </p>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {car.city} · {car.ownerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold text-[var(--color-primary)]">
                        {formatCurrency(car.ratePerDay)}
                      </p>
                      <p className="text-xs text-[var(--color-fg-subtle)]">
                        / day
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">
                      <Users className="mr-1 size-3" />
                      {car.seats} seats
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {car.transmission}
                    </Badge>
                    <Badge variant="outline">
                      Deposit {formatCurrency(car.deposit)}
                    </Badge>
                    <DashcamBadge hasDashcam={car.hasDashcam} />
                    <Badge variant="success">
                      <Star className="mr-1 size-3 fill-current" />
                      {car.rating.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    {car.rules}
                  </p>
                  <p className="flex items-start gap-1.5 text-xs text-[var(--color-fg-subtle)]">
                    <Shield className="mt-0.5 size-3.5 shrink-0" />
                    {car.insuranceNote}
                  </p>
                  <div className="flex items-end gap-2 border-t border-[var(--color-border)] pt-3">
                    <div className="flex-1">
                      <Label htmlFor={`d-${car.id}`}>Days</Label>
                      <Input
                        id={`d-${car.id}`}
                        type="number"
                        min={1}
                        max={14}
                        value={days}
                        onChange={(e) =>
                          setDaysById((m) => ({
                            ...m,
                            [car.id]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-[var(--color-fg-muted)]">You pay</p>
                      <p className="font-semibold">{formatCurrency(total)}</p>
                      <p className="text-[10px] text-[var(--color-fg-subtle)]">
                        Host ~{formatCurrency(hostKeeps)} after take
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        if (!idVerified) {
                          toast.error("Verify ID under You before renting a car");
                          return;
                        }
                        bookCar(car.id, days);
                        toast.success("Car reserved (demo)");
                      }}
                    >
                      Reserve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </section>
    </AppShell>
  );
}

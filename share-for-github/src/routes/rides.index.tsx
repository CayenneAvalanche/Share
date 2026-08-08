import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search, MapPinned, Zap } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { TripCard } from "@/components/share/trip-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { HUB_CITIES, type Trip } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";

export const Route = createFileRoute("/rides/")({
  component: RidesPage,
});

function RidesPage() {
  const trips = useShareStore((s) => s.trips);
  const postTrip = useShareStore((s) => s.postTrip);
  const applyAsDriver = useShareStore((s) => s.applyAsDriver);
  const navigate = useNavigate();
  const [from, setFrom] = useState("Any");
  const [to, setTo] = useState("Any");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return trips
      .filter((t) => (from === "Any" ? true : t.from === from))
      .filter((t) => (to === "Any" ? true : t.to === to))
      .filter((t) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          t.from.toLowerCase().includes(q) ||
          t.to.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.departAt).getTime() - new Date(b.departAt).getTime(),
      );
  }, [trips, from, to, query]);

  function quickLeaveLftSaturday() {
    applyAsDriver();
    // next Saturday 8am
    const d = new Date();
    const day = d.getDay();
    const add = day === 6 ? 7 : (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + add);
    d.setHours(8, 0, 0, 0);
    const arrive = new Date(d.getTime() + 3.5 * 3600_000);
    const trip: Trip = {
      id: `user_${Math.random().toString(36).slice(2, 9)}`,
      type: "ride",
      from: "Lafayette, LA",
      to: "Houston, TX",
      fromShort: "LFT",
      toShort: "HOU",
      departAt: d.toISOString(),
      arriveAt: arrive.toISOString(),
      seatsAvailable: 3,
      seatsTotal: 3,
      cargoCapacity: "2 medium bags + trunk",
      pricePerSeat: 30,
      deliveryRate: 18,
      stops: [],
      schedule: "moderate",
      notes: "Quick post: leaving Hub City Saturday morning.",
      driverId: "d1",
      distanceMiles: 217,
      durationHours: 3.5,
    };
    postTrip(trip);
    toast.success("Saturday LFT → HOU posted");
    navigate({ to: `/rides/${trip.id}` as any });
  }

  return (
    <AppShell
      title="Share a ride"
      subtitle="Local now · or long-distance"
      solidHeader
      action={
        <div className="flex gap-1">
          <Button size="sm" variant="outline" asChild>
            <Link to="/rides/requests">Requests</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/rides/post">
              <Plus className="size-4" />
              Post
            </Link>
          </Button>
        </div>
      }
    >
      {/* Fast path: local rides (primary launch focus) */}
      <Link
        to="/local"
        className="mt-3 flex items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-[var(--color-primary)] px-5 py-5 text-[var(--color-primary-fg)] shadow-[var(--shadow-md)] transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/15">
            <MapPinned className="size-6" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">Local ride</p>
            <p className="text-sm opacity-90">
              Nearby now · fastest way to request
            </p>
          </div>
        </div>
        <span className="text-2xl font-light opacity-80">→</span>
      </Link>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
        Long-distance / corridor
      </p>

      <Card className="mt-2 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="size-4 text-[var(--color-primary)]" />
            <span>
              <strong>Quick post:</strong> “Leaving LFT Saturday”
            </span>
          </div>
          <Button size="sm" onClick={quickLeaveLftSaturday}>
            Post LFT → HOU Sat
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-2 border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="text-sm">
            <strong>Need a seat with no listings?</strong>
            <span className="text-[var(--color-fg-muted)]">
              {" "}
              Set a private offer · drivers bid · you approve.
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/rides/requests">Browse requests</Link>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/rides/request/new">Request a trip</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-3 flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
          <Input
            className="pl-9"
            placeholder="Search city or note…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="Any">From anywhere</option>
            {HUB_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="Any">To anywhere</option>
            {HUB_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/local">
            <MapPinned className="size-4" />
            Need a local ride instead?
          </Link>
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 pb-6">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-fg-muted)]">
            No trips match. Post one or widen filters.
          </p>
        ) : (
          filtered.map((trip) => <TripCard key={trip.id} trip={trip} />)
        )}
      </div>
    </AppShell>
  );
}

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  AIRPORT_PRESETS,
  HUB_CITIES,
  type ScheduleStrictness,
  type Trip,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";

export const Route = createFileRoute("/rides/post")({
  component: PostRidePage,
});

const SHORT: Record<string, string> = {
  "Lafayette, LA": "LFT",
  "Houston, TX": "HOU",
  "New Orleans, LA": "MSY",
  "Shreveport, LA": "SHV",
  "Dallas, TX": "DFW",
  "Baton Rouge, LA": "BTR",
  "Lake Charles, LA": "LCH",
  "Austin, TX": "AUS",
};

function PostRidePage() {
  const navigate = useNavigate();
  const postTrip = useShareStore((s) => s.postTrip);
  const isDriverApproved = useShareStore((s) => s.isDriverApproved);
  const applyAsDriver = useShareStore((s) => s.applyAsDriver);

  const [from, setFrom] = useState("Lafayette, LA");
  const [to, setTo] = useState("Houston, TX");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState("08:00");
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState(30);
  const [schedule, setSchedule] = useState<ScheduleStrictness>("moderate");
  const [stops, setStops] = useState("");
  const [cargo, setCargo] = useState("2 medium bags + trunk space");
  const [notes, setNotes] = useState("");

  function applyAirport(fromId: string, toId: string) {
    const a = AIRPORT_PRESETS.find((x) => x.id === fromId);
    const b = AIRPORT_PRESETS.find((x) => x.id === toId);
    if (a) setFrom(a.city);
    if (b) setTo(b.city);
    toast.message("Airport corridor loaded");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (from === to) {
      toast.error("Pick two different cities");
      return;
    }
    if (!isDriverApproved) {
      applyAsDriver();
      toast.message("Driver screening approved", {
        description: "Background check cleared for this demo.",
      });
    }

    const depart = new Date(`${date}T${time}:00`);
    const arrive = new Date(depart.getTime() + 3.5 * 60 * 60 * 1000);

    const trip: Trip = {
      id: `user_${Math.random().toString(36).slice(2, 9)}`,
      type: "ride",
      from,
      to,
      fromShort: SHORT[from] ?? from.slice(0, 3).toUpperCase(),
      toShort: SHORT[to] ?? to.slice(0, 3).toUpperCase(),
      departAt: depart.toISOString(),
      arriveAt: arrive.toISOString(),
      seatsAvailable: seats,
      seatsTotal: seats,
      cargoCapacity: cargo,
      pricePerSeat: price,
      deliveryRate: Math.round(price * 0.65),
      stops: stops
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      schedule,
      notes: notes || "Posted via Share pilot.",
      driverId: "d1",
      distanceMiles: 200,
      durationHours: 3.5,
    };

    postTrip(trip);
    toast.success("Trip posted");
    navigate({ to: "/rides/$id", params: { id: trip.id } });
  }

  return (
    <AppShell title="Post a trip" subtitle="Seats + cargo" backTo="/rides" solidHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-3 pb-10">
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold">Airport corridor presets</p>
            <div className="flex flex-wrap gap-2">
              {[
                ["lft", "hou", "LFT→HOU"],
                ["lft", "shv", "LFT→SHV"],
                ["lft", "msy", "LFT→MSY"],
                ["shv", "lft", "SHV→LFT"],
                ["hou", "dfw", "HOU→DFW"],
              ].map(([a, b, label]) => (
                <Button
                  key={label}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyAirport(a, b)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="from">From</Label>
                <Select
                  id="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                >
                  {HUB_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <Select
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                >
                  {HUB_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Depart</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  max={6}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="price">$/seat</Label>
                <Input
                  id="price"
                  type="number"
                  min={5}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sched">Schedule</Label>
              <Select
                id="sched"
                value={schedule}
                onChange={(e) =>
                  setSchedule(e.target.value as ScheduleStrictness)
                }
              >
                <option value="flexible">Flexible</option>
                <option value="moderate">Somewhat firm</option>
                <option value="strict">On-time departure</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="stops">Stops (comma-separated)</Label>
              <Input
                id="stops"
                value={stops}
                onChange={(e) => setStops(e.target.value)}
                placeholder="Beaumont, TX"
              />
            </div>
            <div>
              <Label htmlFor="cargo">Cargo capacity</Label>
              <Input
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <Button type="submit" size="xl" className="w-full">
          Publish trip
        </Button>
      </form>
    </AppShell>
  );
}

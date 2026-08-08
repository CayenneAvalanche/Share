import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { PhotoField } from "@/components/share/photo-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  AIRPORT_PRESETS,
  HUB_CITIES,
  VEHICLE_TYPES,
  type ScheduleStrictness,
  type Trip,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { useCurrentUser } from "@/lib/auth/use-current-user";

type PostSearch = { edit?: string };

export const Route = createFileRoute("/rides/post")({
  validateSearch: (search: Record<string, unknown>): PostSearch => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
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
  const { edit: editId } = Route.useSearch();
  const postTrip = useShareStore((s) => s.postTrip);
  const updateTrip = useShareStore((s) => s.updateTrip);
  const trips = useShareStore((s) => s.trips);
  const isDriverApproved = useShareStore((s) => s.isDriverApproved);
  const applyAsDriver = useShareStore((s) => s.applyAsDriver);
  const riderName = useShareStore((s) => s.riderName);
  const profileSelfie = useShareStore((s) => s.profileSelfie);
  const myVehicles = useShareStore((s) => s.myVehicles);
  const addVehicle = useShareStore((s) => s.addVehicle);
  const user = useCurrentUser();

  const existing = editId ? trips.find((t) => t.id === editId) : undefined;
  const isEdit = Boolean(existing);

  const [from, setFrom] = useState("Lafayette, LA");
  const [to, setTo] = useState("Shreveport, LA");
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
  const [vehicleType, setVehicleType] = useState<string>("SUV / Crossover");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [vehiclePhoto, setVehiclePhoto] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [garageLoaded, setGarageLoaded] = useState(false);

  useEffect(() => {
    if (existing || garageLoaded || loaded) return;
    const def =
      myVehicles.find((v) => v.isDefault) || myVehicles[0] || null;
    if (def) {
      setSelectedVehicleId(def.id);
      setVehicleLabel(def.label);
      setVehicleType(def.vehicleType || "Other");
      setVehiclePhoto(def.photoUrl || "");
    }
    setGarageLoaded(true);
  }, [myVehicles, existing, garageLoaded, loaded]);

  useEffect(() => {
    if (!existing || loaded) return;
    setFrom(existing.from);
    setTo(existing.to);
    const d = new Date(existing.departAt);
    setDate(d.toISOString().slice(0, 10));
    setTime(
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    );
    setSeats(existing.seatsTotal);
    setPrice(existing.pricePerSeat);
    setSchedule(existing.schedule);
    setStops(existing.stops.join(", "));
    setCargo(existing.cargoCapacity);
    setNotes(existing.notes);
    setVehicleType(existing.vehicleType || "SUV / Crossover");
    setVehicleLabel(existing.vehicleLabel || "");
    setVehiclePhoto(existing.vehiclePhoto || "");
    setLoaded(true);
  }, [existing, loaded]);

  function pickVehicle(id: string) {
    setSelectedVehicleId(id);
    if (id === "__new__") {
      setVehicleLabel("");
      setVehiclePhoto("");
      setVehicleType("SUV / Crossover");
      return;
    }
    const v = myVehicles.find((x) => x.id === id);
    if (!v) return;
    setVehicleLabel(v.label);
    setVehicleType(v.vehicleType || "Other");
    setVehiclePhoto(v.photoUrl || "");
  }

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
    if (!vehiclePhoto) {
      toast.error("Take a photo of the car riders will see");
      return;
    }
    if (!vehicleLabel.trim()) {
      toast.error("Add year / make / model");
      return;
    }
    // keep garage in sync
    addVehicle({
      label: vehicleLabel.trim(),
      vehicleType,
      photoUrl: vehiclePhoto,
      isDefault: myVehicles.length === 0 || selectedVehicleId === "__new__",
    });
    if (!isDriverApproved && !isEdit) {
      applyAsDriver();
      toast.message("Driver screening noted", {
        description: "Finish Apply as driver if you haven’t yet.",
      });
    }

    const depart = new Date(`${date}T${time}:00`);
    const arrive = new Date(depart.getTime() + 3.5 * 60 * 60 * 1000);
    const ownerName =
      user?.displayName || riderName || existing?.postedByName || "Share driver";
    const ownerEmail =
      user?.primaryEmail || existing?.postedByEmail || undefined;

    if (isEdit && existing) {
      updateTrip(existing.id, {
        from,
        to,
        fromShort: SHORT[from] ?? from.slice(0, 3).toUpperCase(),
        toShort: SHORT[to] ?? to.slice(0, 3).toUpperCase(),
        departAt: depart.toISOString(),
        arriveAt: arrive.toISOString(),
        seatsAvailable: Math.min(existing.seatsAvailable, seats) || seats,
        seatsTotal: seats,
        cargoCapacity: cargo,
        pricePerSeat: price,
        deliveryRate: Math.round(price * 0.65),
        stops: stops
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        schedule,
        notes: notes || "Posted via Share.",
        distanceMiles:
          from.includes("Shreveport") || to.includes("Shreveport") ? 215 : 200,
        durationHours: 3.5,
        vehiclePhoto,
        vehicleType,
        vehicleLabel: vehicleLabel.trim() || undefined,
        postedByName: ownerName,
        postedByEmail: ownerEmail,
        driverSelfie: profileSelfie || existing.driverSelfie,
      });
      toast.success("Trip updated");
      navigate({ to: `/rides/${existing.id}` as any });
      return;
    }

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
      notes: notes || "Posted via Share.",
      driverId: "d1",
      distanceMiles:
        from.includes("Shreveport") || to.includes("Shreveport") ? 215 : 200,
      durationHours: 3.5,
      vehiclePhoto,
      vehicleType,
      vehicleLabel: vehicleLabel.trim() || undefined,
      postedByName: ownerName,
      postedByEmail: ownerEmail,
      driverSelfie: profileSelfie || undefined,
    };

    postTrip(trip);
    toast.success("Trip posted");
    navigate({ to: `/rides/${trip.id}` as any });
  }

  if (editId && !existing) {
    return (
      <AppShell title="Edit trip" backTo="/rides" solidHeader>
        <p className="py-10 text-center text-sm text-[var(--color-fg-muted)]">
          Trip not found — it may have been deleted.
        </p>
        <Button className="w-full" onClick={() => navigate({ to: "/rides" })}>
          Back to rides
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={isEdit ? "Edit trip" : "Post a trip"}
      subtitle={isEdit ? "Update your post" : "Seats + cargo"}
      backTo={isEdit && existing ? `/rides/${existing.id}` : "/rides"}
      solidHeader
    >
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
            <div>
              <Label htmlFor="garage">Your vehicle</Label>
              <Select
                id="garage"
                value={selectedVehicleId || (myVehicles[0]?.id ?? "__new__")}
                onChange={(e) => pickVehicle(e.target.value)}
              >
                {myVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                    {v.isDefault ? " (default)" : ""}
                  </option>
                ))}
                <option value="__new__">+ Add a different vehicle</option>
              </Select>
              {myVehicles.length === 0 && (
                <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                  No car on file yet — add one here (also saved from your driver
                  application).
                </p>
              )}
            </div>
            <PhotoField
              id="car-photo"
              label="Photo of your car"
              hint="From your garage, or take a new photo."
              value={vehiclePhoto}
              onChange={setVehiclePhoto}
              facing="environment"
              required
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="vtype">Vehicle type</Label>
                <Select
                  id="vtype"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="vlabel">Year / make / model</Label>
                <Input
                  id="vlabel"
                  value={vehicleLabel}
                  onChange={(e) => setVehicleLabel(e.target.value)}
                  placeholder="e.g. 2018 Honda CR-V"
                  required
                />
              </div>
            </div>
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
              <Label htmlFor="sched">Schedule flexibility</Label>
              <Select
                id="sched"
                value={schedule}
                onChange={(e) =>
                  setSchedule(e.target.value as ScheduleStrictness)
                }
              >
                <option value="flexible">Fully flexible</option>
                <option value="moderate">Somewhat flexible</option>
                <option value="strict">On-time departure</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="stops">Stops (comma-separated)</Label>
              <Input
                id="stops"
                value={stops}
                onChange={(e) => setStops(e.target.value)}
                placeholder="Opelousas, Alexandria"
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
              <Label htmlFor="notes">Notes for riders</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Pickup spot, luggage rules…"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="xl" className="w-full">
          {isEdit ? "Save changes" : "Post trip"}
        </Button>
      </form>
    </AppShell>
  );
}

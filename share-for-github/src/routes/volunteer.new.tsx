import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { LOCAL_SPOTS, type VolunteerCategory } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { createVolunteerRideFn } from "@/lib/share/server-fns";

export const Route = createFileRoute("/volunteer/new")({
  component: NewVolunteerPage,
});

function defaultDate(): string {
  const d = new Date();
  // Prefer next Sunday if still this week; else today
  return d.toISOString().slice(0, 10);
}

function NewVolunteerPage() {
  const requestVolunteerRide = useShareStore((s) => s.requestVolunteerRide);
  const riderName = useShareStore((s) => s.riderName);
  const savedPlaces = useShareStore((s) => s.savedPlaces);
  const navigate = useNavigate();

  const [category, setCategory] = useState<VolunteerCategory>("elder");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState<string>(LOCAL_SPOTS[7] ?? LOCAL_SPOTS[0]);
  const [dropoff, setDropoff] = useState<string>(LOCAL_SPOTS[4] ?? LOCAL_SPOTS[1]);
  const [asap, setAsap] = useState(true);
  const [rideDate, setRideDate] = useState(defaultDate);
  const [rideTime, setRideTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [escalateAfterHours, setEscalateAfterHours] = useState(2);
  const [paidOffer, setPaidOffer] = useState(12);
  const [busy, setBusy] = useState(false);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function formatWhen(): string {
    if (asap) return "ASAP";
    try {
      const dt = new Date(`${rideDate}T${rideTime}:00`);
      return dt.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return `${rideDate} ${rideTime}`;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.error("Name and phone required");
      return;
    }
    if (pickup === dropoff) {
      toast.error("Pick two different places");
      return;
    }
    if (!asap && (!rideDate || !rideTime)) {
      toast.error("Pick a date and pickup time");
      return;
    }
    setBusy(true);
    const when = formatWhen();
    const payload = {
      category,
      fullName: fullName.trim(),
      phone: phone.trim(),
      pickup,
      dropoff,
      when,
      notes: notes.trim(),
      escalateAfterHours,
      paidOffer,
      requesterName: riderName || fullName.trim() || "Community",
    };
    requestVolunteerRide(payload);
    try {
      await createVolunteerRideFn({
        data: payload as unknown as Record<string, unknown>,
      });
      toast.success("Request posted — no account needed yet");
    } catch {
      toast.message("Saved on this phone — cloud sync pending");
    }
    setBusy(false);
    navigate({ to: "/volunteer" });
    // flag for success banner on board
    try {
      sessionStorage.setItem("share-vol-posted", "1");
    } catch {
      /* ignore */
    }
  }

  const placeOptions = [
    ...LOCAL_SPOTS,
    ...savedPlaces.map((p) => p.address),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <AppShell
      title="Request a ride"
      subtitle="No account needed to request"
      backTo="/volunteer"
      solidHeader
    >
      <form onSubmit={onSubmit} className="space-y-4 py-3 pb-10">
        <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <CardContent className="p-4 text-sm text-[var(--color-fg-muted)]">
            Anyone can request. When a driver accepts, you'll create an
            account and add a selfie so they can recognize you at pickup.
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <Label htmlFor="cat">Who is this for?</Label>
              <Select
                id="cat"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as VolunteerCategory)
                }
              >
                <option value="veteran">Veteran</option>
                <option value="disabled">Disabled / mobility need</option>
                <option value="elder">Elder (75+)</option>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Rider name</Label>
                <Input
                  id="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="First and last"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(337) 555-0100"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pickup">Pickup</Label>
              <Select
                id="pickup"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              >
                {placeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="dropoff">Drop-off</Label>
              <Select
                id="dropoff"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
              >
                {placeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="text-sm font-semibold">When do you need the ride?</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAsap(true)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    asap
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                      : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]"
                  }`}
                >
                  ASAP
                </button>
                <button
                  type="button"
                  onClick={() => setAsap(false)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    !asap
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                      : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]"
                  }`}
                >
                  Pick date & time
                </button>
              </div>
              {!asap && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      required={!asap}
                      min={minDate}
                      value={rideDate}
                      onChange={(e) => setRideDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Pickup time</Label>
                    <Input
                      id="time"
                      type="time"
                      required={!asap}
                      value={rideTime}
                      onChange={(e) => setRideTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="esc">Free window (hours)</Label>
                <Select
                  id="esc"
                  value={String(escalateAfterHours)}
                  onChange={(e) =>
                    setEscalateAfterHours(Number(e.target.value))
                  }
                >
                  <option value="0">0 (paid immediately)</option>
                  <option value="0.5">0.5</option>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="pay">Paid offer if needed ($)</Label>
                <Input
                  id="pay"
                  type="number"
                  min={5}
                  max={80}
                  value={paidOffer}
                  onChange={(e) => setPaidOffer(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mobility aids, bags, hospital discharge…"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="xl" className="w-full" disabled={busy}>
          {busy ? "Posting…" : "Post ride request"}
        </Button>
      </form>
    </AppShell>
  );
}

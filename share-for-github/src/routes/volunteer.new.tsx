import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { LOCAL_SPOTS, type VolunteerCategory } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import {
  createVolunteerRideFn,
  updateVolunteerRideFn,
  cancelVolunteerRideFn,
} from "@/lib/share/server-fns";

export const Route = createFileRoute("/volunteer/new")({
  component: NewVolunteerPage,
});

function defaultDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function readEditId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get("edit");
  } catch {
    return null;
  }
}

function NewVolunteerPage() {
  const requestVolunteerRide = useShareStore((s) => s.requestVolunteerRide);
  const updateVolunteerRide = useShareStore((s) => s.updateVolunteerRide);
  const cancelVolunteerRide = useShareStore((s) => s.cancelVolunteerRide);
  const volunteerRides = useShareStore((s) => s.volunteerRides);
  const riderName = useShareStore((s) => s.riderName);
  const savedPlaces = useShareStore((s) => s.savedPlaces);
  const navigate = useNavigate();

  const [editId, setEditId] = useState<string | null>(null);
  const [category, setCategory] = useState<VolunteerCategory>("elder");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [asap, setAsap] = useState(true);
  const [rideDate, setRideDate] = useState(defaultDate);
  const [rideTime, setRideTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [escalateAfterHours, setEscalateAfterHours] = useState(2);
  const [paidOffer, setPaidOffer] = useState(12);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = readEditId();
    if (!id) return;
    const ride = volunteerRides.find((r) => r.id === id);
    if (!ride) {
      toast.error("Request not found on this phone");
      return;
    }
    if (ride.status !== "seeking_volunteer" && ride.status !== "escalated_paid") {
      toast.error("Can’t edit — a driver already accepted this ride");
      navigate({ to: "/volunteer" });
      return;
    }
    setEditId(id);
    setCategory(ride.category);
    setFullName(ride.fullName);
    setPhone(ride.phone);
    setPickup(ride.pickup);
    setDropoff(ride.dropoff);
    setNotes(ride.notes || "");
    setEscalateAfterHours(ride.escalateAfterHours);
    setPaidOffer(ride.paidOffer);
    if (ride.when === "ASAP") {
      setAsap(true);
    } else {
      setAsap(false);
    }
  }, [volunteerRides, navigate]);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const quickPlaces = useMemo(() => {
    return [
      ...LOCAL_SPOTS.slice(0, 8),
      ...savedPlaces.map((p) => p.address || p.label).filter(Boolean),
    ].filter((v, i, a) => a.indexOf(v) === i);
  }, [savedPlaces]);

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
    const pu = pickup.trim();
    const doff = dropoff.trim();
    if (pu.length < 5) {
      toast.error("Enter a full pickup address (street + city)");
      return;
    }
    if (doff.length < 5) {
      toast.error("Enter a full drop-off address (street + city)");
      return;
    }
    if (pu.toLowerCase() === doff.toLowerCase()) {
      toast.error("Pickup and drop-off need to be different places");
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
      pickup: pu,
      dropoff: doff,
      when,
      notes: notes.trim(),
      escalateAfterHours,
      paidOffer,
      requesterName: riderName || fullName.trim() || "Community",
    };

    if (editId) {
      updateVolunteerRide(editId, payload);
      try {
        await updateVolunteerRideFn({
          data: { id: editId, ...payload } as unknown as Record<string, unknown>,
        });
        toast.success("Request updated");
      } catch {
        toast.message("Updated on this phone — cloud sync pending");
      }
    } else {
      requestVolunteerRide(payload);
      try {
        await createVolunteerRideFn({
          data: payload as unknown as Record<string, unknown>,
        });
        toast.success("Request posted — no account needed yet");
      } catch {
        toast.message("Saved on this phone — cloud sync pending");
      }
      try {
        sessionStorage.setItem("share-vol-posted", "1");
      } catch {
        /* ignore */
      }
    }
    setBusy(false);
    navigate({ to: "/volunteer" });
  }

  async function onCancelRequest() {
    if (!editId) return;
    if (!confirm("Cancel this ride request?")) return;
    cancelVolunteerRide(editId);
    try {
      await cancelVolunteerRideFn({ data: { id: editId } });
      toast.success("Request cancelled");
    } catch {
      toast.message("Cancelled on this phone");
    }
    navigate({ to: "/volunteer" });
  }

  return (
    <AppShell
      title={editId ? "Edit ride request" : "Request a ride"}
      subtitle={
        editId
          ? "Change details before a driver accepts"
          : "No account needed to request"
      }
      backTo="/volunteer"
      solidHeader
    >
      <form onSubmit={onSubmit} className="space-y-4 py-3 pb-10">
        {!editId && (
          <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
            <CardContent className="p-4 text-sm text-[var(--color-fg-muted)]">
              Anyone can request. Enter full street addresses so a driver can
              find you. When a driver accepts, you'll create an account and add
              a selfie so they can recognize you at pickup.
            </CardContent>
          </Card>
        )}

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
                <option value="hardship">Hardship (can't pay right now)</option>
                <option value="medical">Medical appointment</option>
                <option value="work">Work / job interview</option>
              </Select>
              <p className="mt-1.5 text-xs text-[var(--color-fg-subtle)]">
                Pick the main reason. Add details in notes (e.g. dialysis, VA
                clinic, first day on the job).
              </p>
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
                  autoComplete="name"
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
                  autoComplete="tel"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pickup">Pickup address</Label>
              <Textarea
                id="pickup"
                required
                rows={2}
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Street number & name, city (e.g. 123 Main St, Lafayette LA)"
                autoComplete="street-address"
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                Full address — apartment or gate code can go in notes.
              </p>
              {quickPlaces.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {quickPlaces.slice(0, 6).map((s) => (
                    <button
                      key={`pu-${s}`}
                      type="button"
                      onClick={() => setPickup(s)}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-fg-muted)] active:bg-[var(--color-primary)]/10"
                    >
                      {s.length > 28 ? `${s.slice(0, 26)}…` : s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="dropoff">Drop-off address</Label>
              <Textarea
                id="dropoff"
                required
                rows={2}
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Street or place name + city (e.g. Our Lady of Lourdes, Lafayette)"
                autoComplete="street-address"
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                Hospital, clinic, work, or home — be as specific as you can.
              </p>
              {quickPlaces.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {quickPlaces.slice(0, 6).map((s) => (
                    <button
                      key={`do-${s}`}
                      type="button"
                      onClick={() => setDropoff(s)}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-fg-muted)] active:bg-[var(--color-primary)]/10"
                    >
                      {s.length > 28 ? `${s.slice(0, 26)}…` : s}
                    </button>
                  ))}
                </div>
              )}
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
                placeholder="Apt #, gate code, wheelchair, bags, hospital discharge…"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="xl" className="w-full" disabled={busy}>
          {busy
            ? "Saving…"
            : editId
              ? "Save changes"
              : "Post ride request"}
        </Button>
        {editId && (
          <Button
            type="button"
            variant="outline"
            className="w-full border-[#b42318]/40 text-[#b42318]"
            onClick={() => void onCancelRequest()}
          >
            Cancel this request
          </Button>
        )}
      </form>
    </AppShell>
  );
}

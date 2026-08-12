import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { AddressField } from "@/components/share/address-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { VolunteerCategory } from "@/lib/share/data";
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
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [bookerName, setBookerName] = useState("");
  const [sharePrompt, setSharePrompt] = useState<{
    riderName: string;
    phone: string;
  } | null>(null);

  useEffect(() => {
    const id = readEditId();
    if (!id) return;
    const ride = volunteerRides.find((r) => r.id === id);
    if (!ride) {
      toast.error("Request not found on this phone");
      return;
    }
    if (
      ride.status !== "seeking_volunteer" &&
      ride.status !== "escalated_paid" &&
      ride.status !== "matched" &&
      ride.status !== "cancelled"
    ) {
      toast.error("This request is already closed");
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
    const booker =
      forSomeoneElse && bookerName.trim()
        ? bookerName.trim()
        : forSomeoneElse
          ? riderName || "Caregiver"
          : "";
    const noteBits = [notes.trim()];
    if (forSomeoneElse) {
      noteBits.push(
        `Booked by ${booker || "someone else"} for rider ${fullName.trim()} (rider should install Share for their own selfie).`,
      );
    }
    const payload = {
      category,
      fullName: fullName.trim(),
      phone: phone.trim(),
      pickup: pu,
      dropoff: doff,
      when,
      notes: noteBits.filter(Boolean).join(" · "),
      escalateAfterHours,
      paidOffer,
      requesterName:
        booker || riderName || fullName.trim() || "Community",
    };

    if (editId) {
      const existing = volunteerRides.find((r) => r.id === editId);
      if (existing?.status === "matched") {
        toast.error("Already matched — use Cancel if you still need to stop this ride");
        setBusy(false);
        return;
      }
      updateVolunteerRide(editId, payload);
      try {
        if (existing?.status === "cancelled") {
          const { reopenVolunteerRideFn } = await import("@/lib/share/server-fns");
          await reopenVolunteerRideFn({
            data: { id: editId, ...payload } as unknown as Record<string, unknown>,
          });
          useShareStore.getState().restoreVolunteerRide(editId, "seeking_volunteer");
          toast.success("Cancelled ride restored & updated — needs a driver again");
        } else {
          await updateVolunteerRideFn({
            data: { id: editId, ...payload } as unknown as Record<string, unknown>,
          });
          toast.success("Request updated");
        }
      } catch {
        toast.message("Updated on this phone — cloud sync pending");
      }
    } else {
      const local = requestVolunteerRide(payload);
      try {
        const res = await createVolunteerRideFn({
          data: payload as unknown as Record<string, unknown>,
        });
        // Use the cloud id so cancel/edit hit the same row drivers see
        if (res?.id && res.id !== local.id) {
          useShareStore.setState((s) => ({
            volunteerRides: s.volunteerRides.map((r) =>
              r.id === local.id ? { ...r, id: res.id } : r,
            ),
          }));
        }
        try {
          localStorage.setItem(
            "share-vol-guest-phone",
            payload.phone,
          );
        } catch {
          /* ignore */
        }
        toast.success("Request posted — no account needed");
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
    if (!editId && forSomeoneElse) {
      setSharePrompt({
        riderName: fullName.trim(),
        phone: phone.trim(),
      });
      return;
    }
    navigate({ to: "/volunteer" });
  }

  async function onCancelRequest() {
    if (!editId) return;
    if (
      !confirm(
        "Cancel this ride request? Drivers will stop seeing it. It stays in Share history.",
      )
    )
      return;
    const who = fullName.trim() || riderName || "Rider";
    cancelVolunteerRide(editId, { cancelledBy: "rider", cancelledByName: who });
    try {
      await cancelVolunteerRideFn({
        data: {
          id: editId,
          cancelledBy: "rider",
          cancelledByName: who,
        },
      });
      toast.success("Cancelled on the live board — kept in history");
    } catch {
      toast.error(
        "Could not reach the server — try Manage my request with your phone number",
      );
    }
    navigate({ to: "/volunteer" });
  }

  async function shareWithRider() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/apply/rider`
        : "https://share.myendeavors.me/apply/rider";
    const text = `I booked you a free Share ride. Please open this link and set up your own profile with a selfie so your driver can recognize you: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Share — set up your rider profile",
          text,
          url,
        });
        toast.success("Share sheet opened");
        return;
      }
    } catch {
      /* user cancelled or unavailable */
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Invite copied — paste into Texts / Messages");
    } catch {
      toast.message(url);
    }
  }

  if (sharePrompt) {
    const smsBody = encodeURIComponent(
      `I booked you a free Share ride. Please open this and set up your own profile with a selfie so the driver can recognize you: ${typeof window !== "undefined" ? window.location.origin : "https://share.myendeavors.me"}/apply/rider`,
    );
    const digits = sharePrompt.phone.replace(/\D/g, "").slice(-10);
    const smsHref =
      digits.length === 10 ? `sms:+1${digits}?&body=${smsBody}` : undefined;

    return (
      <AppShell
        title="Share the app"
        subtitle="So the rider has their own selfie"
        backTo="/volunteer"
        solidHeader
      >
        <div className="space-y-4 py-4 pb-10">
          <Card className="border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
            <CardContent className="space-y-3 p-5">
              <p className="font-display text-xl font-semibold text-[var(--color-fg)]">
                Request posted for {sharePrompt.riderName}
              </p>
              <p className="text-sm text-[var(--color-fg-muted)]">
                Because you booked for someone else, please send them Share.
                Each person who rides should have their{" "}
                <strong className="text-[var(--color-fg)]">
                  own account and selfie
                </strong>{" "}
                so drivers can match the face at pickup — safer for everyone.
              </p>
            </CardContent>
          </Card>
          <Button size="xl" className="w-full" onClick={() => void shareWithRider()}>
            Share app with {sharePrompt.riderName.split(" ")[0] || "rider"}
          </Button>
          {smsHref && (
            <Button size="lg" variant="secondary" className="w-full" asChild>
              <a href={smsHref}>Text them the link</a>
            </Button>
          )}
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => navigate({ to: "/volunteer" })}
          >
            Done — back to Volunteer
          </Button>
          <p className="text-center text-xs text-[var(--color-fg-subtle)]">
            Caregivers can still book — we just want the actual rider on the
            platform when they can.
          </p>
        </div>
      </AppShell>
    );
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
              Anyone can request — no account needed. Many folks usually take
              the bus; use Share when the bus won't get them there (late
              night, missed connection, medical, bags). Start typing an address
              for suggestions, or type the full street + city.
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
                <option value="hardship">Hardship</option>
                <option value="medical">Medical appointment</option>
                <option value="work">Work / job interview</option>
                <option value="local">Local ride (paid or free)</option>

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


            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[var(--color-primary)]"
                  checked={forSomeoneElse}
                  onChange={(e) => setForSomeoneElse(e.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--color-fg)]">
                    Booking for someone else
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--color-fg-muted)]">
                    Caregiver, family, or staff arranging the ride. The person
                    who rides should still get the app for their own selfie /
                    profile.
                  </span>
                </span>
              </label>
              {forSomeoneElse && (
                <div>
                  <Label htmlFor="booker">Your name (person booking)</Label>
                  <Input
                    id="booker"
                    value={bookerName}
                    onChange={(e) => setBookerName(e.target.value)}
                    placeholder="Your name"
                  />
                  <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                    Rider name above = who gets in the car. After you post,
                    we'll ask you to text them Share so they can set up
                    their own profile.
                  </p>
                </div>
              )}
            </div>

            <AddressField
              id="pickup"
              label="Pickup address"
              required
              value={pickup}
              onChange={setPickup}
              placeholder="Start typing street or place (Lafayette area)…"
              hint="Suggestions appear as you type."
            />

            <AddressField
              id="dropoff"
              label="Drop-off address"
              required
              value={dropoff}
              onChange={setDropoff}
              placeholder="Hospital, clinic, work, or home address…"
              hint="Be as specific as you can."
            />

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
                placeholder="Apt #, gate code, wheelchair, bags… e.g. usually rides the bus, missed last bus, dialysis, VA clinic"
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
        <p className="text-center text-sm text-[var(--color-fg-muted)]">
          Requested without an account?{" "}
          <a
            href="/volunteer/manage"
            className="font-semibold text-[var(--color-primary)]"
          >
            Manage / cancel with your phone
          </a>
        </p>
      </form>
    </AppShell>
  );
}

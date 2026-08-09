import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Phone, Pencil, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { AddressField } from "@/components/share/address-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  VOLUNTEER_LABELS,
  type VolunteerRide,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { formatRequestedAt } from "@/lib/utils";
import {
  listVolunteerRidesFn,
  reopenVolunteerRideFn,
  completeVolunteerRideFn,
  cancelVolunteerRideFn,
} from "@/lib/share/server-fns";

export const Route = createFileRoute("/rides/matched/$id")({
  component: MatchedRidePage,
});

function MatchedRidePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const volunteerRides = useShareStore((s) => s.volunteerRides);
  const reopen = useShareStore((s) => s.reopenVolunteerForReaccept);
  const complete = useShareStore((s) => s.completeVolunteerRide);
  const cancelLocal = useShareStore((s) => s.cancelVolunteerRide);
  const localRides = useShareStore((s) => s.localRides);
  const setLocalRideStatus = useShareStore((s) => s.setLocalRideStatus);

  const [cloudRide, setCloudRide] = useState<VolunteerRide | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  // Prefer store, then cloud
  const vol =
    volunteerRides.find((r) => r.id === id) ||
    cloudRide ||
    null;
  const local = localRides.find((r) => r.id === id);

  useEffect(() => {
    let cancelled = false;
    listVolunteerRidesFn()
      .then((res) => {
        if (cancelled) return;
        const hit = res.rides.find((r) => r.id === id);
        if (hit) {
          setCloudRide(hit);
          // merge into store so list stays warm
          useShareStore.setState((s) => {
            const exists = s.volunteerRides.some((r) => r.id === hit.id);
            return {
              volunteerRides: exists
                ? s.volunteerRides.map((r) => (r.id === hit.id ? hit : r))
                : [hit, ...s.volunteerRides],
            };
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [when, setWhen] = useState("ASAP");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!vol) return;
    setPickup(vol.pickup);
    setDropoff(vol.dropoff);
    setWhen(vol.when);
    setNotes(vol.notes || "");
    setPhone(vol.phone);
    setFullName(vol.fullName);
  }, [vol?.id, vol?.pickup, vol?.dropoff, vol?.when, vol?.notes, vol?.phone, vol?.fullName]);

  async function onSaveEdit() {
    if (!vol) return;
    const pu = pickup.trim();
    const doff = dropoff.trim();
    if (pu.length < 5 || doff.length < 5) {
      toast.error("Enter full pickup and drop-off addresses");
      return;
    }
    if (
      !confirm(
        "Saving changes will un-match this ride. A driver must accept it again. Continue?",
      )
    ) {
      return;
    }
    setBusy(true);
    const patch = {
      pickup: pu,
      dropoff: doff,
      when: when.trim() || "ASAP",
      notes: notes.trim(),
      phone: phone.trim(),
      fullName: fullName.trim(),
    };
    reopen(vol.id, patch);
    try {
      await reopenVolunteerRideFn({
        data: {
          id: vol.id,
          category: vol.category,
          fullName: patch.fullName,
          phone: patch.phone,
          pickup: patch.pickup,
          dropoff: patch.dropoff,
          when: patch.when,
          notes: patch.notes,
          escalateAfterHours: vol.escalateAfterHours,
          paidOffer: vol.paidOffer,
        },
      });
      toast.success("Saved — ride is open again until a driver re-accepts");
      setEditing(false);
      navigate({ to: "/rides" });
    } catch {
      toast.message("Saved on this phone — cloud sync pending");
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function onComplete() {
    if (!vol) return;
    if (!confirm("Mark this ride complete?")) return;
    complete(vol.id);
    try {
      await completeVolunteerRideFn({ data: { id: vol.id } });
      toast.success("Ride completed");
    } catch {
      toast.message("Marked complete on this phone");
    }
    navigate({ to: "/rides" });
  }

  async function onCancel() {
    if (!vol) return;
    if (!confirm("Cancel this ride? It moves to history.")) return;
    cancelLocal(vol.id);
    try {
      await cancelVolunteerRideFn({ data: { id: vol.id } });
      toast.success("Cancelled");
    } catch {
      toast.message("Cancelled on this phone");
    }
    navigate({ to: "/rides" });
  }

  // Local ride detail (matched / broadcasting)
  if (!vol && local) {
    return (
      <AppShell title="Local ride" backTo="/rides" solidHeader>
        <Card className="mt-3">
          <CardContent className="space-y-3 p-5">
            <Badge>{local.status}</Badge>
            <p className="font-semibold text-lg">
              {local.pickup} → {local.dropoff}
            </p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              When: {local.when} · {local.requesterName}
            </p>
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Requested {formatRequestedAt(local.createdAt)}
            </p>
            {local.status === "matched" && (
              <Button
                className="w-full"
                onClick={() => {
                  setLocalRideStatus(local.id, "cancelled", "Cancelled after match");
                  toast.success("Local ride cancelled");
                  navigate({ to: "/rides" });
                }}
              >
                Cancel local ride
              </Button>
            )}
            <p className="text-xs text-[var(--color-fg-muted)]">
              Full edit + re-accept for local cloud trips is next — for now use
              Volunteer matched rides for free community trips.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (!vol) {
    return (
      <AppShell title="Ride" backTo="/rides" solidHeader>
        <Card className="mt-6">
          <CardContent className="space-y-3 p-6 text-center">
            <p className="font-semibold">Ride not found on this device</p>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Refresh the Rides tab or Volunteer board and open it again.
            </p>
            <Button asChild>
              <Link to="/rides">Back to Rides</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const tel = vol.phone.replace(/\D/g, "");
  const telHref = tel.length >= 10 ? `tel:+1${tel.slice(-10)}` : undefined;

  return (
    <AppShell
      title={vol.status === "matched" ? "Matched ride" : "Ride request"}
      subtitle={VOLUNTEER_LABELS[vol.category] ?? vol.category}
      backTo="/rides"
      solidHeader
    >
      <div className="mt-3 space-y-4 pb-10">
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-xl font-semibold">
                  {vol.fullName}
                </p>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {vol.phone}
                </p>
              </div>
              <Badge
                variant={
                  vol.status === "matched"
                    ? "success"
                    : vol.status === "seeking_volunteer"
                      ? "outline"
                      : "secondary"
                }
              >
                {vol.status.replace(/_/g, " ")}
              </Badge>
            </div>

            {!editing ? (
              <>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 text-sm">
                  <p className="font-semibold">{vol.pickup}</p>
                  <p className="my-1 text-center text-[var(--color-fg-subtle)]">
                    ↓
                  </p>
                  <p className="font-semibold">{vol.dropoff}</p>
                </div>
                <p className="text-sm">
                  <span className="text-[var(--color-fg-muted)]">When: </span>
                  {vol.when}
                </p>
                {vol.matchedDriverName && (
                  <p className="text-sm text-[var(--color-primary)]">
                    Driver: {vol.matchedDriverName}
                  </p>
                )}
                {vol.notes && (
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Notes: {vol.notes}
                  </p>
                )}
                <p className="text-xs text-[var(--color-fg-subtle)]">
                  Requested {formatRequestedAt(vol.createdAt)}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-fg-muted)]">
                  Editing a matched ride puts it back on the open board. Someone
                  must accept again.
                </p>
                <div>
                  <Label htmlFor="name">Rider name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <AddressField
                  id="pu"
                  label="Pickup"
                  required
                  value={pickup}
                  onChange={setPickup}
                />
                <AddressField
                  id="do"
                  label="Drop-off"
                  required
                  value={dropoff}
                  onChange={setDropoff}
                />
                <div>
                  <Label htmlFor="when">When</Label>
                  <Input
                    id="when"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
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
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void onSaveEdit()}
                  >
                    <RotateCcw className="size-4" />
                    {busy ? "Saving…" : "Save & require re-accept"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Discard edits
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!editing && (
          <div className="flex flex-col gap-2">
            {telHref && (
              <Button size="lg" asChild>
                <a href={telHref}>
                  <Phone className="size-4" />
                  Call {vol.fullName.split(" ")[0] || "rider"}
                </a>
              </Button>
            )}
            {(vol.status === "matched" ||
              vol.status === "seeking_volunteer" ||
              vol.status === "escalated_paid") && (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" />
                Edit ride
              </Button>
            )}
            {vol.status === "matched" && (
              <Button size="lg" variant="outline" onClick={() => void onComplete()}>
                <CheckCircle2 className="size-4" />
                Mark complete
              </Button>
            )}
            {(vol.status === "matched" ||
              vol.status === "seeking_volunteer" ||
              vol.status === "escalated_paid") && (
              <Button
                size="lg"
                variant="outline"
                className="border-[#b42318]/40 text-[#b42318]"
                onClick={() => void onCancel()}
              >
                Cancel ride
              </Button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

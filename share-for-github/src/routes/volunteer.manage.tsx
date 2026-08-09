import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { VOLUNTEER_LABELS, type VolunteerRide } from "@/lib/share/data";
import { formatRequestedAt } from "@/lib/utils";
import { useShareStore } from "@/lib/share/store";
import {
  lookupVolunteerByPhoneFn,
  cancelVolunteerRideFn,
} from "@/lib/share/server-fns";

export const Route = createFileRoute("/volunteer/manage")({
  component: ManageVolunteerPage,
});

/**
 * Guest cancel/manage without an account.
 * Identity = phone number used on the request (+ optional name).
 */
function ManageVolunteerPage() {
  const cancelLocal = useShareStore((s) => s.cancelVolunteerRide);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [rides, setRides] = useState<VolunteerRide[]>([]);
  const [busy, setBusy] = useState(false);
  const [looked, setLooked] = useState(false);

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLooked(true);
    try {
      const res = await lookupVolunteerByPhoneFn({
        data: { phone: phone.trim(), fullName: fullName.trim() || undefined },
      });
      setRides(res.rides);
      if (res.rides.length === 0) {
        toast.message("No open requests for that phone");
      }
    } catch {
      toast.error("Could not look up requests — try again");
      setRides([]);
    } finally {
      setBusy(false);
    }
  }

  async function onCancel(r: VolunteerRide) {
    if (
      !confirm(
        `Cancel request for ${r.fullName}?\n${r.pickup} → ${r.dropoff}\n\nThis updates the live board for drivers.`,
      )
    ) {
      return;
    }
    try {
      await cancelVolunteerRideFn({ data: { id: r.id } });
      cancelLocal(r.id);
      setRides((prev) => prev.filter((x) => x.id !== r.id));
      toast.success("Cancelled — drivers will no longer see this request");
    } catch {
      toast.error("Cancel failed — call Share if you still need help");
    }
  }

  return (
    <AppShell
      title="Manage my request"
      subtitle="No account needed — use the phone on your request"
      backTo="/volunteer"
      solidHeader
    >
      <Card className="mt-3 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
        <CardContent className="space-y-2 p-4 text-sm text-[var(--color-fg-muted)]">
          <p className="font-semibold text-[var(--color-fg)]">
            How cancel works without signing up
          </p>
          <p>
            When you request a ride, we save it with your{" "}
            <strong>phone number</strong>. Enter that same number here to find
            and cancel it — even if a driver already matched. Founders also see
            cancelled rides in History.
          </p>
        </CardContent>
      </Card>

      <form onSubmit={onLookup} className="mt-4 space-y-3">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <Label htmlFor="phone">Phone on the request</Label>
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
            <div>
              <Label htmlFor="name">Name (optional — if several matches)</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="First name"
                autoComplete="name"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Looking up…" : "Find my requests"}
            </Button>
          </CardContent>
        </Card>
      </form>

      {looked && (
        <section className="mt-5 space-y-3 pb-10">
          <h2 className="font-display text-lg font-semibold">
            Open / matched ({rides.length})
          </h2>
          {rides.length === 0 ? (
            <p className="text-sm text-[var(--color-fg-muted)]">
              Nothing open for that phone. It may already be cancelled, or the
              number doesn't match.
            </p>
          ) : (
            rides.map((r) => (
              <Card key={r.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-semibold">{r.fullName}</p>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {r.pickup} → {r.dropoff}
                      </p>
                      <p className="text-xs text-[var(--color-fg-subtle)]">
                        {r.when} · {r.phone}
                      </p>
                      <p className="text-xs font-medium text-[var(--color-fg-muted)]">
                        Requested {formatRequestedAt(r.createdAt)}
                      </p>
                    </div>
                    <Badge>{r.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-fg-subtle)]">
                    {(VOLUNTEER_LABELS as Record<string, string>)[r.category] ??
                      r.category}
                    {r.matchedDriverName
                      ? ` · Driver: ${r.matchedDriverName}`
                      : ""}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#b42318]/40 text-[#b42318]"
                    onClick={() => void onCancel(r)}
                  >
                    Cancel this request
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      )}

      <p className="pb-8 text-center text-sm text-[var(--color-fg-muted)]">
        Need a new ride?{" "}
        <Link to="/volunteer/new" className="font-semibold text-[var(--color-primary)]">
          Request a ride
        </Link>
      </p>
    </AppShell>
  );
}

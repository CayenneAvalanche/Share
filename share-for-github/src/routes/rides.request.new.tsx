import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { HUB_CITIES } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";

export const Route = createFileRoute("/rides/request/new")({
  component: NewRideRequestPage,
});

function nextSaturday() {
  const d = new Date();
  const day = d.getDay();
  const add = day === 6 ? 7 : (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d.toISOString().slice(0, 10);
}

function NewRideRequestPage() {
  const postRideRequest = useShareStore((s) => s.postRideRequest);
  const riderName = useShareStore((s) => s.riderName);
  const navigate = useNavigate();
  const [from, setFrom] = useState("Lafayette, LA");
  const [to, setTo] = useState("Shreveport, LA");
  const [neededBy, setNeededBy] = useState(nextSaturday);
  const [seats, setSeats] = useState(1);
  const [maxBid, setMaxBid] = useState(40);
  const [notes, setNotes] = useState(
    "Need a seat Saturday. Flexible on exact time.",
  );
  const [flexibleWindow, setWindow] = useState("Saturday morning–afternoon");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (from === to) {
      toast.error("Pick two different cities");
      return;
    }
    if (maxBid < 5) {
      toast.error("Your offer is too low");
      return;
    }
    const req = postRideRequest({
      from,
      to,
      neededBy: new Date(`${neededBy}T09:00:00`).toISOString(),
      seats,
      maxBid,
      notes: notes.trim(),
      requesterName: riderName && riderName !== "Guest" ? riderName : "You",
      flexibleWindow,
    });
    toast.success("Request live — your offer is private; drivers will bid");
    navigate({ to: "/rides/requests/$id", params: { id: req.id } });
  }

  return (
    <AppShell
      title="Request a trip"
      subtitle="Private offer · drivers bid"
      backTo="/rides/requests"
      solidHeader
    >
      <form onSubmit={onSubmit} className="space-y-4 py-3 pb-10">
        <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <CardContent className="p-4 text-sm text-[var(--color-fg-muted)]">
            Set a <strong className="text-[var(--color-fg)]">private offer</strong> — the
            most you’ll pay (e.g. $40 to Shreveport). Drivers never see that number.
            They place a <strong className="text-[var(--color-fg)]">bid</strong>. If it
            fits, you approve. Deal locks at their bid.
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
                <Label htmlFor="day">Needed day</Label>
                <Input
                  id="day"
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  max={4}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bid">Your private offer — max you’ll pay ($)</Label>
              <Input
                id="bid"
                type="number"
                min={5}
                step={1}
                value={maxBid}
                onChange={(e) => setMaxBid(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                Drivers only match if their offer is ≤ this number.
              </p>
            </div>
            <div>
              <Label htmlFor="win">Flexibility</Label>
              <Input
                id="win"
                value={flexibleWindow}
                onChange={(e) => setWindow(e.target.value)}
                placeholder="Anytime Saturday / morning only…"
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
          Post trip request
        </Button>
      </form>
    </AppShell>
  );
}

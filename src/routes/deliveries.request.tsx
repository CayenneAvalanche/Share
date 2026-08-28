import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { HUB_CITIES } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { matchDeliveryToTrips } from "@/lib/share/corridor";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/deliveries/request")({
  component: DeliveryRequestPage,
});

function DeliveryRequestPage() {
  const navigate = useNavigate();
  const requestDelivery = useShareStore((s) => s.requestDelivery);
  const trips = useShareStore((s) => s.trips);
  const claimDeliveryOnTrip = useShareStore((s) => s.claimDeliveryOnTrip);

  const [from, setFrom] = useState("Alexandria, LA");
  const [to, setTo] = useState("Shreveport, LA");
  const [item, setItem] = useState("");
  const [size, setSize] = useState<"small" | "medium" | "large">("medium");
  const [offer, setOffer] = useState(25);
  const [neededBy, setNeededBy] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");

  const previewMatches = matchDeliveryToTrips(
    {
      from,
      to,
      neededBy: new Date(`${neededBy}T18:00:00`).toISOString(),
    },
    trips,
  ).slice(0, 3);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item.trim()) {
      toast.error("Describe the item");
      return;
    }
    if (from === to) {
      toast.error("Pick two different cities");
      return;
    }

    requestDelivery({
      from,
      to,
      item: item.trim(),
      size,
      offer,
      neededBy: new Date(`${neededBy}T18:00:00`).toISOString(),
      notes: notes.trim() || "Handle with care.",
    });

    toast.success("Delivery request posted");
    navigate({ to: "/deliveries" });
  }

  return (
    <AppShell
      title="Request a delivery"
      subtitle="Match with drivers already on route"
      backTo="/deliveries"
      solidHeader
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-3 pb-10">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <Label htmlFor="item">What are you sending?</Label>
              <Input
                id="item"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="e.g. Desktop printer (boxed)"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="from">Pickup city</Label>
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
                <Label htmlFor="to">Drop-off city</Label>
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
                <Label htmlFor="size">Size</Label>
                <Select
                  id="size"
                  value={size}
                  onChange={(e) =>
                    setSize(e.target.value as "small" | "medium" | "large")
                  }
                >
                  <option value="small">Small (backpack)</option>
                  <option value="medium">Medium (box)</option>
                  <option value="large">Large (trunk)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="offer">Offer ($)</Label>
                <Input
                  id="offer"
                  type="number"
                  min={5}
                  max={150}
                  value={offer}
                  onChange={(e) => setOffer(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="needed">Needed by</Label>
              <Input
                id="needed"
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Fragile? Pickup window? Contact tips…"
              />
            </div>
          </CardContent>
        </Card>

        {previewMatches.length > 0 && (
          <Card className="border-[var(--color-primary)]/25">
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-semibold">
                {previewMatches.length} corridor trip(s) would light up
              </p>
              {previewMatches.map((m) => (
                <p key={m.trip.id} className="text-xs text-[var(--color-fg-muted)]">
                  {m.trip.fromShort}→{m.trip.toShort}: pickup ~{formatTime(m.estimatedPickupAt)},
                  drop ~{formatTime(m.estimatedDropAt)} · {m.detourNote}
                </p>
              ))}
            </CardContent>
          </Card>
        )}
        <Button type="submit" size="xl" className="w-full">
          Post delivery request
        </Button>
      </form>
    </AppShell>
  );
}

import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { HUB_CITIES } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";

export const Route = createFileRoute("/apply/delivery")({
  component: DeliveryApplyPage,
});

function DeliveryApplyPage() {
  const requestDelivery = useShareStore((s) => s.requestDelivery);
  const navigate = useNavigate();
  const [from, setFrom] = useState("Lafayette, LA");
  const [to, setTo] = useState("Baton Rouge, LA");
  const [item, setItem] = useState("");
  const [size, setSize] = useState<"small" | "medium" | "large">("small");
  const [offer, setOffer] = useState(10);
  const [neededBy, setNeededBy] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isBusiness, setIsBusiness] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item.trim() || !contactName.trim() || !contactEmail.includes("@")) {
      toast.error("Item, name, and email are required");
      return;
    }
    if (from === to) {
      toast.error("Pick two different cities");
      return;
    }

    const delivery = requestDelivery({
      from,
      to,
      item: item.trim(),
      size,
      offer,
      neededBy: new Date(`${neededBy}T18:00:00`).toISOString(),
      notes: notes.trim() || "Handle with care.",
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      isBusiness,
    });

    toast.success("Delivery posted — tracking ready");
    navigate({
      to: "/track/$code",
      params: { code: delivery.trackingCode ?? delivery.id },
    });
  }

  return (
    <AppShell
      title="Delivery request"
      subtitle="Tracked handoffs · even $10 runs"
      backTo="/apply"
      solidHeader
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-3 pb-10">
        <Card className="border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5">
          <CardContent className="p-4 text-sm text-[var(--color-fg-muted)]">
            After you submit, you get a tracking code. Driver advances: matched →
            picked up → in transit → delivered. Perfect for shop parts.
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <input
                id="biz"
                type="checkbox"
                checked={isBusiness}
                onChange={(e) => setIsBusiness(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              <Label htmlFor="biz" className="mb-0">
                This is for a business / shop
              </Label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="cname">Your name / shop</Label>
                <Input
                  id="cname"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cemail">Email</Label>
                <Input
                  id="cemail"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="item">What are you sending?</Label>
              <Input
                id="item"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="e.g. HVAC valve / printer / envelope"
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
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="offer">Offer ($)</Label>
                <Input
                  id="offer"
                  type="number"
                  min={5}
                  max={200}
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
                placeholder="Pickup window, shop hours, fragile…"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="xl" className="w-full">
          Submit & get tracking
        </Button>
        <Button type="button" variant="outline" className="w-full" asChild>
          <Link
            to="/track/$code"
            params={{ code: "SHR-4K2M" }}
          >
            See demo track: SHR-4K2M
          </Link>
        </Button>
      </form>
    </AppShell>
  );
}

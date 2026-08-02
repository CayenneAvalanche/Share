import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { LOCAL_SPOTS, type VolunteerCategory } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";

export const Route = createFileRoute("/volunteer/new")({
  component: NewVolunteerPage,
});

function NewVolunteerPage() {
  const requestVolunteerRide = useShareStore((s) => s.requestVolunteerRide);
  const riderName = useShareStore((s) => s.riderName);
  const savedPlaces = useShareStore((s) => s.savedPlaces);
  const navigate = useNavigate();

  const [category, setCategory] = useState<VolunteerCategory>("veteran");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState<string>(LOCAL_SPOTS[7]);
  const [dropoff, setDropoff] = useState<string>(LOCAL_SPOTS[4]);
  const [when, setWhen] = useState("ASAP");
  const [notes, setNotes] = useState("");
  const [escalateAfterHours, setEscalateAfterHours] = useState(2);
  const [paidOffer, setPaidOffer] = useState(12);
  const [daytimeOnly, setDaytimeOnly] = useState(true);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.error("Name and phone required");
      return;
    }
    if (pickup === dropoff) {
      toast.error("Pick two different places");
      return;
    }
    const quiet =
      daytimeOnly && (category === "elder" || category === "disabled")
        ? "Quiet hours: daytime / early evening only (no late-night)."
        : "";
    requestVolunteerRide({
      category,
      fullName: fullName.trim(),
      phone: phone.trim(),
      pickup,
      dropoff,
      when,
      notes: [notes.trim(), quiet].filter(Boolean).join(" "),
      escalateAfterHours,
      paidOffer,
      requesterName: riderName || "Community",
    });
    toast.success("Volunteer ride posted");
    navigate({ to: "/volunteer" });
  }

  const placeOptions = [
    ...LOCAL_SPOTS,
    ...savedPlaces.map((p) => p.address),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <AppShell
      title="Request volunteer ride"
      subtitle="Elder · veteran · disabled"
      backTo="/volunteer"
      solidHeader
    >
      <form onSubmit={onSubmit} className="space-y-4 py-3 pb-10">
        <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <CardContent className="p-4 text-sm text-[var(--color-fg-muted)]">
            Free first. Auto-paid after your window. Elders/disabled default to{" "}
            <strong className="text-[var(--color-fg)]">daytime-only</strong>{" "}
            quiet hours.
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
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
            <div>
              <Label htmlFor="when">When</Label>
              <Select
                id="when"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              >
                <option>ASAP</option>
                <option>In 1 hour</option>
                <option>This afternoon</option>
                <option>Tomorrow morning</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="day"
                type="checkbox"
                checked={daytimeOnly}
                onChange={(e) => setDaytimeOnly(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              <Label htmlFor="day" className="mb-0">
                Daytime / quiet hours only (recommended for elders)
              </Label>
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

        <Button type="submit" size="xl" className="w-full">
          Post volunteer request
        </Button>
      </form>
    </AppShell>
  );
}

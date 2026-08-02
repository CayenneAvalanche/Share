import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { HUB_CITIES } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";

export const Route = createFileRoute("/cars/new")({
  component: ListCarPage,
});

function ListCarPage() {
  const listCar = useShareStore((s) => s.listCar);
  const riderName = useShareStore((s) => s.riderName);
  const navigate = useNavigate();
  const [makeModel, setMakeModel] = useState("");
  const [year, setYear] = useState(2020);
  const [seats, setSeats] = useState(5);
  const [transmission, setTransmission] = useState<"auto" | "manual">("auto");
  const [ratePerDay, setRate] = useState(45);
  const [deposit, setDeposit] = useState(200);
  const [city, setCity] = useState("Lafayette, LA");
  const [hasDashcam, setHasDashcam] = useState(true);
  const [insuranceNote, setInsurance] = useState(
    "Owner policy primary · renter 21+",
  );
  const [rules, setRules] = useState("No smoking. Full tank on return.");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!makeModel.trim()) {
      toast.error("Make & model required");
      return;
    }
    listCar({
      makeModel: makeModel.trim(),
      year,
      seats,
      transmission,
      ratePerDay,
      deposit,
      city,
      ownerName: riderName || "Host",
      hasDashcam,
      insuranceNote,
      rules,
    });
    toast.success("Car listed");
    navigate({ to: "/cars" });
  }

  return (
    <AppShell
      title="List your car"
      subtitle="Peer host · local first"
      backTo="/cars"
      solidHeader
    >
      <form onSubmit={onSubmit} className="space-y-4 py-3 pb-10">
        <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <CardContent className="p-4 text-sm text-[var(--color-fg-muted)]">
            This is <strong className="text-[var(--color-fg)]">Share a car</strong>{" "}
            — whole-vehicle rental, not a seat and not a drill. Insurance is
            still on you + broker for pilot; badge honesty on dashcam helps
            trust.
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <Label htmlFor="mm">Make & model</Label>
              <Input
                id="mm"
                required
                value={makeModel}
                onChange={(e) => setMakeModel(e.target.value)}
                placeholder="Toyota Camry"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={2}
                  max={8}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="tr">Trans</Label>
                <Select
                  id="tr"
                  value={transmission}
                  onChange={(e) =>
                    setTransmission(e.target.value as "auto" | "manual")
                  }
                >
                  <option value="auto">Auto</option>
                  <option value="manual">Manual</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rate">$/day</Label>
                <Input
                  id="rate"
                  type="number"
                  min={20}
                  value={ratePerDay}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="dep">Deposit $</Label>
                <Input
                  id="dep"
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {HUB_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="cam"
                type="checkbox"
                checked={hasDashcam}
                onChange={(e) => setHasDashcam(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              <Label htmlFor="cam" className="mb-0">
                Dashcam on during rentals
              </Label>
            </div>
            <div>
              <Label htmlFor="ins">Insurance note (honest)</Label>
              <Input
                id="ins"
                value={insuranceNote}
                onChange={(e) => setInsurance(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rules">Rules</Label>
              <Textarea
                id="rules"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <Button type="submit" size="xl" className="w-full">
          Publish car listing
        </Button>
      </form>
    </AppShell>
  );
}

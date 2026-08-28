import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PhotoField } from "@/components/share/photo-field";
import { HUB_CITIES } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useMyAppStatus } from "@/lib/share/use-my-apps";
import { createCarListingFn } from "@/lib/share/server-fns";

export const Route = createFileRoute("/cars/new")({
  component: ListCarPage,
});

function ListCarPage() {
  const listCar = useShareStore((s) => s.listCar);
  const riderName = useShareStore((s) => s.riderName);
  const isDriverApproved = useShareStore((s) => s.isDriverApproved);
  const user = useCurrentUser();
  const { driverActive } = useMyAppStatus();
  const navigate = useNavigate();
  const hostOk = driverActive || isDriverApproved;
  const [makeModel, setMakeModel] = useState("");
  const [year, setYear] = useState(2020);
  const [seats, setSeats] = useState(5);
  const [transmission, setTransmission] = useState<"auto" | "manual">("auto");
  const [ratePerDay, setRate] = useState(45);
  const [deposit, setDeposit] = useState(200);
  const [city, setCity] = useState("Lafayette, LA");
  const [hasDashcam, setHasDashcam] = useState(true);
  const [insuranceNote, setInsurance] = useState(
    "Owner policy primary · renter must be approved Share driver + DMV history · pilot: pay host in person",
  );
  const [rules, setRules] = useState("No smoking. Full tank on return.");
  const [photoUrl, setPhotoUrl] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hostOk) {
      toast.error("Hosts must be approved Share drivers");
      return;
    }
    if (!makeModel.trim()) {
      toast.error("Make & model required");
      return;
    }
    if (!photoUrl) {
      toast.error("Add a photo of the car");
      return;
    }
    const owner =
      user?.displayName || riderName || user?.primaryEmail || "Host";
    const listing = listCar({
      makeModel: makeModel.trim(),
      year,
      seats,
      transmission,
      ratePerDay,
      deposit,
      city,
      ownerName: owner,
      hasDashcam,
      insuranceNote,
      rules,
      photoUrl: photoUrl.trim() || undefined,
    });
    try {
      await createCarListingFn({
        data: {
          ...listing,
          ownerEmail: user?.primaryEmail || undefined,
        } as unknown as Record<string, unknown>,
      });
      toast.success(
        "Car listed on all devices — renters need approved driver + DMV history",
      );
    } catch {
      toast.message("Listed on this device — cloud sync pending");
    }
    navigate({ to: "/cars" });
  }

  return (
    <AppShell
      title="List your car"
      subtitle="Peer host · local pilot"
      backTo="/cars"
      solidHeader
    >
      <form onSubmit={onSubmit} className="space-y-4 py-3 pb-10">
        <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <CardContent className="space-y-2 p-4 text-sm text-[var(--color-fg-muted)]">
            <p>
              <strong className="text-[var(--color-fg)]">Share a car</strong>{" "}
              is whole-vehicle rental (Turo-style), not a ride seat. Anyone who
              reserves must be an{" "}
              <strong className="text-[var(--color-fg)]">
                approved Share driver
              </strong>{" "}
              with a{" "}
              <strong className="text-[var(--color-fg)]">
                DMV driving history
              </strong>{" "}
              on file (same Drivers list in your founder inbox).
            </p>
            <p>
              Pilot: list → reserve →{" "}
              <strong className="text-[var(--color-fg)]">
                pay / handoff in person
              </strong>
              . Insurance stays with you + broker until platform coverage is
              live.
            </p>
            {!hostOk && (
              <p className="rounded-[var(--radius-md)] bg-[#b42318]/10 px-3 py-2 text-[#b42318]">
                You need an approved driver application before listing.{" "}
                <Link to="/apply/driver" className="underline font-semibold">
                  Apply as driver
                </Link>
              </p>
            )}
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
            <PhotoField
              id="car-photo"
              label="Vehicle photo"
              hint="Take a live photo first — then add more from your library if needed"
              value={photoUrl}
              onChange={setPhotoUrl}
              facing="environment"
              kind="vehicle"
              captureFirst
              required
            />
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
                <Label htmlFor="trans">Trans</Label>
                <Select
                  id="trans"
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="rate">$/day</Label>
                <Input
                  id="rate"
                  type="number"
                  min={10}
                  value={ratePerDay}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="dep">Deposit $</Label>
                <Input
                  id="dep"
                  type="number"
                  min={0}
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
                id="dash"
                type="checkbox"
                checked={hasDashcam}
                onChange={(e) => setHasDashcam(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              <Label htmlFor="dash" className="mb-0">
                Dashcam on during rentals
              </Label>
            </div>
            <div>
              <Label htmlFor="ins">Insurance note</Label>
              <Textarea
                id="ins"
                value={insuranceNote}
                onChange={(e) => setInsurance(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="rules">House rules</Label>
              <Textarea
                id="rules"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
        <Button type="submit" size="xl" className="w-full" disabled={!hostOk}>
          {hostOk ? "List car for rent" : "Driver approval required"}
        </Button>
      </form>
    </AppShell>
  );
}

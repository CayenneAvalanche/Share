import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { PhotoField } from "@/components/share/photo-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  HUB_CITIES,
  RENTAL_CATEGORIES,
  type RentalCategory,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { createBorrowFn, createRentalFn } from "@/lib/share/server-fns";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/share-stuff/new")({
  component: NewShareStuffPage,
});

function NewShareStuffPage() {
  const listRental = useShareStore((s) => s.listRental);
  const requestBorrow = useShareStore((s) => s.requestBorrow);
  const replaceRentalId = useShareStore((s) => s.replaceRentalId);
  const replaceBorrowId = useShareStore((s) => s.replaceBorrowId);
  const riderName = useShareStore((s) => s.riderName);
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"list" | "need">("list");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RentalCategory>("tools");
  const [rate, setRate] = useState(15);
  const [rateUnit, setRateUnit] = useState<"hour" | "day" | "weekend">("day");
  const [city, setCity] = useState("Lafayette, LA");
  const [deposit, setDeposit] = useState(20);
  const [photoUrl, setPhotoUrl] = useState("");
  const [neededBy, setNeededBy] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    if (mode === "list" && !photoUrl) {
      toast.error(
        "Add a photo of the item so neighbors know what they’re borrowing",
      );
      return;
    }

    const ownerName = user?.displayName || riderName || "Share member";
    const ownerEmail = user?.primaryEmail ?? undefined;

    if (mode === "list") {
      const localId = listRental({
        title: title.trim(),
        description: description.trim() || "Available to share.",
        category,
        rate,
        rateUnit,
        city,
        ownerName,
        deposit: deposit || undefined,
        photoUrl,
      });
      try {
        const res = await createRentalFn({
          data: {
            title: title.trim(),
            description: description.trim() || "Available to share.",
            category,
            rate,
            rateUnit,
            city,
            ownerName,
            ownerEmail,
            deposit: deposit || undefined,
            photoUrl,
          },
        });
        if (res?.id) replaceRentalId(localId, res.id);
        toast.success("Listed for everyone on Share");
      } catch {
        toast.message("Saved on this phone — cloud sync pending");
      }
    } else {
      const needed = new Date(`${neededBy}T12:00:00`).toISOString();
      const localId = requestBorrow({
        title: title.trim(),
        description: description.trim() || "Need this soon.",
        category,
        offer: rate,
        rateUnit,
        city,
        neededBy: needed,
        requesterName: ownerName,
        photoUrl: photoUrl || undefined,
      });
      try {
        const res = await createBorrowFn({
          data: {
            title: title.trim(),
            description: description.trim() || "Need this soon.",
            category,
            offer: rate,
            rateUnit,
            city,
            neededBy: needed,
            requesterName: ownerName,
            requesterEmail: ownerEmail,
            photoUrl: photoUrl || undefined,
          },
        });
        if (res?.id) replaceBorrowId(localId, res.id);
        toast.success("Need posted for everyone on Share");
      } catch {
        toast.message("Saved on this phone — cloud sync pending");
      }
    }
    navigate({ to: "/share-stuff" });
  }

  return (
    <AppShell
      title={mode === "list" ? "List something" : "Post a need"}
      subtitle="Garage economy · your terms"
      backTo="/share-stuff"
      solidHeader
    >
      <form onSubmit={onSubmit} className="space-y-4 py-3 pb-10">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("list")}
            className={`rounded-[var(--radius-md)] border-2 px-3 py-3 text-sm font-semibold ${
              mode === "list"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-fg-muted)]"
            }`}
          >
            I have it
          </button>
          <button
            type="button"
            onClick={() => setMode("need")}
            className={`rounded-[var(--radius-md)] border-2 px-3 py-3 text-sm font-semibold ${
              mode === "need"
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/8 text-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-fg-muted)]"
            }`}
          >
            I need it
          </button>
        </div>

        <Card>
          <CardContent className="space-y-4 p-5">
            <PhotoField
              id="item-photo"
              label={
                mode === "list"
                  ? "Photo of the item"
                  : "Reference photo (optional)"
              }
              hint={
                mode === "list"
                  ? "Take a clear picture of what you’re renting out — required."
                  : "Optional: photo of what you need or a similar item."
              }
              value={photoUrl}
              onChange={setPhotoUrl}
              facing="environment"
              required={mode === "list"}
            />
            <div>
              <Label htmlFor="title">
                {mode === "list" ? "What are you sharing?" : "What do you need?"}
              </Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  mode === "list"
                    ? "e.g. DeWalt impact drill kit"
                    : "e.g. Need a trailer Saturday AM"
                }
              />
            </div>
            <div>
              <Label htmlFor="desc">Details</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Condition, pickup notes, rules…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cat">Category</Label>
                <Select
                  id="cat"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as RentalCategory)
                  }
                >
                  {RENTAL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rate">
                  {mode === "list" ? "Rate ($)" : "Your offer ($)"}
                </Label>
                <Input
                  id="rate"
                  type="number"
                  min={1}
                  max={500}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="unit">Per</Label>
                <Select
                  id="unit"
                  value={rateUnit}
                  onChange={(e) =>
                    setRateUnit(e.target.value as "hour" | "day" | "weekend")
                  }
                >
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="weekend">Weekend</option>
                </Select>
              </div>
            </div>
            {mode === "list" ? (
              <div>
                <Label htmlFor="deposit">Deposit ($ optional)</Label>
                <Input
                  id="deposit"
                  type="number"
                  min={0}
                  max={1000}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="needed">Needed by</Label>
                <Input
                  id="needed"
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {mode === "list" && (
          <Card className="border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
            <CardContent className="p-4 text-sm text-[var(--color-fg-muted)]">
              <p className="font-semibold text-[var(--color-fg)]">
                Pickup rule (required)
              </p>
              <p className="mt-1">
                When the borrower picks up,{" "}
                <strong className="text-[var(--color-fg)]">
                  you must demonstrate the tool works
                </strong>{" "}
                and check the confirmation box on this listing. That protects
                both of you if something was broken before handoff.
              </p>
            </CardContent>
          </Card>
        )}

        <Button type="submit" size="xl" className="w-full">
          {mode === "list" ? "List for Share" : "Post need"}
        </Button>
      </form>
    </AppShell>
  );
}

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
import {
  QUICK_ITEMS,
  draftFromQuickItem,
  suggestPricesFromTitle,
} from "@/lib/share/listing-suggest";

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
  const [rateUnit, setRateUnit] = useState<"hour" | "day" | "weekend" | "piece">("day");
  const [city, setCity] = useState("Lafayette, LA");
  const [deposit, setDeposit] = useState(20);
  const [photoUrl, setPhotoUrl] = useState("");
  const [forRent, setForRent] = useState(true);
  const [forSale, setForSale] = useState(false);
  const [salePrice, setSalePrice] = useState(50);
  const [qtyAvailable, setQtyAvailable] = useState(8);
  const [neededBy, setNeededBy] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  function applyQuick(id: string) {
    const d = draftFromQuickItem(id);
    if (!d) return;
    if (d.title) setTitle(d.title);
    setDescription(d.description);
    setCategory(d.category);
    setRate(d.rate);
    setRateUnit(d.rateUnit);
    setSalePrice(d.salePrice);
    setDeposit(d.deposit);
    if (d.forRent != null) setForRent(d.forRent);
    if (d.forSale != null) setForSale(d.forSale);
    if (d.qtyAvailable != null) setQtyAvailable(d.qtyAvailable);
    if (d.category === "food") {
      setForRent(false);
      setForSale(true);
      setRateUnit("piece");
    }
    toast.message("Draft filled — edit anything before posting");
  }

  function onTitleBlur() {
    const s = suggestPricesFromTitle(title);
    if (!s) return;
    if (s.rate != null) setRate(s.rate);
    if (s.salePrice != null) setSalePrice(s.salePrice);
    if (s.category) setCategory(s.category);
    if (s.deposit != null) setDeposit(s.deposit);
    if (s.rateUnit) setRateUnit(s.rateUnit);
    if (s.category === "food") {
      setForRent(false);
      setForSale(true);
      setRateUnit(s.rateUnit || "piece");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    if (mode === "list" && !photoUrl) {
      toast.error("Add a photo so neighbors know what it is");
      return;
    }
    if (mode === "list" && !forRent && !forSale) {
      toast.error("Choose rent, sell, or both");
      return;
    }
    if (mode === "list" && forSale && (!salePrice || salePrice < 1)) {
      toast.error("Set a sale price");
      return;
    }

    const ownerName = user?.displayName || riderName || "Share member";
    const ownerEmail = user?.primaryEmail ?? undefined;

    if (mode === "list") {
      const localId = listRental({
        title: title.trim(),
        description:
          description.trim() ||
          (category === "food"
            ? "Homemade — request pieces below. Pay cook in person (pilot)."
            : "Available locally."),
        category,
        rate: forRent ? rate : 0,
        rateUnit: category === "food" ? "piece" : rateUnit,
        city,
        ownerName,
        deposit: category === "food" ? undefined : deposit || undefined,
        photoUrl,
        forRent: category === "food" ? false : forRent,
        forSale: category === "food" ? true : forSale,
        salePrice: forSale || category === "food" ? salePrice : undefined,
        qtyAvailable: category === "food" ? qtyAvailable : undefined,
      });
      try {
        const res = await createRentalFn({
          data: {
            title: title.trim(),
            description:
              description.trim() ||
              (category === "food"
                ? "Homemade — request pieces below. Pay cook in person (pilot)."
                : "Available locally."),
            category,
            rate: forRent ? rate : 0,
            rateUnit: category === "food" ? "piece" : rateUnit,
            city,
            ownerName,
            ownerEmail,
            deposit: category === "food" ? undefined : deposit || undefined,
            photoUrl,
            forRent: category === "food" ? false : forRent,
            forSale: category === "food" ? true : forSale,
            salePrice: forSale || category === "food" ? salePrice : undefined,
            qtyAvailable: category === "food" ? qtyAvailable : undefined,
          },
        });
        if (res?.id) replaceRentalId(localId, res.id);
        toast.success("Listed on Lagniappe");
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
        toast.success("Need posted");
      } catch {
        toast.message("Saved on this phone — cloud sync pending");
      }
    }
    navigate({ to: "/share-stuff" });
  }

  return (
    <AppShell
      title={mode === "list" ? "Post an item" : "Post a need"}
      subtitle="Photo first · quick draft · edit freely"
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
              label={mode === "list" ? "Photo of the item" : "Photo (optional)"}
              hint={
                mode === "list"
                  ? "Snap a clear picture first — then tap what it is for a draft title & price."
                  : "Optional reference photo."
              }
              value={photoUrl}
              onChange={setPhotoUrl}
              facing="environment"
              required={mode === "list"}
            />

            {mode === "list" && photoUrl && (
              <div>
                <p className="mb-2 text-sm font-semibold">
                  What is it? (fills title & prices)
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ITEMS.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => applyQuick(q.id)}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--color-fg)] active:scale-[0.98]"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[var(--color-fg-subtle)]">
                  Same idea as Letgo: photo → smart draft → you tweak. Full
                  auto-title from the image alone needs a vision model later.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="title">
                {mode === "list" ? "Title" : "What do you need?"}
              </Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={onTitleBlur}
                placeholder="e.g. DeWalt impact drill kit"
              />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Condition, what’s included, pickup notes…"
              />
            </div>

            {mode === "list" && (
              <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                <p className="text-sm font-semibold">How can people get it?</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--color-primary)]"
                    checked={forRent}
                    onChange={(e) => setForRent(e.target.checked)}
                  />
                  Available to rent
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--color-accent)]"
                    checked={forSale}
                    onChange={(e) => setForSale(e.target.checked)}
                  />
                  Also for sale (buy it)
                </label>
              </div>
            )}

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
            {category === "food" && mode === "list" && (
              <Card className="border-[var(--color-accent)]/30 bg-[var(--color-accent)]/8">
                <CardContent className="space-y-3 p-4 text-sm">
                  <p className="font-semibold text-[var(--color-fg)]">
                    Homemade food listing
                  </p>
                  <p className="text-[var(--color-fg-muted)]">
                    Neighbors request a piece (or more). You accept in chat and
                    settle pay at pickup — not restaurant delivery.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="piece">Price per piece $</Label>
                      <Input
                        id="piece"
                        type="number"
                        min={1}
                        value={salePrice}
                        onChange={(e) => setSalePrice(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="qty">Pieces available</Label>
                      <Input
                        id="qty"
                        type="number"
                        min={1}
                        value={qtyAvailable}
                        onChange={(e) => setQtyAvailable(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {mode === "list" ? (
              <>
                {forRent && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="rate">Rent rate ($)</Label>
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
                          setRateUnit(
                            e.target.value as "hour" | "day" | "weekend",
                          )
                        }
                      >
                        <option value="hour">Hour</option>
                        <option value="day">Day</option>
                        <option value="weekend">Weekend</option>
                      </Select>
                    </div>
                  </div>
                )}
                {forSale && (
                  <div>
                    <Label htmlFor="sale">Sale price ($)</Label>
                    <Input
                      id="sale"
                      type="number"
                      min={1}
                      max={50000}
                      value={salePrice}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                    />
                  </div>
                )}
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
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="rate">Your offer ($)</Label>
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
                    <Label htmlFor="needed">Needed by</Label>
                    <Input
                      id="needed"
                      type="date"
                      value={neededBy}
                      onChange={(e) => setNeededBy(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Button type="submit" size="xl" className="w-full">
          {mode === "list" ? "Post listing" : "Post need"}
        </Button>
      </form>
    </AppShell>
  );
}

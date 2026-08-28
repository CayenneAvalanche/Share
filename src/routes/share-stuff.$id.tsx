import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useShareStore } from "@/lib/share/store";
import { formatCurrency } from "@/lib/utils";
import {
  createMarketplaceRequestFn,
  listMarketplaceFn,
} from "@/lib/share/server-fns";
import type { RentalListing } from "@/lib/share/data";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/share-stuff/$id")({
  component: ListingDetailPage,
});

function ListingDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const localRentals = useShareStore((s) => s.rentals);
  const requestListing = useShareStore((s) => s.requestListing);
  const startThread = useShareStore((s) => s.startThread);
  const riderName = useShareStore((s) => s.riderName);
  const user = useCurrentUser();
  const [cloud, setCloud] = useState<RentalListing | null>(null);
  const [mode, setMode] = useState<"rent" | "buy" | null>(null);
  const [note, setNote] = useState("");
  const [pickup, setPickup] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [busy, setBusy] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    listMarketplaceFn()
      .then((data) => {
        const hit = (data.rentals as RentalListing[]).find((r) => r.id === id);
        if (hit) setCloud(hit);
      })
      .catch(() => {});
  }, [id]);

  const listing = useMemo(() => {
    return cloud || localRentals.find((r) => r.id === id) || null;
  }, [cloud, localRentals, id]);

  if (!listing) {
    return (
      <AppShell title="Listing" backTo="/share-stuff" solidHeader>
        <p className="py-10 text-center text-sm text-[var(--color-fg-muted)]">
          Listing not found. It may have been removed.
        </p>
        <Button asChild className="w-full">
          <Link to="/share-stuff">Back to Lagniappe</Link>
        </Button>
      </AppShell>
    );
  }

  const item = listing;
  const isFood = item.category === "food" || item.rateUnit === "piece";
  const forRent = !isFood && item.forRent !== false;
  const forSale = Boolean(item.forSale) || isFood;
  const piecePrice = item.salePrice ?? item.rate ?? 0;

  async function submitRequest(kind: "rent" | "buy") {
    const name =
      user?.displayName ||
      (riderName && riderName !== "Guest" ? riderName : "") ||
      "Neighbor";
    const pieces = Math.max(1, qty);
    const lineTotal = piecePrice * pieces;
    const body =
      note.trim() ||
      (isFood
        ? `Hi! I'd like ${pieces} piece${pieces > 1 ? "s" : ""} of ${item.title} (${formatCurrency(piecePrice)} each · ~${formatCurrency(lineTotal)}). Preferred pickup ${pickup}. Pay in person at handoff.`
        : kind === "buy"
          ? `Interested in buying for ${formatCurrency(item.salePrice ?? 0)}.`
          : `I'd like to rent this — preferred pickup ${pickup}.`);

    setBusy(true);
    requestListing({
      rentalId: item.id,
      kind,
      requesterName: name,
      note: body,
      preferredPickup: pickup,
    });

    try {
      await createMarketplaceRequestFn({
        data: {
          rentalId: item.id,
          kind,
          requesterName: name,
          requesterEmail: user?.primaryEmail,
          note: body,
          preferredPickup: pickup,
        },
      });
    } catch {
      /* local ok */
    }

    const tid = startThread({
      subject: `${isFood ? "Food order" : kind === "buy" ? "Buy" : "Rent"}: ${item.title}`,
      withName: item.ownerName,
      relatedType: "rental",
      relatedId: item.id,
      firstMessage: body,
    });

    toast.success(
      isFood
        ? "Piece request sent — chat the cook to confirm"
        : kind === "buy"
          ? "Buy request sent — chat the owner next"
          : "Rent request sent — coordinate pickup in chat",
    );
    setBusy(false);
    navigate({ to: "/messages/$id", params: { id: tid } });
  }

  function messageOwner() {
    const tid = startThread({
      subject: item.title,
      withName: item.ownerName,
      relatedType: "rental",
      relatedId: item.id,
      firstMessage: `Hi ${item.ownerName} — interested in your ${item.title}.`,
    });
    navigate({ to: "/messages/$id", params: { id: tid } });
  }

  return (
    <AppShell title={item.title} backTo="/share-stuff" solidHeader>
      <div className="space-y-4 py-3 pb-10">
        {item.photoUrl && (
          <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)]">
            <img
              src={item.photoUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div>
          <h1 className="font-display text-2xl font-semibold">{item.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {item.city} · Listed by{" "}
            <strong className="text-[var(--color-fg)]">{item.ownerName}</strong>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isFood && (
              <Badge variant="accent">
                {formatCurrency(piecePrice)} / piece
              </Badge>
            )}
            {isFood && item.qtyAvailable != null && (
              <Badge variant="outline">
                ~{item.qtyAvailable} left
              </Badge>
            )}
            {isFood && <Badge variant="secondary">Homemade food</Badge>}
            {forRent && (
              <Badge variant="secondary">
                Rent {formatCurrency(item.rate)}/{item.rateUnit}
              </Badge>
            )}
            {forSale && !isFood && item.salePrice != null && (
              <Badge variant="accent">
                Buy {formatCurrency(item.salePrice)}
              </Badge>
            )}
            {item.deposit ? (
              <Badge variant="outline">
                Deposit {formatCurrency(item.deposit)}
              </Badge>
            ) : null}
          </div>
        </div>

        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
              About this item
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-fg)]">
              {item.description}
            </p>
            <p className="text-xs text-[var(--color-fg-muted)]">
              {isFood
                ? "Food is homemade neighborhood-style — not a restaurant. Confirm allergens with the cook. Pay at pickup (pilot)."
                : "At pickup the owner should show you it works before money or handoff."}
            </p>
          </CardContent>
        </Card>

        {!mode ? (
          <div className="flex flex-col gap-2">
            {isFood && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => setMode("buy")}
              >
                Request a piece
                {piecePrice
                  ? ` · ${formatCurrency(piecePrice)} each`
                  : ""}
              </Button>
            )}
            {forRent && (
              <Button size="lg" className="w-full" onClick={() => setMode("rent")}>
                Request to rent
              </Button>
            )}
            {forSale && !isFood && (
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={() => setMode("buy")}
              >
                Request to buy
                {item.salePrice != null
                  ? ` · ${formatCurrency(item.salePrice)}`
                  : ""}
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={messageOwner}
            >
              <MessageCircle className="size-4" />
              Message {item.ownerName.split(" ")[0]}
            </Button>
          </div>
        ) : (
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="font-semibold">
                {isFood
                  ? "Request a piece"
                  : mode === "buy"
                    ? "Request to buy"
                    : "Request to rent"}
              </p>
              {isFood && (
                <div>
                  <Label htmlFor="qty">How many pieces?</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    max={item.qtyAvailable ?? 20}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                  <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
                    {formatCurrency(piecePrice)} each
                    {qty > 0
                      ? ` · total ~${formatCurrency(piecePrice * Math.max(1, qty))}`
                      : ""}
                    {item.qtyAvailable != null
                      ? ` · cook has ~${item.qtyAvailable}`
                      : ""}
                    . Pay cook in person at pickup.
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="pickup">
                  <Calendar className="mr-1 inline size-3.5" />
                  Preferred pickup date
                </Label>
                <Input
                  id="pickup"
                  type="date"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="note">Message to {isFood ? "cook" : "owner"}</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    isFood
                      ? "Any allergies, spice notes, or pickup window?"
                      : mode === "buy"
                        ? "Any questions about condition or price?"
                        : "How long do you need it? Any questions?"
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full"
                  disabled={busy}
                  onClick={() => void submitRequest(mode)}
                >
                  {busy ? "Sending…" : "Send request & open chat"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

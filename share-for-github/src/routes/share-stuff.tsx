import { useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useChildMatches,
} from "@tanstack/react-router";
import { Plus, Search, Wrench, HandHelping } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useShareStore } from "@/lib/share/store";
import { formatCurrency } from "@/lib/utils";
import { listMarketplaceFn } from "@/lib/share/server-fns";
import type { BorrowRequest, RentalListing } from "@/lib/share/data";

export const Route = createFileRoute("/share-stuff")({
  component: ShareStuffLayout,
});

function ShareStuffLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <ShareStuffPage />;
}

function mergeByFingerprint<T extends { id: string; title: string }>(
  cloud: T[],
  local: T[],
  keyOf: (x: T) => string,
): T[] {
  const byId = new Map<string, T>();
  const fingerprints = new Set<string>();
  for (const r of cloud) {
    byId.set(r.id, r);
    fingerprints.add(keyOf(r));
  }
  for (const r of local) {
    if (byId.has(r.id)) continue;
    const fp = keyOf(r);
    if (fingerprints.has(fp)) continue;
    byId.set(r.id, r);
    fingerprints.add(fp);
  }
  return Array.from(byId.values());
}

function ShareStuffPage() {
  const localRentals = useShareStore((s) => s.rentals);
  const localBorrows = useShareStore((s) => s.borrowRequests);
  const [cloudRentals, setCloudRentals] = useState<RentalListing[]>([]);
  const [cloudBorrows, setCloudBorrows] = useState<BorrowRequest[]>([]);
  const [cloudStatus, setCloudStatus] = useState<"loading" | "ok" | "offline">(
    "loading",
  );
  const [tab, setTab] = useState<"list" | "need">("list");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    listMarketplaceFn()
      .then((data) => {
        if (cancelled) return;
        setCloudRentals(data.rentals as RentalListing[]);
        setCloudBorrows(data.borrows as BorrowRequest[]);
        setCloudStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setCloudStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rentals = useMemo(
    () =>
      mergeByFingerprint(
        cloudRentals,
        localRentals,
        (r) =>
          `${r.title.trim().toLowerCase()}|${r.ownerName.trim().toLowerCase()}|${r.city}`,
      ),
    [cloudRentals, localRentals],
  );

  const borrows = useMemo(
    () =>
      mergeByFingerprint(
        cloudBorrows,
        localBorrows,
        (b) =>
          `${b.title.trim().toLowerCase()}|${b.requesterName.trim().toLowerCase()}|${b.city}`,
      ),
    [cloudBorrows, localBorrows],
  );

  const filteredListings = useMemo(() => {
    return rentals.filter((r) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
      );
    });
  }, [rentals, query]);

  const filteredBorrows = useMemo(() => {
    return borrows.filter((b) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      );
    });
  }, [borrows, query]);

  return (
    <AppShell
      title="Lagniappe"
      subtitle="Rent · buy · homemade · borrow"
      solidHeader
      action={
        <Button size="sm" asChild>
          <Link to="/share-stuff/new">
            <Plus className="size-4" />
            Post
          </Link>
        </Button>
      }
    >
      <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
        Tools, trailers, grills — rent for a day or buy from a neighbor. Tap a
        listing to request it.
        {cloudStatus === "ok" && (
          <span className="block text-xs text-[var(--color-primary)]">
            Live board · posts sync for everyone
          </span>
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab("list")}
          className={`flex items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 px-3 py-3 text-sm font-semibold transition-colors ${
            tab === "list"
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]"
              : "border-[var(--color-border)] text-[var(--color-fg-muted)]"
          }`}
        >
          <Wrench className="size-4" />
          Available
        </button>
        <button
          type="button"
          onClick={() => setTab("need")}
          className={`flex items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 px-3 py-3 text-sm font-semibold transition-colors ${
            tab === "need"
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/8 text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-fg-muted)]"
          }`}
        >
          <HandHelping className="size-4" />
          People need
        </button>
      </div>

      <div className="mt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
          <Input
            className="pl-9"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {tab === "list" && (
        <div className="mt-4 space-y-3 pb-8">
          {filteredListings.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--color-fg-muted)]">
              Nothing listed yet. Tap Post to add something.
            </p>
          )}
          {filteredListings.map((r) => {
            const forRent = r.forRent !== false;
            const forSale = Boolean(r.forSale);
            return (
              <a
                key={r.id}
                href={`/share-stuff/${r.id}`}
                className="block"
              >
                <Card className="overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]">
                  {r.photoUrl ? (
                    <div className="aspect-[16/10] w-full bg-[var(--color-bg-subtle)]">
                      <img
                        src={r.photoUrl}
                        alt={r.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{r.title}</p>
                        <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                          {r.city} · {r.ownerName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {(r.category === "food" || r.rateUnit === "piece") &&
                          (r.salePrice != null || r.rate > 0) && (
                          <p className="font-semibold text-[var(--color-accent)]">
                            {formatCurrency(r.salePrice ?? r.rate)}
                            <span className="text-xs font-normal text-[var(--color-fg-subtle)]">
                              /piece
                            </span>
                          </p>
                        )}
                        {forRent && r.category !== "food" && r.rateUnit !== "piece" && (
                          <p className="font-semibold text-[var(--color-primary)]">
                            {formatCurrency(r.rate)}
                            <span className="text-xs font-normal text-[var(--color-fg-subtle)]">
                              /{r.rateUnit}
                            </span>
                          </p>
                        )}
                        {forSale &&
                          r.category !== "food" &&
                          r.rateUnit !== "piece" &&
                          r.salePrice != null && (
                          <p className="text-sm font-semibold text-[var(--color-accent)]">
                            Buy {formatCurrency(r.salePrice)}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--color-fg-muted)]">
                      {r.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(r.category === "food" || r.rateUnit === "piece") && (
                        <Badge variant="accent">Homemade · request a piece</Badge>
                      )}
                      {forRent && r.category !== "food" && (
                        <Badge variant="secondary">Rent</Badge>
                      )}
                      {forSale && r.category !== "food" && r.rateUnit !== "piece" && (
                        <Badge variant="accent">For sale</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}

      {tab === "need" && (
        <div className="mt-4 space-y-3 pb-8">
          {filteredBorrows.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--color-fg-muted)]">
              No open needs. Use Post to ask for something.
            </p>
          )}
          {filteredBorrows.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              {b.photoUrl ? (
                <div className="aspect-[16/10] w-full bg-[var(--color-bg-subtle)]">
                  <img
                    src={b.photoUrl}
                    alt={b.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{b.title}</p>
                  {b.offer > 0 && (
                    <Badge variant="secondary">
                      up to {formatCurrency(b.offer)}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  {b.description}
                </p>
                <p className="mt-2 text-xs text-[var(--color-fg-subtle)]">
                  {b.requesterName} · {b.city}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Wrench, HandHelping } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import {
  RENTAL_CATEGORIES,
  type RentalCategory,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/share-stuff")({
  component: ShareStuffPage,
});

function ShareStuffPage() {
  const rentals = useShareStore((s) => s.rentals);
  const borrows = useShareStore((s) => s.borrowRequests);
  const [tab, setTab] = useState<"list" | "need">("list");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RentalCategory | "all">("all");

  const filteredListings = useMemo(() => {
    return rentals.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
      );
    });
  }, [rentals, category, query]);

  const filteredBorrows = useMemo(() => {
    return borrows.filter((b) => {
      if (category !== "all" && b.category !== category) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      );
    });
  }, [borrows, category, query]);

  return (
    <AppShell
      title="Something else"
      subtitle="Rent · lend · borrow from neighbors"
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
      <Card className="mt-3 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
        <CardContent className="p-4 text-sm text-[var(--color-fg-muted)]">
          Walk your house: ice chest, grill, drill, trailer, go-kart. List it for
          an hour or a day — or post a need and let someone with a DeWalt answer
          your $50 “I need it now” offer.
        </CardContent>
      </Card>

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

      <div className="mt-3 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === "list"
                ? "Search bike, drill, trailer…"
                : "Search needs…"
            }
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as RentalCategory | "all")
          }
        >
          <option value="all">All categories</option>
          {RENTAL_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 flex flex-col gap-3 pb-6">
        {tab === "list"
          ? filteredListings.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">
                        {r.title}
                      </p>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {r.city} · {r.ownerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold text-[var(--color-primary)]">
                        {formatCurrency(r.rate)}
                      </p>
                      <p className="text-xs text-[var(--color-fg-subtle)]">
                        per {r.rateUnit}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
                    {r.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="capitalize">
                      {r.category}
                    </Badge>
                    {r.deposit ? (
                      <Badge variant="outline">
                        Deposit {formatCurrency(r.deposit)}
                      </Badge>
                    ) : null}
                    <Badge variant={r.available ? "success" : "secondary"}>
                      {r.available ? "Available" : "Out"}
                    </Badge>
                  </div>
                  <Button size="sm" className="mt-3" variant="outline">
                    Request to rent (demo)
                  </Button>
                </CardContent>
              </Card>
            ))
          : filteredBorrows.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">
                        {b.title}
                      </p>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {b.city} · {b.requesterName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold text-[var(--color-accent)]">
                        {formatCurrency(b.offer)}
                      </p>
                      <p className="text-xs text-[var(--color-fg-subtle)]">
                        offer / {b.rateUnit}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
                    {b.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="accent" className="capitalize">
                      {b.category}
                    </Badge>
                    <Badge variant="outline">Open need</Badge>
                  </div>
                  <Button size="sm" className="mt-3" variant="secondary">
                    I can help (demo)
                  </Button>
                </CardContent>
              </Card>
            ))}

        {tab === "list" && filteredListings.length === 0 && (
          <Empty label="No items match" />
        )}
        {tab === "need" && filteredBorrows.length === 0 && (
          <Empty label="No open needs match" />
        )}
      </div>
    </AppShell>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] px-5 py-10 text-center">
      <p className="font-display text-lg font-semibold">{label}</p>
      <Button className="mt-3" asChild>
        <Link to="/share-stuff/new">Post something</Link>
      </Button>
    </div>
  );
}

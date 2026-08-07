import { useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { Plus, Search, Wrench, HandHelping } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useShareStore } from "@/lib/share/store";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/share-stuff")({
  component: ShareStuffLayout,
});

function ShareStuffLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <ShareStuffPage />;
}

function ShareStuffPage() {
  const rentals = useShareStore((s) => s.rentals);
  const borrows = useShareStore((s) => s.borrowRequests);
  const [tab, setTab] = useState<"list" | "need">("list");
  const [query, setQuery] = useState("");

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
      title="Something else"
      subtitle="Rent · lend · borrow"
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
        Tools, bikes, trailers, grills — list or request.
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
          {filteredListings.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                      {r.city} · {r.ownerName}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-[var(--color-primary)]">
                    {formatCurrency(r.rate)}
                    <span className="text-xs font-normal text-[var(--color-fg-subtle)]">
                      /{r.rateUnit}
                    </span>
                  </p>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--color-fg-muted)]">
                  {r.description}
                </p>
              </CardContent>
            </Card>
          ))}
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
            <Card key={b.id}>
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

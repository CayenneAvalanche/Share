import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Car,
  Package,
  Boxes,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  MessageCircle,
  KeyRound,
  HandCoins,
  UserPlus,
} from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { ShareMark } from "@/components/share/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useShareStore } from "@/lib/share/store";
import { TripCard } from "@/components/share/trip-card";
import { isDemoMode } from "@/lib/share/mode";

export const Route = createFileRoute("/app")({
  component: AppHomePage,
});

function AppHomePage() {
  const trips = useShareStore((s) => s.trips);
  const unread = useShareStore((s) =>
    s.threads.reduce((n, t) => n + t.unread, 0),
  );
  const demo = isDemoMode();
  const featured = trips
    .filter((t) => t.from.includes("Lafayette") || t.to.includes("Lafayette"))
    .slice(0, 2);

  return (
    <AppShell>
      <section className="animate-share-rise -mx-4 overflow-hidden bg-[var(--color-bg-inverse)] px-4 pb-8 pt-6 text-[var(--color-fg-inverse)] safe-pt">
        <div className="relative mx-auto max-w-lg">
          <div
            className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full opacity-30"
            style={{
              background:
                "radial-gradient(circle, #3d8f5f 0%, transparent 70%)",
            }}
          />
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-xl)] bg-[#2a6b45] px-5 py-4 shadow-[var(--shadow-md)]">
              <ShareMark inverted className="size-12" />
            </div>
            <p className="font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              Share your life.
              <br />
              Share your adventures.
              <span className="ml-1 align-super text-xs font-sans font-medium opacity-70">
                TM
              </span>
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-inverse)]/55">
              {demo ? "Demo tour · sample data" : "Public beta · real applications"}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="inverse" size="sm" asChild>
                <Link to="/apply">Apply</Link>
              </Button>
              <Button
                size="sm"
                className="border border-[var(--color-fg-inverse)]/30 bg-transparent text-[var(--color-fg-inverse)] hover:bg-[var(--color-fg-inverse)]/10"
                asChild
              >
                <Link to="/messages">
                  Messages
                  {unread > 0 ? ` (${unread})` : ""}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-share-rise animate-share-rise-delay-1 relative z-10 -mt-4">
        <Card className="shadow-[var(--shadow-md)]">
          <CardContent className="p-5">
            <h2 className="font-display text-xl font-semibold">
              What would you like to Share?
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Choice to="/rides" icon={Car} title="Ride" />
              <Choice to="/deliveries" icon={Package} title="Delivery" />
              <Choice to="/cars" icon={KeyRound} title="Car" />
              <Choice to="/share-stuff" icon={Boxes} title="Something else" />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <ChoiceRow
                to="/volunteer"
                icon={HeartHandshake}
                title="Volunteer"
                sub="Veteran · disabled · elder"
              />
              <ChoiceRow
                to="/apply"
                icon={UserPlus}
                title="Apply"
                sub="Driver · rider · business"
              />
              <ChoiceRow
                to="/messages"
                icon={MessageCircle}
                title="Messages"
                sub={unread ? `${unread} unread` : "Trip chat"}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="animate-share-rise animate-share-rise-delay-2 mt-6 grid grid-cols-3 gap-2">
        {[
          { icon: ShieldCheck, label: "Interviewed", sub: "Trust first" },
          { icon: HandCoins, label: "Bid & offer", sub: "Fair match" },
          { icon: KeyRound, label: "Cars too", sub: "Peer host" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 text-center"
          >
            <item.icon className="mx-auto size-5 text-[var(--color-primary)]" />
            <p className="mt-2 text-xs font-semibold leading-tight">
              {item.label}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--color-fg-subtle)]">
              {item.sub}
            </p>
          </div>
        ))}
      </section>

      {featured.length > 0 && (
        <section className="animate-share-rise animate-share-rise-delay-3 mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Leaving Hub City
              </h2>
              <p className="text-sm text-[var(--color-fg-muted)]">
                Open seats nearby
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/rides">See all</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {featured.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {demo && (
        <p className="mt-8 pb-4 text-center text-xs text-[var(--color-fg-subtle)]">
          Demo mode · sample trips ·{" "}
          <Link to="/demo" className="underline">
            checklist
          </Link>
        </p>
      )}
    </AppShell>
  );
}

function Choice({
  to,
  icon: Icon,
  title,
}: {
  to: string;
  icon: typeof Car;
  title: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 border-[var(--color-primary)]/35 bg-[var(--color-primary)]/6 px-3 py-5 text-center transition-all active:scale-[0.98]"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
        <Icon className="size-5" />
      </div>
      <span className="text-sm font-semibold">{title}</span>
    </Link>
  );
}

function ChoiceRow({
  to,
  icon: Icon,
  title,
  sub,
}: {
  to: string;
  icon: typeof Car;
  title: string;
  sub: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-3 transition-all active:scale-[0.99]"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-[var(--color-fg-muted)]">{sub}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-[var(--color-fg-subtle)]" />
    </Link>
  );
}

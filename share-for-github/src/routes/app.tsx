import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Car,
  Package,
  Boxes,
  MapPinned,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Radar,
  MessageCircle,
  Video,
  KeyRound,
  HandCoins,
} from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { ShareMark } from "@/components/share/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useShareStore } from "@/lib/share/store";
import { TripCard } from "@/components/share/trip-card";
import { SHARE_DOMAIN } from "@/lib/share/tracking";

export const Route = createFileRoute("/app")({
  component: AppHomePage,
});

function AppHomePage() {
  const trips = useShareStore((s) => s.trips);
  const unread = useShareStore((s) =>
    s.threads.reduce((n, t) => n + t.unread, 0),
  );
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
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-fg-inverse)]/75">
              Seats · packages · cars · bids · care. Live on {SHARE_DOMAIN} when
              you ship.
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
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Post seats · or request a trip when nothing’s listed.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
                Core
              </p>
              <Choice
                to="/rides"
                icon={Car}
                title="Share a ride"
                sub="Long distance seats · dashcam drivers"
                accent
              />
              <Choice
                to="/rides/requests"
                icon={HandCoins}
                title="Trip requests & bids"
                sub="Amy max $40 · Tom offers $25 · match"
                accent
              />
              <Choice
                to="/deliveries"
                icon={Package}
                title="Share a delivery"
                sub="Corridor match · live tracking"
                accent
              />
              <Choice
                to="/cars"
                icon={KeyRound}
                title="Share a car"
                sub="Whole car by the day · local Turo-style"
                accent
              />

              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
                More
              </p>
              <Choice
                to="/local"
                icon={MapPinned}
                title="Local on-demand"
                sub="Compete with Uber / Lyft on price"
              />
              <Choice
                to="/share-stuff"
                icon={Boxes}
                title="Something else…"
                sub="Tools, bikes, trailers, grills — not cars"
              />
              <Choice
                to="/volunteer"
                icon={HeartHandshake}
                title="Volunteer ride"
                sub="Veteran · disabled · elder · free→paid"
              />
              <Choice
                to="/messages"
                icon={MessageCircle}
                title="Messages"
                sub={
                  unread
                    ? `${unread} unread · logged for safety`
                    : "Trip chat · kept on record"
                }
              />
              <Choice
                to="/track/$code"
                params={{ code: "SHR-4K2M" }}
                icon={Radar}
                title="Track a package"
                sub="Demo code SHR-4K2M"
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

      <section className="animate-share-rise animate-share-rise-delay-3 mt-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Leaving Hub City
            </h2>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Popular long-distance seats
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

      <section className="mt-8 mb-4 rounded-[var(--radius-xl)] bg-[var(--color-primary)] px-5 py-6 text-[var(--color-primary-fg)]">
        <h2 className="font-display text-xl font-semibold">
          Need SHV with nothing posted?
        </h2>
        <p className="mt-1 text-sm text-[var(--color-primary-fg)]/80">
          Request a trip with your max bid. Drivers already heading that way
          offer — you accept and lock the lower price.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="inverse" asChild>
            <Link to="/rides/request/new">
              Request a trip
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-fg)]/10"
            asChild
          >
            <Link to="/rides/requests">See Amy’s demo</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}

function Choice({
  to,
  params,
  icon: Icon,
  title,
  sub,
  accent,
}: {
  to: string;
  params?: Record<string, string>;
  icon: typeof Car;
  title: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <Link to={to} params={params} className="block">
      <div
        className={`group flex items-center gap-4 rounded-[var(--radius-lg)] border-2 bg-[var(--color-bg-elevated)] px-4 py-4 transition-all active:scale-[0.99] ${
          accent
            ? "border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5"
            : "border-[var(--color-border-strong)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
        }`}
      >
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
            accent
              ? "bg-[var(--color-accent)]/12 text-[var(--color-accent)]"
              : "bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
          }`}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`font-semibold ${
              accent ? "text-[var(--color-accent)]" : "text-[var(--color-fg)]"
            }`}
          >
            {title}
          </p>
          <p className="text-sm text-[var(--color-fg-muted)]">{sub}</p>
        </div>
        <ArrowRight
          className={`size-5 transition-transform group-hover:translate-x-0.5 ${
            accent ? "text-[var(--color-accent)]" : "text-[var(--color-fg-subtle)]"
          }`}
        />
      </div>
    </Link>
  );
}

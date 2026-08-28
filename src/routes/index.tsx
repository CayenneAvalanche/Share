import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Car,
  Package,
  Boxes,
  ShieldCheck,
  MapPin,
  Video,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { MarketingShell } from "@/components/share/shell";
import { ShareMark } from "@/components/share/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SHARE_PHONE_DISPLAY, SHARE_PHONE_TEL } from "@/lib/share/contact";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-[var(--color-bg-inverse)] text-[var(--color-fg-inverse)]">
        <div
          className="pointer-events-none absolute -right-20 -top-16 size-72 rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, #3d8f5f 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-14 sm:pb-20 sm:pt-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-fg-inverse)]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--color-fg-inverse)]/90">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Local pilot · open now
          </div>
          <div className="mb-8 inline-flex items-center gap-4 rounded-2xl bg-[#2a6b45] px-5 py-4 shadow-[var(--shadow-md)] sm:px-6 sm:py-5">
            <ShareMark inverted className="size-14 sm:size-16" />
            <div className="text-left">
              <p className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
                Share
              </p>
              <p className="text-sm opacity-85 sm:text-base">
                Share Technologies
              </p>
            </div>
          </div>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Trusted Sharing
          </h1>
          <p className="mt-3 max-w-xl font-display text-xl font-medium leading-snug text-[var(--color-fg-inverse)]/90 sm:text-2xl">
            Share your life. Share your adventures.
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-fg-inverse)]/75 sm:text-lg">
            Rides, deliveries, cars, homemade food, and neighborhood gear — one
            trusted place to share. Rooted in Lafayette, growing with you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="inverse" asChild>
              <Link to="/app">
                Open the app
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              className="border border-[var(--color-fg-inverse)]/30 bg-transparent text-[var(--color-fg-inverse)] hover:bg-[var(--color-fg-inverse)]/10"
              asChild
            >
              <Link to="/apply">Apply to ride or drive</Link>
            </Button>
            <Button
              size="lg"
              className="border border-[var(--color-fg-inverse)]/30 bg-transparent text-[var(--color-fg-inverse)] hover:bg-[var(--color-fg-inverse)]/10"
              asChild
            >
              <Link to="/lafayette-free-rides">Free rides (Lafayette)</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Services</h2>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Landing pages for each product — and by city
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link to="/locations">All cities →</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Car,
              title: "Rideshare",
              body: "Local seats, corridor trips, volunteer free rides.",
              to: "/rideshare" as const,
            },
            {
              icon: Package,
              title: "Delivery",
              body: "Parts and packages along trips already going.",
              to: "/delivery" as const,
            },
            {
              icon: Car,
              title: "Car rental",
              body: "Peer cars by the day — approved drivers only.",
              to: "/car-rental" as const,
            },
            {
              icon: Boxes,
              title: "Lagniappe",
              body: "Tools, food, gear — neighborhood extras.",
              to: "/lagniappe" as const,
            },
          ].map((f) => (
            <Link key={f.title} to={f.to} className="block">
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-md)]">
                <CardContent className="p-5">
                  <f.icon className="size-6 text-[var(--color-primary)]" />
                  <h2 className="mt-3 font-semibold">{f.title}</h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                    {f.body}
                  </p>
                  <p className="mt-3 text-xs font-medium text-[var(--color-primary)]">
                    Learn more →
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { name: "Lafayette, LA", slug: "lafayette" },
            { name: "Shreveport, LA", slug: "shreveport" },
            { name: "Las Vegas, NV", slug: "las-vegas" },
          ].map((c) => (
            <Link
              key={c.slug}
              to="/locations/$city"
              params={{ city: c.slug }}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3 text-sm font-semibold transition-colors hover:border-[var(--color-primary)]/40"
            >
              <MapPin className="mb-1 inline size-4 text-[var(--color-primary)]" />{" "}
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Built for trust, not strangers
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
              Drivers and riders go through an application and interview before
              taking trips. Dashcam honesty, SOS tools, and mutual ratings keep
              the corridor safer as we grow.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-[var(--color-fg)]">
              {[
                "Screened drivers and riders",
                "Corridor focus: Lafayette · Shreveport · Houston · beyond",
                "Volunteer rides for elders, veterans, medical, hardship & work",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                label: "Screened people",
              },
              {
                icon: Video,
                label: "Dashcam optional",
              },
              {
                icon: MapPin,
                label: "Known corridors",
              },
              {
                icon: Car,
                label: "Seats & cargo",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-6 text-center"
              >
                <item.icon className="size-6 text-[var(--color-primary)]" />
                <p className="mt-2 text-xs font-semibold sm:text-sm">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <Card className="overflow-hidden border-0 bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
          <CardContent className="grid gap-6 p-6 sm:grid-cols-[1.2fr_1fr] sm:items-center sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary-fg)]/75">
                Live beta
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
                Ready when you are
              </h2>
              <p className="mt-2 text-sm text-[var(--color-primary-fg)]/85">
                Open the app to request a ride, apply as a driver or rider, or
                post a trip. Need help? Call us.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="lg" variant="inverse" asChild>
                <Link to="/app">
                  Open the app
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="border border-[var(--color-primary-fg)]/35 bg-transparent text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-fg)]/10"
                asChild
              >
                <Link to="/volunteer/new">Request a volunteer ride</Link>
              </Button>
              <a
                href={SHARE_PHONE_TEL}
                className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-semibold text-[var(--color-primary-fg)]/90 underline-offset-2 hover:underline"
              >
                <Phone className="size-4" />
                {SHARE_PHONE_DISPLAY}
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-[var(--color-border)] px-4 py-8 text-center text-xs text-[var(--color-fg-subtle)]">
        <p>Share Technologies · Lafayette, Louisiana</p>
        <p className="mt-1">Share your life. Share your adventures.</p>
        <div className="mt-3 flex flex-wrap justify-center gap-4">
          <Link to="/about" className="hover:text-[var(--color-fg)]">
            About
          </Link>
          <Link to="/privacy" className="hover:text-[var(--color-fg)]">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-[var(--color-fg)]">
            Terms
          </Link>
          <Link to="/apply" className="hover:text-[var(--color-fg)]">
            Apply
          </Link>
          <Link to="/app" className="hover:text-[var(--color-fg)]">
            App
          </Link>
        </div>
      </footer>
    </MarketingShell>
  );
}

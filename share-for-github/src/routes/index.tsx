import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Car,
  Package,
  Boxes,
  ShieldCheck,
  MapPin,
  Video,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { MarketingShell } from "@/components/share/shell";
import { ShareMark } from "@/components/share/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useShareStore } from "@/lib/share/store";
import { joinWaitlistFn } from "@/lib/share/server-fns";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const joinWaitlist = useShareStore((s) => s.joinWaitlist);
  const [email, setEmail] = useState("");

  async function onWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    joinWaitlist(email);
    try {
      await joinWaitlistFn({ data: { email, source: "landing" } });
      toast.success("You're on the early access list");
    } catch {
      toast.success("Saved locally — we'll sync when online");
    }
    setEmail("");
  }

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
            Share your life.
            <br />
            Share your adventures.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-fg-inverse)]/75 sm:text-lg">
            Long-distance rides, local seats, packages on trips already going,
            and neighborhood gear — with real screening. Rooted in Lafayette.
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
              <Link to="/apply">Apply</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Car,
              title: "Share a ride",
              body: "Corridor seats with screened drivers and clear schedules.",
            },
            {
              icon: Package,
              title: "Share a delivery",
              body: "Parts and packages ride along trips already happening.",
            },
            {
              icon: Boxes,
              title: "Lagniappe",
              body: "Tools, trailers, grills — borrow what you need locally.",
            },
            {
              icon: Building2,
              title: "Business handoffs",
              body: "Shop needs something across town? Post it.",
            },
          ].map((f) => (
            <Card key={f.title}>
              <CardContent className="p-5">
                <f.icon className="size-6 text-[var(--color-primary)]" />
                <h2 className="mt-3 font-semibold">{f.title}</h2>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  {f.body}
                </p>
              </CardContent>
            </Card>
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
                "Volunteer rides for veterans, elders, and mobility needs",
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
          <CardContent className="grid gap-6 p-6 sm:grid-cols-[1.2fr_1fr] sm:p-8">
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Get early access
              </h2>
              <p className="mt-2 text-sm text-[var(--color-primary-fg)]/85">
                Leave your email for updates, or apply now if you're ready
                to drive or ride.
              </p>
            </div>
            <form onSubmit={onWaitlist} className="flex flex-col gap-2">
              <Input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-0 bg-white text-[var(--color-fg)]"
              />
              <Button type="submit" variant="inverse">
                Join waitlist
              </Button>
            </form>
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

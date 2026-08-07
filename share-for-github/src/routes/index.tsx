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
import { DemoNoticeModal } from "@/components/share/demo-notice";
import { joinWaitlistFn } from "@/lib/share/server-fns";
import { getAppMode } from "@/lib/share/mode";
import { SHARE_BUILD } from "@/lib/share/contact";

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
      <DemoNoticeModal />
      <section className="relative overflow-hidden bg-[var(--color-bg-inverse)] text-[var(--color-fg-inverse)]">
        <div
          className="pointer-events-none absolute -right-20 -top-16 size-72 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, #3d8f5f 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-12 sm:pb-20 sm:pt-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-inverse)]/70">
            {getAppMode() === "beta" ? "Public beta · real applications" : "Demo tour · sample data"}
          </p>
          <div className="mb-8 inline-flex items-center gap-4 rounded-[var(--radius-xl)] bg-[#2a6b45] px-5 py-4 shadow-[var(--shadow-md)] sm:px-6 sm:py-5">
            <ShareMark inverted className="size-14 sm:size-16" />
            <div className="text-left">
              <p className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
                Share
              </p>
              <p className="text-sm opacity-85 sm:text-base">Share Technologies</p>
            </div>
          </div>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Share your life.
            <br />
            Share your adventures.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-fg-inverse)]/75 sm:text-lg">
            Trusted long-distance rides, local seats cheaper than Uber, packages
            along existing trips, and neighborhood gear — after a real interview.
            Rooted in Lafayette. Built for people who already drive the corridor.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="inverse" asChild>
              <Link to="/apply/driver">
                Drivers: apply now
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="inverse" asChild>
              <Link to="/apply">
                All applications
              </Link>
            </Button>
            <Button
              size="lg"
              className="border border-[var(--color-fg-inverse)]/30 bg-transparent text-[var(--color-fg-inverse)] hover:bg-[var(--color-fg-inverse)]/10"
              asChild
            >
              <Link to="/app">Open the app</Link>
            </Button>
            <Button
              size="lg"
              className="border border-[var(--color-fg-inverse)]/30 bg-transparent text-[var(--color-fg-inverse)] hover:bg-[var(--color-fg-inverse)]/10"
              asChild
            >
              <Link to="/demo">Demo checklist</Link>
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
              body: "Corridor seats with screened drivers and dashcam honesty.",
            },
            {
              icon: Package,
              title: "Share a delivery",
              body: "Parts and packages ride along trips already happening.",
            },
            {
              icon: Boxes,
              title: "Something else",
              body: "Tools, trailers, grills — borrow what you need locally.",
            },
            {
              icon: Building2,
              title: "Business handoffs",
              body: "Shop needs something across town for $10? Post it.",
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
              Why people will choose Share
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-[var(--color-fg-muted)]">
              {[
                "Interviewed riders and drivers — not random accounts",
                "Know your driver bios + other platform history",
                "Trip requests with max bid · drivers offer · fair match",
                "~10% platform take so drivers keep more",
                "Woman / preferred driver options",
                "In-app chat + SOS for a paper trail",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Video className="size-5 text-[var(--color-primary)]" />
                <h3 className="font-semibold">Dashcam-forward safety</h3>
              </div>
              <p className="text-sm text-[var(--color-fg-muted)]">
                Drivers disclose road and cabin recording. Riders acknowledge
                before they book. Trust is a feature, not a FAQ footnote.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild>
                  <Link to="/apply/driver">Driver apply</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/apply/rider">Rider apply</Link>
                </Button>
              </div>
              <Button variant="secondary" className="w-full" asChild>
                <Link to="/apply/delivery">Business / delivery request</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-display text-2xl font-semibold">How Share works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "Apply & interview",
              body: "Tell us who you are. We meet you in person or on Zoom. Screening follows.",
            },
            {
              n: "02",
              title: "Post, request, or bid",
              body: "Empty seats, trip requests with max bids, cargo on the way, gear next door.",
            },
            {
              n: "03",
              title: "Share the road",
              body: "Confirm in-app, go, rate. Empty seats and idle tools stop wasting money.",
            },
          ].map((step) => (
            <div key={step.n}>
              <p className="font-display text-3xl font-semibold text-[var(--color-primary)]/40">
                {step.n}
              </p>
              <h3 className="mt-1 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, label: "Screened people" },
            { icon: MapPin, label: "Corridor-first" },
            { icon: Car, label: "Better driver pay" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 text-center"
            >
              <item.icon className="mx-auto size-5 text-[var(--color-primary)]" />
              <p className="mt-2 text-xs font-semibold sm:text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <Card className="overflow-hidden border-0 bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
          <CardContent className="grid gap-6 p-6 sm:grid-cols-[1.2fr_1fr] sm:p-8">
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Early access for Hub City
              </h2>
              <p className="mt-2 text-sm text-[var(--color-primary-fg)]/85">
                Leave your email for pilot invites, or apply now if you’re ready
                to interview. Demo app is open so you can poke around the product.
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
        <p>Share Technologies · Lafayette, Louisiana · share.myendeavors.me</p>
        <p className="mt-1">
          Share your life. Share your adventures. · Pilot demo — attorney review
          before live marketplace.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-4">
          <Link to="/about" className="hover:text-[var(--color-fg)]">
            Vision
          </Link>
          <Link to="/demo" className="hover:text-[var(--color-fg)]">
            Demo guide
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
      <p className="mt-4 text-[var(--color-fg-subtle)]">
          build {SHARE_BUILD} · {getAppMode()}
        </p>
      </footer>
    </MarketingShell>
  );
}

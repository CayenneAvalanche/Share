import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  MapPin,
  Car,
  Package,
  Boxes,
  Building2,
  Video,
  MapPinned,
} from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { ShareMark } from "@/components/share/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell
      title="About Share"
      subtitle="Share Technologies, LLC"
      backTo="/app"
      solidHeader
    >
      <div className="space-y-5 py-3 pb-10">
        <div className="flex flex-col items-center rounded-[var(--radius-xl)] bg-[var(--color-bg-inverse)] px-5 py-8 text-center text-[var(--color-fg-inverse)]">
          <div className="mb-3 rounded-[var(--radius-lg)] bg-[#2a6b45] p-3">
            <ShareMark inverted className="size-12" />
          </div>
          <p className="font-display text-2xl font-semibold leading-snug">
            Share your life.
            <br />
            Share your adventures.
          </p>
          <p className="mt-3 max-w-sm text-sm text-[var(--color-fg-inverse)]/75">
            Trusted rides, deliveries, local seats, and neighborhood gear — after
            a real interview. Rooted in Lafayette.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold">The idea</h2>
            <p className="text-sm leading-relaxed text-[var(--color-fg-muted)]">
              Flying out of Houston for $36 is great — until Uber, parking, and
              fuel eat the win. Buses feel sketchy. Empty seats on real corridor
              drives are wasted. Share matches people{" "}
              <strong className="text-[var(--color-fg)]">
                already going the same way
              </strong>
              , moves packages along those trips, undercuts on-demand apps for
              local hops, and turns idle gear into rentable tools for the block.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          {[
            {
              icon: Video,
              title: "Interview first",
              body: "Every rider and driver does in-person or Zoom before approval. Trust is the product.",
            },
            {
              icon: Car,
              title: "Corridor rides",
              body: "LFT–SHV, Houston, NOLA, Dallas — seats with screened drivers, not Craigslist chaos.",
            },
            {
              icon: MapPinned,
              title: "Local vs Uber / Lyft",
              body: "Request Walmart → library, see estimates, choose Share, notify nearby approved drivers.",
            },
            {
              icon: Package,
              title: "Deliveries",
              body: "Printers to ULL, care packages, business parts — cargo rides along existing trips.",
            },
            {
              icon: Boxes,
              title: "Lagniappe",
              body: "Ice chest, bike, grill, drill, trailer, go-kart — list what you have or post what you need.",
            },
            {
              icon: Building2,
              title: "Businesses",
              body: "Corridor handoffs for shops and campuses without freight-rate pain.",
            },
            {
              icon: ShieldCheck,
              title: "Screening + ratings",
              body: "Background checks, mutual ratings, premium insurance as the pilot hardens.",
            },
            {
              icon: MapPin,
              title: "Hub City advantage",
              body: "Lafayette sits between Dallas, Shreveport, NOLA, and Houston. Density starts here.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="flex gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                    {item.body}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/apply">Apply to join</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Marketing site</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/app">Open app</Link>
          </Button>
        </div>
      
        <Card>
          <CardContent className="flex flex-wrap gap-2 p-4 text-sm">
            <Button variant="outline" size="sm" asChild>
              <Link to="/demo">Demo checklist</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/privacy">Privacy</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/terms">Terms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

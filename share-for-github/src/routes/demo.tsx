import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckSquare, ExternalLink } from "lucide-react";
import { MarketingShell } from "@/components/share/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useShareStore } from "@/lib/share/store";

export const Route = createFileRoute("/demo")({
  component: DemoGuidePage,
});

type Step = {
  n: string;
  title: string;
  why: string;
  href: string;
  pathLabel: string;
  taps: string[];
  say?: string;
};

const ACTS: { act: string; mins: string; steps: Step[] }[] = [
  {
    act: "Act 1 · Brand & trust (5 min)",
    mins: "5 min",
    steps: [
      {
        n: "1",
        title: "Landing / story",
        why: "What Share is in one breath",
        href: "/",
        pathLabel: "Landing",
        taps: [
          "Scroll hero: “Share your life. Share your adventures.”",
          "Point at Lafayette / corridor positioning",
          "Tap Apply to join → show driver vs rider paths",
        ],
        say: "“Not another national gig app — interviewed people on routes we already drive.”",
      },
      {
        n: "2",
        title: "About + logo",
        why: "Brand credibility",
        href: "/about",
        pathLabel: "About",
        taps: ["Show green S mark", "Mention share.myendeavors.me subdomain plan"],
      },
      {
        n: "3",
        title: "Legal drafts",
        why: "You’re serious about pilot ops",
        href: "/privacy",
        pathLabel: "Privacy",
        taps: [
          "Open Privacy Policy",
          "Open Terms of Service (link at bottom)",
          "Note: pilot drafts — attorney before real money",
        ],
      },
    ],
  },
  {
    act: "Act 2 · Amy & Tom — trip request bids (8 min)",
    mins: "8 min",
    steps: [
      {
        n: "4",
        title: "Open trip requests",
        why: "No seats posted? Still demand",
        href: "/rides/requests",
        pathLabel: "Trip requests",
        taps: [
          "Home → Trip requests & bids",
          "Show Amy M. Lafayette → Shreveport, max bid $40, best offer $25",
        ],
        say: "“Amy needs SHV Saturday. Tom was going anyway.”",
      },
      {
        n: "5",
        title: "Accept Tom’s $25",
        why: "Core match economics",
        href: "/rides/requests/req_amy",
        pathLabel: "Amy’s request",
        taps: [
          "Open Amy’s request",
          "Show max bid $40 vs Tom’s offer $25",
          "Optional: send a second offer as another driver",
          "Tap Accept @ $25 → deal locks at offer, not max",
          "Land on My trips",
        ],
        say: "“Deal price is the driver’s offer when it’s under her ceiling.”",
      },
      {
        n: "6",
        title: "Post your own request",
        why: "Friend can role-play",
        href: "/rides/request/new",
        pathLabel: "New request",
        taps: [
          "Request a trip: LFT → SHV, set max $35",
          "Submit → appear in open list",
        ],
      },
    ],
  },
  {
    act: "Act 3 · Posted rides, bios, dashcam (10 min)",
    mins: "10 min",
    steps: [
      {
        n: "7",
        title: "Browse corridor rides",
        why: "Supply side",
        href: "/rides",
        pathLabel: "Rides",
        taps: [
          "Filter From Lafayette",
          "Quick post: Leaving LFT Saturday (optional)",
          "Open a LFT → SHV trip (Travis / Highlander)",
        ],
      },
      {
        n: "8",
        title: "Know your driver",
        why: "Personal / trust moat",
        href: "/rides",
        pathLabel: "Any trip detail",
        taps: [
          "Scroll public bio, hometown, other job",
          "Other platforms: Uber/Lyft years, trips, ratings",
          "Dashcam badge + photo notes",
          "Prefer heart for favorite driver",
        ],
        say: "“Self-reported gigs + interview — riders know who they’re riding with.”",
      },
      {
        n: "9",
        title: "Book a seat",
        why: "Checkout path",
        href: "/rides",
        pathLabel: "Trip detail",
        taps: [
          "Check dashcam acknowledgment",
          "Confirm seat → Message driver → Checkout demo pay",
        ],
      },
    ],
  },
  {
    act: "Act 4 · Deliveries & corridor match (8 min)",
    mins: "8 min",
    steps: [
      {
        n: "10",
        title: "Alexandria package on LFT→SHV",
        why: "Tom already on the route",
        href: "/deliveries",
        pathLabel: "Deliveries",
        taps: [
          "Open “Box of shop fittings” AEX → SHV",
          "Show Drivers already on this corridor",
          "Est. pickup / est. drop times",
          "Claim on this route",
        ],
        say: "“Empty trunk miles become paid miles.”",
      },
      {
        n: "11",
        title: "Live tracking",
        why: "Ops confidence",
        href: "/track/SHR-4K2M",
        pathLabel: "Track SHR-4K2M",
        taps: [
          "Timeline: matched → pickup → transit → delivered",
          "Advance status if demo allows",
          "Photo note / tracking code",
        ],
      },
      {
        n: "12",
        title: "Post a delivery",
        why: "Business $10 shop handoff",
        href: "/deliveries/request",
        pathLabel: "Request delivery",
        taps: [
          "Default AEX→SHV or shop part",
          "Watch corridor preview before submit",
        ],
      },
    ],
  },
  {
    act: "Act 5 · Local Uber competition (5 min)",
    mins: "5 min",
    steps: [
      {
        n: "13",
        title: "Local ride vs Uber/Lyft",
        why: "Price wedge",
        href: "/local",
        pathLabel: "Local",
        taps: [
          "Walmart → Library (or any spots)",
          "Show Share vs Uber vs Lyft estimates",
          "Woman / preferred driver",
          "Broadcast request",
        ],
        say: "“Same city hop — we take ~10%, they take more.”",
      },
    ],
  },
  {
    act: "Act 6 · Cars, gear, volunteer (8 min)",
    mins: "8 min",
    steps: [
      {
        n: "14",
        title: "Share a car (Turo-style)",
        why: "Whole car ≠ seat ≠ drill",
        href: "/cars",
        pathLabel: "Cars",
        taps: [
          "Browse Highlander / F-150",
          "You → mark ID verified (required)",
          "Reserve 2 days · show host ~90%",
        ],
      },
      {
        n: "15",
        title: "Something else — tools",
        why: "Ice chest / DeWalt / trailer",
        href: "/share-stuff",
        pathLabel: "Something else",
        taps: [
          "Browse listings",
          "List item or post borrow request (need a shovel / drill)",
        ],
      },
      {
        n: "16",
        title: "Volunteer → paid escalate",
        why: "Community care",
        href: "/volunteer",
        pathLabel: "Volunteer",
        taps: [
          "Elder / veteran free ride",
          "Show 0–2h escalate to paid if unclaimed",
          "Admin can force escalate",
        ],
      },
    ],
  },
  {
    act: "Act 7 · Safety & chat (6 min)",
    mins: "6 min",
    steps: [
      {
        n: "17",
        title: "Messages",
        why: "Paper trail",
        href: "/messages",
        pathLabel: "Chat",
        taps: ["Open a thread", "Send a message", "Note system safety line"],
        say: "“Keep it in-app if something bad happens.”",
      },
      {
        n: "18",
        title: "SOS + audio",
        why: "In-trip safety",
        href: "/trips",
        pathLabel: "My trips",
        taps: [
          "Need a booking first (from Amy accept or ride book)",
          "SOS button",
          "Record audio (demo) + LA one-party note",
          "Rate stars · cancel/rebook",
        ],
      },
      {
        n: "19",
        title: "Emergency contact & ID",
        why: "Rider setup",
        href: "/profile",
        pathLabel: "You",
        taps: [
          "Save emergency contact",
          "ID verified toggle",
          "Invite code / referral",
          "Saved places",
        ],
      },
    ],
  },
  {
    act: "Act 8 · Supply side & founder ops (8 min)",
    mins: "8 min",
    steps: [
      {
        n: "20",
        title: "Driver application",
        why: "Bio + Uber/Lyft stats",
        href: "/apply/driver",
        pathLabel: "Driver apply",
        taps: [
          "Fill public bio",
          "Toggle Uber/Lyft/Spark + years/trips/rating",
          "Dashcam + docs note + emergency contact",
          "Submit → pending interview",
        ],
      },
      {
        n: "21",
        title: "Rider + business apply",
        why: "Full funnel",
        href: "/apply",
        pathLabel: "Apply hub",
        taps: ["Skim rider form", "Delivery/business request form"],
      },
      {
        n: "22",
        title: "Founder admin inbox",
        why: "You run the pilot",
        href: "/admin",
        pathLabel: "Admin",
        taps: [
          "PIN: share",
          "Approve / schedule interview on apps",
          "Volunteer + delivery tabs",
        ],
        say: "“I interview everyone — that’s the moat.”",
      },
      {
        n: "23",
        title: "Earnings & checkout",
        why: "10% story",
        href: "/earnings",
        pathLabel: "Earnings",
        taps: [
          "Driver dashboard ~90% keep",
          "Checkout demo Stripe payment",
        ],
      },
    ],
  },
];

function DemoGuidePage() {
  const total = ACTS.reduce((n, a) => n + a.steps.length, 0);
  const resetDemo = useShareStore((s) => s.resetDemo);

  return (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-10 pb-24">
        <Badge className="mb-3">Friend demo · ~60 min full run</Badge>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Master demo checklist
        </h1>
        <p className="mt-2 text-[var(--color-fg-muted)]">
          Sit with your friend and run Share end-to-end. Prefer phone-width
          browser. Full run ~55–70 min; highlights only = Acts 2–4 + 7–8 (~30
          min).
        </p>

        <Card className="mt-6 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-semibold text-[var(--color-fg)]">
              Before you start
            </p>
            <ul className="list-disc space-y-1 pl-5 text-[var(--color-fg-muted)]">
              <li>Open the live preview (or share.myendeavors.me when live)</li>
              <li>Use a fresh private window if local storage is messy</li>
              <li>
                Admin PIN for founder inbox:{" "}
                <code className="text-[var(--color-fg)]">share</code>
              </li>
              <li>
                Demo tracking code:{" "}
                <code className="text-[var(--color-fg)]">SHR-4K2M</code>
              </li>
              <li>{total} stops · check off as you go</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" asChild>
                <Link to="/app">Open app hub</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/rides/requests">Amy → Tom bids</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-[#b42318]/40 text-[#b42318]"
                onClick={() => {
                  if (
                    confirm(
                      "Reset demo? Clears your bookings and changes. Amy/Tom seed data returns.",
                    )
                  ) {
                    resetDemo();
                  }
                }}
              >
                Reset demo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="p-4 text-sm text-[var(--color-fg-muted)]">
            <p className="font-semibold text-[var(--color-fg)]">
              30-minute “wow” path
            </p>
            <p className="mt-1">
              Landing → Amy accept $25 → driver bio on a posted ride → AEX
              corridor claim → track package → SOS on My trips → admin PIN share
              → earnings 10%.
            </p>
          </CardContent>
        </Card>

        <div className="mt-10 space-y-10">
          {ACTS.map((act) => (
            <section key={act.act}>
              <div className="mb-3 flex items-end justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">{act.act}</h2>
                <span className="text-xs text-[var(--color-fg-subtle)]">
                  {act.mins}
                </span>
              </div>
              <ol className="space-y-3">
                {act.steps.map((s) => (
                  <li key={s.n}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-sm font-bold text-[var(--color-primary)]">
                            {s.n}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{s.title}</h3>
                              <Badge variant="outline" className="text-[10px]">
                                {s.why}
                              </Badge>
                            </div>
                            <a
                              href={s.href}
                              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]"
                            >
                              {s.pathLabel}
                              <ExternalLink className="size-3.5" />
                            </a>
                            <ul className="mt-2 space-y-1 text-sm text-[var(--color-fg-muted)]">
                              {s.taps.map((t) => (
                                <li key={t} className="flex gap-2">
                                  <CheckSquare className="mt-0.5 size-3.5 shrink-0 text-[var(--color-fg-subtle)]" />
                                  <span>{t}</span>
                                </li>
                              ))}
                            </ul>
                            {s.say && (
                              <p className="mt-2 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] px-3 py-2 text-xs italic text-[var(--color-fg-muted)]">
                                Script: {s.say}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <Card className="mt-10 border-[var(--color-accent)]/30">
          <CardContent className="space-y-2 p-5 text-sm">
            <h2 className="font-display text-lg font-semibold">
              Closing pitch (2 min)
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-[var(--color-fg-muted)]">
              <li>~10% take vs big apps</li>
              <li>Interviewed humans + bios (not anonymous robots)</li>
              <li>Corridor trips + bids + cargo on the way</li>
              <li>
                Robotaxis don’t erase Shreveport Saturday demand or AEX packages
              </li>
              <li>
                Next: subdomain, Stripe, insurance broker, FB group soft launch
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/terms">Terms</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/privacy">Privacy</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
}

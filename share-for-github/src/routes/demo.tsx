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
        title: "Landing + demo popup",
        why: "First impression",
        href: "/",
        pathLabel: "Landing",
        taps: [
          "If demo popup shows: waitlist email or “Just explore”",
          "Big Share logo (no Lafayette badge)",
          "Drivers: apply now · Open the app",
        ],
        say: "“Live pilot at share.myendeavors.me — demo data, real product shape.”",
      },
      {
        n: "2",
        title: "Legal + logo files",
        why: "Credibility",
        href: "/terms",
        pathLabel: "Terms",
        taps: [
          "Terms §9: arbitration + class waiver (draft)",
          "Privacy linked in footer",
          "Logo SVGs at /brand/share-mark.svg",
        ],
      },
    ],
  },
  {
    act: "Act 2 · Private offer + bids (12 min) ★ main show",
    mins: "12 min",
    steps: [
      {
        n: "3",
        title: "Share a ride hub",
        why: "Requests live under rides",
        href: "/rides",
        pathLabel: "Share a ride",
        taps: [
          "Show Request a trip / Browse requests (not a top-level tab)",
          "Optional: browse posted corridor seats",
        ],
      },
      {
        n: "4",
        title: "Open Amy’s request as DRIVER",
        why: "Offer is hidden",
        href: "/rides/requests/req_amy",
        pathLabel: "Amy LFT→SHV",
        taps: [
          "Toggle View as driver",
          "Confirm private offer is hidden",
          "Place bid $25 → pending approval",
          "Place bid $55 → “too high / lower bid” (no $40 shown)",
        ],
        say: "“If drivers saw $40, everyone would bid $40.”",
      },
      {
        n: "5",
        title: "Same request as RIDER",
        why: "Interest + raise offer",
        href: "/rides/requests/req_amy",
        pathLabel: "Amy as rider",
        taps: [
          "Toggle View as rider",
          "See private offer $40",
          "If high bids: orange interest card",
          "Raise offer to unlock, or Approve @ $25",
          "Land on My trips after approve",
        ],
        say: "“Driver can walk away — rider still sees interest and can raise.”",
      },
      {
        n: "6",
        title: "Post a new request",
        why: "Friend role-play",
        href: "/rides/request/new",
        pathLabel: "New request",
        taps: [
          "LFT → SHV, private offer $20",
          "As driver bid $25 → over budget",
          "As rider raise to $25 → unlock → approve",
        ],
      },
    ],
  },
  {
    act: "Act 3 · Drivers who already Uber/Lyft (8 min)",
    mins: "8 min",
    steps: [
      {
        n: "7",
        title: "Driver application",
        why: "Recruit gig drivers",
        href: "/apply/driver",
        pathLabel: "Driver apply",
        taps: [
          "Public bio",
          "Uber / Lyft / Spark years, trips, rating",
          "Dashcam + docs note",
          "Submit → pending interview",
        ],
        say: "“You already have commercial habits — interview is the moat.”",
      },
      {
        n: "8",
        title: "Founder inbox",
        why: "You approve people",
        href: "/admin",
        pathLabel: "Admin",
        taps: [
          "PIN: share",
          "Schedule / Approve driver app",
          "Reset demo if needed",
        ],
      },
      {
        n: "9",
        title: "Know your driver on a posted ride",
        why: "Personal trust",
        href: "/rides",
        pathLabel: "Rides list",
        taps: [
          "Open a trip → bio + platform history + dashcam",
          "Book seat (dashcam ack) → checkout demo",
        ],
      },
    ],
  },
  {
    act: "Act 4 · Deliveries & corridor (7 min)",
    mins: "7 min",
    steps: [
      {
        n: "10",
        title: "AEX package on LFT→SHV",
        why: "Empty trunk $",
        href: "/deliveries",
        pathLabel: "Deliveries",
        taps: [
          "Shop fittings AEX → SHV",
          "Corridor match + est. times",
          "Claim on route",
        ],
      },
      {
        n: "11",
        title: "Track package",
        why: "Ops story",
        href: "/track/SHR-4K2M",
        pathLabel: "Track",
        taps: ["Timeline · advance status if available"],
      },
    ],
  },
  {
    act: "Act 5 · Local, cars, gear, care (8 min)",
    mins: "8 min",
    steps: [
      {
        n: "12",
        title: "Local vs Uber/Lyft",
        why: "10% story",
        href: "/local",
        pathLabel: "Local",
        taps: ["Price compare · preferred driver · broadcast"],
      },
      {
        n: "13",
        title: "Cars + something else",
        why: "Turo / tools",
        href: "/cars",
        pathLabel: "Cars",
        taps: ["Reserve car · then /share-stuff tools"],
      },
      {
        n: "14",
        title: "Volunteer rides",
        why: "Community",
        href: "/volunteer",
        pathLabel: "Volunteer",
        taps: ["Elder/veteran · escalate 0–2h"],
      },
    ],
  },
  {
    act: "Act 6 · Safety & ops (6 min)",
    mins: "6 min",
    steps: [
      {
        n: "15",
        title: "Messages + SOS",
        why: "Paper trail",
        href: "/messages",
        pathLabel: "Chat",
        taps: [
          "Send message",
          "My trips → SOS + audio note",
          "Emergency contact on You",
        ],
      },
      {
        n: "16",
        title: "Earnings",
        why: "Driver pay",
        href: "/earnings",
        pathLabel: "Earnings",
        taps: ["~90% keep · 10% platform"],
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
        <Badge className="mb-3">Friend demo · Aug 2026 · ~50 min full</Badge>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Master demo checklist
        </h1>
        <p className="mt-2 text-[var(--color-fg-muted)]">
          Use{" "}
          <a
            href="https://share.myendeavors.me"
            className="font-medium text-[var(--color-primary)]"
          >
            share.myendeavors.me
          </a>{" "}
          (or the live preview). Phone-width browser. Full run ~50 min; wow path
          ~25 min = Acts 2–3.
        </p>

        <Card className="mt-6 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-semibold text-[var(--color-fg)]">Before you start</p>
            <ul className="list-disc space-y-1 pl-5 text-[var(--color-fg-muted)]">
              <li>Reset demo once (fresh Amy / bids)</li>
              <li>
                Admin PIN: <code className="text-[var(--color-fg)]">share</code>
              </li>
              <li>
                Track demo: <code className="text-[var(--color-fg)]">SHR-4K2M</code>
              </li>
              <li>{total} stops · check off as you go</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" asChild>
                <Link to="/app">Open app</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/rides/requests">Trip requests</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-[#b42318]/40 text-[#b42318]"
                onClick={() => {
                  if (confirm("Reset demo data and reload?")) resetDemo();
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
              25-minute “wow” path
            </p>
            <p className="mt-1">
              Landing popup → Share a ride → Amy as driver (bid $25 + $55) → as
              rider approve → driver apply (Uber stats) → admin PIN share → AEX
              corridor claim → SOS on My trips.
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
                              {s.taps.map((tap) => (
                                <li key={tap} className="flex gap-2">
                                  <CheckSquare className="mt-0.5 size-3.5 shrink-0 text-[var(--color-fg-subtle)]" />
                                  <span>{tap}</span>
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

        <Card className="mt-10">
          <CardContent className="space-y-2 p-5 text-sm">
            <h2 className="font-display text-lg font-semibold">
              Closing pitch (2 min)
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-[var(--color-fg-muted)]">
              <li>Live: share.myendeavors.me</li>
              <li>Uber/Lyft drivers apply → you interview</li>
              <li>Private offer + bids (not a race to the ceiling)</li>
              <li>~10% take · in-app chat · SOS</li>
              <li>Next: real Stripe, insurance broker, FB soft launch</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
}

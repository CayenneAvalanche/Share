import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MapPin, HeartHandshake, Calendar, ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SHARE_PHONE_DISPLAY,
  SHARE_PHONE_TEL,
  SHARE_DOMAIN,
  SHARE_BUILD,
} from "@/lib/share/contact";

export const Route = createFileRoute("/lafayette-free-rides")({
  component: LafayetteFreeRidesPage,
  head: () => ({
    meta: [
      {
        title:
          "Free rides in Lafayette LA | Share community pilot (Sun & Tue)",
      },
      {
        name: "description",
        content:
          "Free community rides in Lafayette and Acadiana on Sundays and Tuesdays for elders, disabled riders, veterans, medical appointments, and hardship. Book online or call (337) 800-6300.",
      },
      {
        name: "keywords",
        content:
          "free rides Lafayette LA, senior transportation Lafayette, veteran rides Acadiana, medical appointment ride Lafayette, community rideshare Lafayette, Share rides",
      },
    ],
  }),
});

function LafayetteFreeRidesPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
          Local pilot · Lafayette & Acadiana
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--color-fg)] sm:text-4xl">
          Free community rides in Lafayette
        </h1>
        <p className="mt-3 text-lg text-[var(--color-fg-muted)]">
          Share is a local pilot helping neighbors get where they need to go —
          especially when the bus doesn't work and paid rides aren't
          an option.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/volunteer/new">
              Request a free ride
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={SHARE_PHONE_TEL}>
              <Phone className="size-4" />
              {SHARE_PHONE_DISPLAY}
            </a>
          </Button>
        </div>

        <Card className="mt-8 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 size-5 text-[var(--color-primary)]" />
              <div>
                <p className="font-semibold">When</p>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  Free ride days right now:{" "}
                  <strong className="text-[var(--color-fg)]">
                    Sundays and Tuesdays
                  </strong>
                  . Schedule in the app so a driver can accept.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 text-[var(--color-primary)]" />
              <div>
                <p className="font-semibold">Where</p>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  Local trips in the Lafayette / Acadiana area. Enter a full
                  street address for pickup and drop-off.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <HeartHandshake className="mt-0.5 size-5 text-[var(--color-primary)]" />
              <div>
                <p className="font-semibold">Who it's for</p>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  Elders, disabled / mobility needs, veterans, medical
                  appointments, hardship (can't pay right now), and work /
                  job interviews.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mt-10 prose-sm">
          <h2 className="font-display text-xl font-semibold">
            How to get a free ride
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[var(--color-fg-muted)]">
            <li>
              Open{" "}
              <a
                className="font-medium text-[var(--color-primary)] underline"
                href={`https://${SHARE_DOMAIN}`}
              >
                {SHARE_DOMAIN}
              </a>
            </li>
            <li>
              Go to <strong className="text-[var(--color-fg)]">Share a ride</strong>{" "}
              → <strong className="text-[var(--color-fg)]">Volunteer</strong>
            </li>
            <li>Enter pickup, drop-off, when, and a phone number</li>
            <li>A Share driver accepts and contacts you to confirm</li>
          </ol>
          <p className="mt-4 text-sm text-[var(--color-fg-muted)]">
            Prefer the phone? Call{" "}
            <a href={SHARE_PHONE_TEL} className="font-semibold text-[var(--color-fg)]">
              {SHARE_PHONE_DISPLAY}
            </a>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">
            Senior, medical & veteran transportation in Acadiana
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
            Many people in Lafayette rely on the bus, family, or nothing at all
            for doctor visits, dialysis-adjacent trips, grocery runs, and job
            interviews. Share's free-ride pilot is built for those gaps —
            not as a replacement for 911, and not as a full Medicaid NEMT
            broker. When covered medical transport isn't available, neighbors
            can still request a ride.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
            Case managers, senior centers, churches, and clinic social workers
            can send people to this page or the phone number above. Drivers who
            want to help can apply in the app.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">What Share is not</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--color-fg-muted)]">
            <li>Not emergency transport — call 911</li>
            <li>Not guaranteed wheelchair van service unless confirmed when booking</li>
            <li>Not Uber or Lyft — local community pilot</li>
          </ul>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="flex-1" asChild>
            <Link to="/volunteer/new">Request free ride</Link>
          </Button>
          <Button size="lg" variant="secondary" className="flex-1" asChild>
            <Link to="/apply/driver">Apply to drive</Link>
          </Button>
          <Button size="lg" variant="outline" className="flex-1" asChild>
            <Link to="/app">Open the app</Link>
          </Button>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--color-fg-subtle)]">
          Share · local pilot · {SHARE_DOMAIN} · {SHARE_BUILD}
        </p>
      </article>
    </MarketingShell>
  );
}

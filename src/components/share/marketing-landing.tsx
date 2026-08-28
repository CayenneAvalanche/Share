import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Phone,
  MapPin,
  CheckCircle2,
  Car,
  Package,
  Boxes,
  Route,
} from "lucide-react";
import { MarketingShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CITIES,
  SERVICES,
  cityLabel,
  type CityDef,
  type ServiceDef,
} from "@/lib/share/landing-content";
import {
  SHARE_PHONE_DISPLAY,
  SHARE_PHONE_TEL,
  SHARE_DOMAIN,
} from "@/lib/share/contact";

const SERVICE_ICON: Record<string, typeof Car> = {
  rideshare: Route,
  delivery: Package,
  "car-rental": Car,
  lagniappe: Boxes,
};

export function ServiceLanding({ service }: { service: ServiceDef }) {
  const Icon = SERVICE_ICON[service.slug] || Car;
  return (
    <MarketingShell>
      <article>
        <Hero
          kicker="Trusted Sharing · service"
          title={service.name}
          subtitle={service.tagline}
          body={service.description}
          icon={Icon}
          primary={{ label: service.ctaLabel, to: service.ctaTo }}
          secondary={
            service.secondaryCtaLabel && service.secondaryCtaTo
              ? {
                  label: service.secondaryCtaLabel,
                  to: service.secondaryCtaTo,
                }
              : undefined
          }
        />
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="font-display text-2xl font-semibold">
            What you get
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {service.bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 text-sm"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>
        <CityGrid
          heading={`${service.name} by city`}
          sub="Pilot markets — same app, local focus"
          service={service}
        />
        <PhoneCta />
      </article>
    </MarketingShell>
  );
}

export function CityHubLanding({ city }: { city: CityDef }) {
  return (
    <MarketingShell>
      <article>
        <Hero
          kicker={`${city.region} · pilot`}
          title={`Share in ${cityLabel(city)}`}
          subtitle={city.blurb}
          body="Pick a service below or open the app. Drivers and riders apply once and use rides, delivery, cars, and Lagniappe under the same trusted account."
          icon={MapPin}
          primary={{ label: "Open the app", to: "/app" }}
          secondary={{ label: "Apply to drive or ride", to: "/apply" }}
        />
        <section className="mx-auto max-w-5xl px-4 py-10">
          <h2 className="font-display text-2xl font-semibold">
            Why {city.name}
          </h2>
          <ul className="mt-4 space-y-2">
            {city.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                <span className="text-[var(--color-fg-muted)]">{h}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 className="font-display text-2xl font-semibold">
              Services in {city.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Dedicated pages for SEO and sharing with locals
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {SERVICES.map((s) => {
                const Icon = SERVICE_ICON[s.slug] || Car;
                return (
                  <Link
                    key={s.slug}
                    to="/locations/$city/$service"
                    params={{ city: city.slug, service: s.slug }}
                    className="block"
                  >
                    <Card className="h-full transition-shadow hover:shadow-[var(--shadow-md)]">
                      <CardContent className="flex gap-3 p-5">
                        <Icon className="size-6 shrink-0 text-[var(--color-primary)]" />
                        <div>
                          <p className="font-semibold">
                            {s.name} in {city.name}
                          </p>
                          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                            {s.tagline}
                          </p>
                          <p className="mt-2 text-xs font-medium text-[var(--color-primary)]">
                            View page →
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        <PhoneCta />
      </article>
    </MarketingShell>
  );
}

export function CityServiceLanding({
  city,
  service,
}: {
  city: CityDef;
  service: ServiceDef;
}) {
  const Icon = SERVICE_ICON[service.slug] || Car;
  return (
    <MarketingShell>
      <article>
        <Hero
          kicker={`${cityLabel(city)} · ${service.shortName}`}
          title={`${service.name} in ${cityLabel(city)}`}
          subtitle={service.tagline}
          body={`${service.description} Serving ${city.region} from the Share pilot — open the app to book, list, or apply.`}
          icon={Icon}
          primary={{ label: service.ctaLabel, to: service.ctaTo }}
          secondary={
            service.secondaryCtaLabel && service.secondaryCtaTo
              ? {
                  label: service.secondaryCtaLabel,
                  to: service.secondaryCtaTo,
                }
              : {
                  label: `All ${city.name} services`,
                  to: `/locations/${city.slug}` as "/",
                }
          }
        />
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold">
                How it works in {city.name}
              </h2>
              <ul className="mt-5 space-y-3">
                {service.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                    <span className="text-[var(--color-fg-muted)]">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
              <CardContent className="space-y-3 p-5">
                <Badge variant="success">Pilot market</Badge>
                <p className="font-semibold text-[var(--color-fg)]">
                  {cityLabel(city)}
                </p>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {city.blurb}
                </p>
                <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
                  {city.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--color-primary)]" />
                      {h}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/app">
                    Open Share app
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
        <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
              More in {city.name}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {SERVICES.filter((s) => s.slug !== service.slug).map((s) => (
                <Button key={s.slug} size="sm" variant="outline" asChild>
                  <Link
                    to="/locations/$city/$service"
                    params={{ city: city.slug, service: s.slug }}
                  >
                    {s.shortName}
                  </Link>
                </Button>
              ))}
              <Button size="sm" variant="secondary" asChild>
                <Link to="/locations/$city" params={{ city: city.slug }}>
                  {city.name} hub
                </Link>
              </Button>
            </div>
          </div>
        </section>
        <PhoneCta />
      </article>
    </MarketingShell>
  );
}

export function LocationsIndexLanding() {
  return (
    <MarketingShell>
      <article>
        <Hero
          kicker="Where Share is live"
          title="Cities & markets"
          subtitle="Lafayette · Shreveport · Las Vegas"
          body="Start with a city hub, then open the service page you need — rideshare, delivery, car rental, or Lagniappe."
          icon={MapPin}
          primary={{ label: "Open the app", to: "/app" }}
          secondary={{ label: "All services", to: "/#services" }}
        />
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-4 sm:grid-cols-3">
            {CITIES.map((c) => (
              <Link
                key={c.slug}
                to="/locations/$city"
                params={{ city: c.slug }}
                className="block"
              >
                <Card className="h-full transition-shadow hover:shadow-[var(--shadow-md)]">
                  <CardContent className="p-5">
                    <MapPin className="size-5 text-[var(--color-primary)]" />
                    <p className="mt-3 font-display text-xl font-semibold">
                      {cityLabel(c)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                      {c.region}
                    </p>
                    <p className="mt-3 text-xs font-medium text-[var(--color-primary)]">
                      City hub →
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        <CityGrid
          heading="Every service × city"
          sub="Shareable links for Facebook, Nextdoor, and Google"
        />
        <PhoneCta />
      </article>
    </MarketingShell>
  );
}

function Hero({
  kicker,
  title,
  subtitle,
  body,
  icon: Icon,
  primary,
  secondary,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  body: string;
  icon: typeof Car;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg-inverse)] text-[var(--color-fg-inverse)]">
      <div
        className="pointer-events-none absolute -right-16 -top-12 size-64 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #3d8f5f 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-12 sm:pb-16 sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-inverse)]/70">
          {kicker}
        </p>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-fg-inverse)]/10">
            <Icon className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-[var(--color-fg-inverse)]/85">
              {subtitle}
            </p>
          </div>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-fg-inverse)]/70 sm:text-base">
          {body}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" variant="inverse" asChild>
            <Link to={primary.to as "/"}>
              {primary.label}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          {secondary && (
            <Button
              size="lg"
              className="border border-[var(--color-fg-inverse)]/30 bg-transparent text-[var(--color-fg-inverse)] hover:bg-[var(--color-fg-inverse)]/10"
              asChild
            >
              <Link to={secondary.to as "/"}>{secondary.label}</Link>
            </Button>
          )}
          <Button
            size="lg"
            className="border border-[var(--color-fg-inverse)]/30 bg-transparent text-[var(--color-fg-inverse)] hover:bg-[var(--color-fg-inverse)]/10"
            asChild
          >
            <a href={SHARE_PHONE_TEL}>
              <Phone className="size-4" />
              {SHARE_PHONE_DISPLAY}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function CityGrid({
  heading,
  sub,
  service,
}: {
  heading: string;
  sub: string;
  service?: ServiceDef;
}) {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display text-2xl font-semibold">{heading}</h2>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{sub}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.flatMap((city) =>
            (service ? [service] : SERVICES).map((s) => (
              <Link
                key={`${city.slug}-${s.slug}`}
                to="/locations/$city/$service"
                params={{ city: city.slug, service: s.slug }}
                className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm transition-shadow hover:shadow-[var(--shadow-sm)]"
              >
                <p className="font-semibold text-[var(--color-fg)]">
                  {s.shortName} · {city.name}
                </p>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  {cityLabel(city)}
                </p>
              </Link>
            )),
          )}
        </div>
        <p className="mt-4 text-center text-xs text-[var(--color-fg-subtle)]">
          {SHARE_DOMAIN}
        </p>
      </div>
    </section>
  );
}

function PhoneCta() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <Card className="overflow-hidden border-0 bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
        <CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl font-semibold">
              Need help booking?
            </p>
            <p className="mt-1 text-sm opacity-90">
              Call Share — we'll walk you through the app.
            </p>
          </div>
          <Button size="lg" variant="inverse" asChild>
            <a href={SHARE_PHONE_TEL}>
              <Phone className="size-4" />
              {SHARE_PHONE_DISPLAY}
            </a>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

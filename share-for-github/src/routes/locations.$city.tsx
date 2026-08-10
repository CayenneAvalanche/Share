import { createFileRoute, Link } from "@tanstack/react-router";
import { CityHubLanding } from "@/components/share/marketing-landing";
import {
  CITIES,
  cityLabel,
  getCity,
  type CitySlug,
} from "@/lib/share/landing-content";
import { MarketingShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/locations/$city")({
  component: CityPage,
  head: ({ params }) => {
    const city = getCity(params.city);
    if (!city) {
      return { meta: [{ title: "City not found | Share" }] };
    }
    return {
      meta: [
        {
          title: `Share in ${cityLabel(city)} | Trusted Sharing`,
        },
        {
          name: "description",
          content: city.blurb,
        },
        {
          name: "keywords",
          content: `Share ${city.name}, rideshare ${city.name}, delivery ${city.name}, car rental ${city.name}, Lagniappe ${city.name}, ${city.region}`,
        },
      ],
    };
  },
});

function CityPage() {
  const { city: slug } = Route.useParams();
  const city = getCity(slug);
  if (!city) {
    return (
      <MarketingShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold">
            City not found
          </h1>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            Try Lafayette, Shreveport, or Las Vegas.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/locations">All locations</Link>
          </Button>
          <p className="mt-4 text-xs text-[var(--color-fg-subtle)]">
            Markets: {CITIES.map((c) => c.slug).join(", ")}
          </p>
        </div>
      </MarketingShell>
    );
  }
  return <CityHubLanding city={city} />;
}

// keep type for params validation consumers
export type { CitySlug };

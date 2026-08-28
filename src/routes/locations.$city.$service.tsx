import { createFileRoute, Link } from "@tanstack/react-router";
import { CityServiceLanding } from "@/components/share/marketing-landing";
import {
  cityLabel,
  getCity,
  getService,
  serviceCityDescription,
  serviceCityTitle,
  serviceKeywords,
} from "@/lib/share/landing-content";
import { MarketingShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/locations/$city/$service")({
  component: CityServicePage,
  head: ({ params }) => {
    const city = getCity(params.city);
    const service = getService(params.service);
    if (!city || !service) {
      return { meta: [{ title: "Page not found | Share" }] };
    }
    return {
      meta: [
        { title: serviceCityTitle(service, city) },
        {
          name: "description",
          content: serviceCityDescription(service, city),
        },
        {
          name: "keywords",
          content: serviceKeywords(service, city),
        },
      ],
    };
  },
});

function CityServicePage() {
  const { city: citySlug, service: serviceSlug } = Route.useParams();
  const city = getCity(citySlug);
  const service = getService(serviceSlug);
  if (!city || !service) {
    return (
      <MarketingShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold">
            Page not found
          </h1>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            That city or service isn't in the pilot map yet.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/locations">Browse locations</Link>
          </Button>
        </div>
      </MarketingShell>
    );
  }
  return <CityServiceLanding city={city} service={service} />;
}

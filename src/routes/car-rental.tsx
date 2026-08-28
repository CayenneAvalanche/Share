import { createFileRoute } from "@tanstack/react-router";
import { ServiceLanding } from "@/components/share/marketing-landing";
import { getService, serviceKeywords } from "@/lib/share/landing-content";

const service = getService("car-rental")!;

export const Route = createFileRoute("/car-rental")({
  component: () => <ServiceLanding service={service} />,
  head: () => ({
    meta: [
      { title: `${service.name} | Share — Trusted Sharing` },
      { name: "description", content: service.description },
      { name: "keywords", content: serviceKeywords(service) },
    ],
  }),
});

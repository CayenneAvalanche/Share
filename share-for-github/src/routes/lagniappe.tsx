import { createFileRoute } from "@tanstack/react-router";
import { ServiceLanding } from "@/components/share/marketing-landing";
import { getService, serviceKeywords } from "@/lib/share/landing-content";

const service = getService("lagniappe")!;

export const Route = createFileRoute("/lagniappe")({
  component: () => <ServiceLanding service={service} />,
  head: () => ({
    meta: [
      { title: `${service.name} | Share — Trusted Sharing` },
      { name: "description", content: service.description },
      { name: "keywords", content: serviceKeywords(service) },
    ],
  }),
});

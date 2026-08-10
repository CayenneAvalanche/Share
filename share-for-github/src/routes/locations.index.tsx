import { createFileRoute } from "@tanstack/react-router";
import { LocationsIndexLanding } from "@/components/share/marketing-landing";

export const Route = createFileRoute("/locations/")({
  component: LocationsIndexLanding,
  head: () => ({
    meta: [
      {
        title: "Share locations — Lafayette, Shreveport, Las Vegas",
      },
      {
        name: "description",
        content:
          "Share pilot markets: Lafayette LA, Shreveport LA, and Las Vegas NV. Rideshare, delivery, car rental, and Lagniappe.",
      },
      {
        name: "keywords",
        content:
          "Share Lafayette, Share Shreveport, Share Las Vegas, local rideshare, peer car rental, community delivery",
      },
    ],
  }),
});

/** Marketing / SEO landing content for services × cities */

export type ServiceSlug =
  | "rideshare"
  | "delivery"
  | "car-rental"
  | "lagniappe";

export type CitySlug = "lafayette" | "shreveport" | "las-vegas";

export type ServiceDef = {
  slug: ServiceSlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaTo: string;
  secondaryCtaLabel?: string;
  secondaryCtaTo?: string;
  keywords: string[];
};

export type CityDef = {
  slug: CitySlug;
  name: string;
  state: string;
  region: string;
  blurb: string;
  highlights: string[];
};

export const SERVICES: ServiceDef[] = [
  {
    slug: "rideshare",
    name: "Rideshare",
    shortName: "Rides",
    tagline: "Local seats and corridor trips with screened drivers",
    description:
      "Share rides for everyday local trips and longer corridor seats (like LFT–SHV). Set an offer, match with an approved driver, or request volunteer help when you need it most.",
    bullets: [
      "Local rides with a clear offer (or free community rides when open)",
      "Corridor trips between cities with flexible schedules",
      "Volunteer options for elders, veterans, medical, and hardship",
      "Screened drivers, SOS tools, and trip history",
    ],
    ctaLabel: "Open rides",
    ctaTo: "/rides",
    secondaryCtaLabel: "Request volunteer ride",
    secondaryCtaTo: "/volunteer/new",
    keywords: [
      "rideshare",
      "local rides",
      "corridor ride share",
      "community rides",
      "Share rides",
    ],
  },
  {
    slug: "delivery",
    name: "Delivery",
    shortName: "Delivery",
    tagline: "Packages that ride along trips already going",
    description:
      "Move parts, packages, and handoffs with drivers already headed that way — shop to shop, home to home, or along a corridor. Track status and keep chat in-app.",
    bullets: [
      "Post a delivery need or claim open corridor cargo",
      "Built for shops, parts runs, and neighbor handoffs",
      "Live status tracking with a shareable code",
      "Same screened-driver network as Share rides",
    ],
    ctaLabel: "Open deliveries",
    ctaTo: "/deliveries",
    secondaryCtaLabel: "Request a delivery",
    secondaryCtaTo: "/deliveries/request",
    keywords: [
      "package delivery",
      "parts delivery",
      "corridor cargo",
      "local handoff",
      "Share delivery",
    ],
  },
  {
    slug: "car-rental",
    name: "Car rental",
    shortName: "Cars",
    tagline: "Peer cars by the day — host or rent on Share",
    description:
      "List your vehicle or reserve a neighbor’s car for the day. Renters must be approved Share drivers with DMV driving history on file. Pilot handoff and pay in person.",
    bullets: [
      "Hosts list make/model, rate, deposit, and rules",
      "Renters: approved driver + DMV driving history required",
      "Dashcam honesty and clear house rules on each listing",
      "Pilot: meet, hand keys, settle payment in person",
    ],
    ctaLabel: "Browse cars",
    ctaTo: "/cars",
    secondaryCtaLabel: "List your car",
    secondaryCtaTo: "/cars/new",
    keywords: [
      "peer car rental",
      "share a car",
      "Turo alternative",
      "rent neighbor car",
      "Share car rental",
    ],
  },
  {
    slug: "lagniappe",
    name: "Lagniappe",
    shortName: "Lagniappe",
    tagline: "Neighborhood extras — tools, food, gear, and more",
    description:
      "Lagniappe is the “little something extra”: borrow tools, trailers, and grills, or share homemade food and local goods. Built for neighbors, not big-box marketplaces.",
    bullets: [
      "List or request tools, trailers, and outdoor gear",
      "Homemade food and local treats (request a piece)",
      "Local pickup and neighbor trust",
      "Keeps small favors and rentals in one place",
    ],
    ctaLabel: "Open Lagniappe",
    ctaTo: "/share-stuff",
    secondaryCtaLabel: "List something",
    secondaryCtaTo: "/share-stuff/new",
    keywords: [
      "lagniappe",
      "borrow tools",
      "neighborhood marketplace",
      "homemade food share",
      "Share Lagniappe",
    ],
  },
];

export const CITIES: CityDef[] = [
  {
    slug: "lafayette",
    name: "Lafayette",
    state: "LA",
    region: "Acadiana",
    blurb:
      "Share’s home base. Local rides, free community days, corridor seats, deliveries, car share, and Lagniappe across Lafayette and nearby towns.",
    highlights: [
      "Pilot HQ and primary free-ride market",
      "Strong LFT–Houston / LFT–Shreveport corridors",
      "Call (337) 800-6300 for help booking",
    ],
  },
  {
    slug: "shreveport",
    name: "Shreveport",
    state: "LA",
    region: "Northwest Louisiana",
    blurb:
      "Corridor destination and origin for LFT–SHV seats, packages along the I-49 spine, and growing local Share services in the Shreveport–Bossier area.",
    highlights: [
      "LFT ↔ SHV corridor seats and cargo",
      "Love’s / Boyce stops on many trips",
      "Drivers and riders welcome in the pilot",
    ],
  },
  {
    slug: "las-vegas",
    name: "Las Vegas",
    state: "NV",
    region: "Southern Nevada",
    blurb:
      "Share’s expanding pilot market — rideshare seats, delivery handoffs, peer car rental, and Lagniappe for gig drivers and locals who want a trusted local network.",
    highlights: [
      "Open to drivers joining the pilot",
      "Local rides + day car share focus",
      "Same screening and trust standards as Louisiana",
    ],
  },
];

export function getService(slug: string): ServiceDef | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getCity(slug: string): CityDef | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function cityLabel(c: CityDef) {
  return `${c.name}, ${c.state}`;
}

export function serviceCityTitle(service: ServiceDef, city: CityDef) {
  return `${service.name} in ${cityLabel(city)} | Share`;
}

export function serviceCityDescription(service: ServiceDef, city: CityDef) {
  return `${service.tagline} in ${cityLabel(city)}. ${service.description.slice(0, 120)}… Open the Share pilot app or call (337) 800-6300.`;
}

export function serviceKeywords(service: ServiceDef, city?: CityDef) {
  const base = [...service.keywords, "Share", "Share Technologies", "trusted sharing"];
  if (city) {
    base.push(
      `${service.shortName.toLowerCase()} ${city.name}`,
      `${service.name} ${city.name} ${city.state}`,
      cityLabel(city),
      city.region,
    );
  }
  return base.join(", ");
}

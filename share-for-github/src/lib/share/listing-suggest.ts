import type { RentalCategory } from "./data";

/**
 * Letgo-style smart draft without a paid vision API.
 * User snaps a photo → taps a quick label → we fill title, rent rate, sale price, description.
 * True auto-vision (title from pixels) can plug in here later with a model API key.
 */
export type ListingDraft = {
  title: string;
  description: string;
  category: RentalCategory;
  rate: number;
  rateUnit: "hour" | "day" | "weekend";
  salePrice: number;
  deposit: number;
};

export type QuickItem = {
  id: string;
  label: string;
  keywords: string[];
  draft: ListingDraft;
};

export const QUICK_ITEMS: QuickItem[] = [
  {
    id: "drill",
    label: "Power drill",
    keywords: ["drill", "dewalt", "milwaukee", "impact"],
    draft: {
      title: "Cordless power drill kit",
      description: "Works great for home projects. Batteries charged at pickup.",
      category: "tools",
      rate: 15,
      rateUnit: "day",
      salePrice: 75,
      deposit: 40,
    },
  },
  {
    id: "mower",
    label: "Lawn mower",
    keywords: ["mower", "lawn"],
    draft: {
      title: "Push lawn mower",
      description: "Ready to cut. Gas/electric as shown in photo. Local pickup.",
      category: "outdoors",
      rate: 25,
      rateUnit: "day",
      salePrice: 120,
      deposit: 50,
    },
  },
  {
    id: "trailer",
    label: "Utility trailer",
    keywords: ["trailer"],
    draft: {
      title: "Utility trailer",
      description: "Light hauling around town. Lights work. Bring your own hitch pin if needed.",
      category: "wheels",
      rate: 40,
      rateUnit: "day",
      salePrice: 650,
      deposit: 150,
    },
  },
  {
    id: "grill",
    label: "Grill / smoker",
    keywords: ["grill", "smoker", "bbq"],
    draft: {
      title: "Propane grill",
      description: "Clean grates. Propane may be extra — ask before pickup.",
      category: "party",
      rate: 20,
      rateUnit: "day",
      salePrice: 90,
      deposit: 40,
    },
  },
  {
    id: "bike",
    label: "Bicycle",
    keywords: ["bike", "bicycle", "cycle"],
    draft: {
      title: "Adult bicycle",
      description: "Rides smooth. Helmet optional on request.",
      category: "wheels",
      rate: 20,
      rateUnit: "day",
      salePrice: 150,
      deposit: 50,
    },
  },
  {
    id: "pressure",
    label: "Pressure washer",
    keywords: ["pressure", "washer", "powerwash"],
    draft: {
      title: "Pressure washer",
      description: "Great for driveways and siding. Demo at pickup.",
      category: "tools",
      rate: 30,
      rateUnit: "day",
      salePrice: 160,
      deposit: 60,
    },
  },
  {
    id: "cooler",
    label: "Cooler / ice chest",
    keywords: ["cooler", "ice", "igloo", "yeti"],
    draft: {
      title: "Large ice chest",
      description: "Party-ready. Drain plug works. Clean before return.",
      category: "outdoors",
      rate: 10,
      rateUnit: "day",
      salePrice: 40,
      deposit: 20,
    },
  },
  {
    id: "generator",
    label: "Generator",
    keywords: ["generator", "honda", "predator"],
    draft: {
      title: "Portable generator",
      description: "Starts easy. Fuel not included. Quiet hours please.",
      category: "tools",
      rate: 45,
      rateUnit: "day",
      salePrice: 350,
      deposit: 100,
    },
  },
  {
    id: "tables",
    label: "Tables / chairs",
    keywords: ["table", "chair", "folding"],
    draft: {
      title: "Folding tables & chairs set",
      description: "Event set. Count confirmed at pickup.",
      category: "party",
      rate: 25,
      rateUnit: "day",
      salePrice: 80,
      deposit: 30,
    },
  },
  {
    id: "other",
    label: "Something else",
    keywords: [],
    draft: {
      title: "",
      description: "Local pickup. Happy to demo it works before handoff.",
      category: "other",
      rate: 15,
      rateUnit: "day",
      salePrice: 50,
      deposit: 25,
    },
  },
];

export function draftFromQuickItem(id: string): ListingDraft | null {
  return QUICK_ITEMS.find((q) => q.id === id)?.draft ?? null;
}

/** If the user types a title, nudge sale/rent prices from catalog keywords. */
export function suggestPricesFromTitle(title: string): Partial<ListingDraft> | null {
  const t = title.toLowerCase();
  for (const item of QUICK_ITEMS) {
    if (item.keywords.some((k) => t.includes(k))) {
      return {
        rate: item.draft.rate,
        salePrice: item.draft.salePrice,
        category: item.draft.category,
        deposit: item.draft.deposit,
        rateUnit: item.draft.rateUnit,
      };
    }
  }
  return null;
}

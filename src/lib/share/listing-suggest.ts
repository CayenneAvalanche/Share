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
  rateUnit: "hour" | "day" | "weekend" | "piece";
  salePrice: number;
  deposit: number;
  forRent?: boolean;
  forSale?: boolean;
  qtyAvailable?: number;
};

export type QuickItem = {
  id: string;
  label: string;
  keywords: string[];
  draft: ListingDraft;
};

export const QUICK_ITEMS: QuickItem[] = [
  {
    id: "banana-pudding",
    label: "Banana pudding",
    keywords: ["banana", "pudding", "dessert", "homemade"],
    draft: {
      title: "Homemade banana pudding",
      description:
        "Fresh banana pudding, $12 a piece. Local pickup. Tell me how many pieces you want. Pay at handoff (pilot).",
      category: "food",
      rate: 0,
      rateUnit: "piece",
      salePrice: 12,
      deposit: 0,
      forRent: false,
      forSale: true,
      qtyAvailable: 8,
    },
  },
  {
    id: "plate-lunch",
    label: "Plate lunch",
    keywords: ["plate", "lunch", "homemade", "rice", "beans"],
    draft: {
      title: "Homemade plate lunch",
      description:
        "Home-cooked plate. Price per plate. Pick up same day when ready. Pay cook in person.",
      category: "food",
      rate: 0,
      rateUnit: "piece",
      salePrice: 12,
      deposit: 0,
      forRent: false,
      forSale: true,
      qtyAvailable: 10,
    },
  },
  {
    id: "cookies",
    label: "Cookies / sweets",
    keywords: ["cookie", "cake", "brownie", "pie", "sweet"],
    draft: {
      title: "Homemade cookies (dozen)",
      description:
        "Fresh baked. Price is per pack/dozen as listed. Local pickup.",
      category: "food",
      rate: 0,
      rateUnit: "piece",
      salePrice: 10,
      deposit: 0,
      forRent: false,
      forSale: true,
      qtyAvailable: 6,
    },
  },
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
      description: "Ready for driveways and siding. Ask about soap.",
      category: "tools",
      rate: 35,
      rateUnit: "day",
      salePrice: 200,
      deposit: 75,
    },
  },
];

export function draftFromQuickItem(id: string): ListingDraft | null {
  return QUICK_ITEMS.find((q) => q.id === id)?.draft ?? null;
}

export function suggestPricesFromTitle(title: string): Partial<ListingDraft> | null {
  const t = title.toLowerCase();
  for (const q of QUICK_ITEMS) {
    if (q.keywords.some((k) => t.includes(k))) {
      return q.draft;
    }
  }
  return null;
}

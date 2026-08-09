export type TripType = "ride" | "delivery";

export type ScheduleStrictness = "flexible" | "moderate" | "strict";

export type InterviewMode = "in_person" | "zoom" | "either";

export type ApplicationStatus =
  | "pending_interview"
  | "scheduled"
  | "approved"
  | "active"
  | "inactive"
  | "declined";

export type DriverGender = "woman" | "man" | "nonbinary" | "unspecified";

export type DriverPreference = "any" | "woman" | "man" | "preferred";

export type GigPlatform =
  | "uber"
  | "lyft"
  | "spark"
  | "uber_eats"
  | "flex"
  | "door_dash"
  | "other";

export type PlatformGig = {
  platform: GigPlatform;
  years: number;
  tripsApprox: number;
  rating?: number;
  active: boolean;
};

export type Driver = {
  id: string;
  name: string;
  city: string;
  rating: number;
  trips: number;
  verified: boolean;
  vehicle: string;
  avatarHue: number;
  gender: DriverGender;
  hasDashcam: boolean;
  dashcamNote?: string;
  /** Public-facing story for riders */
  publicBio?: string;
  hometown?: string;
  otherJob?: string;
  platforms?: PlatformGig[];
  photoNotes?: string[];
  emergencyContactShared?: boolean;
};

export type Trip = {
  id: string;
  type: TripType;
  from: string;
  to: string;
  fromShort: string;
  toShort: string;
  departAt: string;
  arriveAt: string;
  seatsAvailable: number;
  seatsTotal: number;
  cargoCapacity: string;
  pricePerSeat: number;
  deliveryRate: number;
  stops: string[];
  schedule: ScheduleStrictness;
  notes: string;
  driverId: string;
  distanceMiles: number;
  durationHours: number;
  /** Optional photo of the car for this trip */
  vehiclePhoto?: string;
  /** Sedan, SUV, etc. */
  vehicleType?: string;
  /** Free-text year/make/model */
  vehicleLabel?: string;
  /** Set when a member posts the trip (enables edit/delete) */
  postedByEmail?: string;
  postedByName?: string;
  /** Driver face photo on this post */
  driverSelfie?: string;
};

export type Booking = {
  id: string;
  tripId: string;
  kind: "ride" | "delivery";
  seats: number;
  cargoNote: string;
  status: "confirmed" | "pending" | "completed";
  createdAt: string;
  total: number;
  driverPreference?: DriverPreference;
  preferredDriverId?: string;
};

export type DeliveryTrackStatus =
  | "open"
  | "matched"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type TrackEvent = {
  id: string;
  status: DeliveryTrackStatus;
  label: string;
  at: string;
  note?: string;
};

export type DeliveryRequest = {
  id: string;
  from: string;
  to: string;
  item: string;
  size: "small" | "medium" | "large";
  offer: number;
  neededBy: string;
  notes: string;
  status: DeliveryTrackStatus;
  contactName?: string;
  contactEmail?: string;
  isBusiness?: boolean;
  adminNote?: string;
  driverName?: string;
  trackingCode?: string;
  events?: TrackEvent[];
  lastLat?: number;
  lastLng?: number;
};

export type DriverApplication = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  vehicle: string;
  licensePlate: string;
  yearsDriving: string;
  corridors: string;
  interviewMode: InterviewMode;
  preferredTime: string;
  notes: string;
  gender: DriverGender;
  status: ApplicationStatus;
  createdAt: string;
  interviewAt?: string;
  adminNote?: string;
  publicBio?: string;
  hometown?: string;
  otherJob?: string;
  platformsText?: string;
  hasDashcam?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  docsNote?: string;
  /** Compressed data URLs for founder review (pilot) */
  licenseFront?: string;
  licenseBack?: string;
  insuranceCard?: string;
  /** Recent face photo for trust matching at pickup */
  selfie?: string;
  /** Exterior car photo from driver app */
  vehiclePhoto?: string;
  vehicleType?: string;
};

export type SavedVehicle = {
  id: string;
  /** Year / make / model */
  label: string;
  vehicleType: string;
  licensePlate?: string;
  photoUrl?: string;
  isDefault?: boolean;
  createdAt: string;
};

export type RiderApplication = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  typicalRoutes: string;
  interviewMode: InterviewMode;
  preferredTime: string;
  notes: string;
  status: ApplicationStatus;
  createdAt: string;
  interviewAt?: string;
  adminNote?: string;
  /** Recent face photo for trust matching at pickup */
  selfie?: string;
};

export type RentalCategory =
  | "tools"
  | "outdoors"
  | "wheels"
  | "party"
  | "home"
  | "food"
  | "other";

export type RentalListing = {
  id: string;
  title: string;
  description: string;
  category: RentalCategory;
  rate: number;
  rateUnit: "hour" | "day" | "weekend" | "piece";
  city: string;
  ownerName: string;
  available: boolean;
  deposit?: number;
  /** Photo of the item */
  photoUrl?: string;
  /** Available to rent (default true) */
  forRent?: boolean;
  /** Also listed for sale (Letgo-style) */
  forSale?: boolean;
  /** Asking price if forSale (or price per piece for food) */
  salePrice?: number;
  /** Homemade food / how many pieces left (optional) */
  qtyAvailable?: number;
};

export type MarketplaceRequestKind = "rent" | "buy";

export type MarketplaceRequest = {
  id: string;
  rentalId: string;
  kind: MarketplaceRequestKind;
  requesterName: string;
  note: string;
  preferredPickup?: string;
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt: string;
};

export type BorrowRequest = {
  id: string;
  title: string;
  description: string;
  category: RentalCategory;
  offer: number;
  rateUnit: "hour" | "day" | "weekend" | "piece";
  city: string;
  neededBy: string;
  requesterName: string;
  status: "open" | "matched";
  createdAt: string;
  photoUrl?: string;
};


export type RideOfferStatus =
  | "pending_approval"
  | "open"
  | "accepted"
  | "withdrawn"
  | "declined"
  | "over_budget";

export type RideOffer = {
  id: string;
  requestId: string;
  driverName: string;
  driverId?: string;
  /** Driver bid — what they want for the seat */
  amount: number;
  note: string;
  status: RideOfferStatus;
  createdAt: string;
};

export type CorridorRideRequest = {
  id: string;
  from: string;
  to: string;
  /** Preferred travel day (ISO date or datetime) */
  neededBy: string;
  seats: number;
  /**
   * Rider private max offer (ceiling they'll pay).
   * Never show this number to drivers in marketplace UI.
   */
  maxBid: number;
  notes: string;
  requesterName: string;
  status: "open" | "matched" | "cancelled";
  createdAt: string;
  /** Winning offer details when matched */
  matchedOfferId?: string;
  matchedAmount?: number;
  matchedDriverName?: string;
  offers: RideOffer[];
  flexibleWindow?: string;
  /** hub = gas station / exit; door = needs pickup/drop help */
  meetStyle?: "hub" | "door";
  /** optional final address beyond corridor drop */
  extensionDestination?: string;
  extensionOffer?: number;
  firstMileNeeded?: boolean;
};

export type MeetStyle = "hub" | "door";


function nextSaturdayIso() {
  const d = new Date();
  const day = d.getDay();
  const add = day === 6 ? 7 : (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export const SEED_RIDE_REQUESTS: CorridorRideRequest[] = [
  {
    id: "req_amy",
    from: "Lafayette, LA",
    to: "Shreveport, LA",
    neededBy: nextSaturdayIso(),
    seats: 1,
    maxBid: 40,
    notes: "Need a seat Saturday morning. Flexible on exact time. Soft bag only.",
    requesterName: "Amy M.",
    status: "open",
    createdAt: new Date().toISOString(),
    flexibleWindow: "Saturday morning–afternoon",
    offers: [
      {
        id: "off_tom",
        requestId: "req_amy",
        driverName: "Tom K.",
        driverId: "d1",
        amount: 25,
        note: "Already heading SHV this weekend — Saturday ~9am works.",
        status: "pending_approval",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "req_jake",
    from: "Houston, TX",
    to: "Lafayette, LA",
    neededBy: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 4);
      d.setHours(14, 0, 0, 0);
      return d.toISOString();
    })(),
    seats: 2,
    maxBid: 55,
    notes: "Two seats, airport bags. Willing to meet at I-10 stop.",
    requesterName: "Jake P.",
    status: "open",
    createdAt: new Date().toISOString(),
    flexibleWindow: "Anytime after noon",
    offers: [],
  },
];

export type LocalRideRequest = {
  id: string;
  pickup: string;
  dropoff: string;
  when: string;
  seats: number;
  notes: string;
  sharePrice: number;
  uberEstimate: number;
  lyftEstimate: number;
  status: "broadcasting" | "matched" | "cancelled";
  createdAt: string;
  requesterName: string;
  driverPreference: DriverPreference;
  preferredDriverId?: string;
  adminNote?: string;
};

export const HUB_CITIES = [
  "Lafayette, LA",
  "Las Vegas, NV",
  "Houston, TX",
  "New Orleans, LA",
  "Shreveport, LA",
  "Dallas, TX",
  "Baton Rouge, LA",
  "Lake Charles, LA",
  "Austin, TX",
] as const;

export const LOCAL_SPOTS = [
  "Walmart Ambassador Caffery, Lafayette",
  "Downtown Library, Lafayette",
  "ULL Student Union",
  "Lafayette Regional Airport (LFT)",
  "River Ranch, Lafayette",
  "Oil Center, Lafayette",
  "Acadiana Mall",
  "Our Lady of Lourdes Hospital",
  "Costco, Lafayette",
  "Target, Ambassador Caffery",
  // Las Vegas pilot
  "Harry Reid International Airport (LAS)",
  "The Strip / Las Vegas Blvd",
  "Downtown Las Vegas (Fremont)",
  "UNLV campus",
  "Summerlin, Las Vegas",
  "Henderson, NV",
] as const;

export const RENTAL_CATEGORIES: { id: RentalCategory; label: string }[] = [
  { id: "tools", label: "Tools" },
  { id: "outdoors", label: "Outdoors" },
  { id: "wheels", label: "Wheels" },
  { id: "party", label: "Party & grill" },
  { id: "home", label: "Home" },
  { id: "food", label: "Homemade food" },
  { id: "other", label: "Other" },
];

export const DRIVERS: Driver[] = [
  {
    id: "d1",
    name: "Travis D.",
    city: "Lafayette, LA",
    rating: 4.98,
    trips: 142,
    verified: true,
    vehicle: "2019 Toyota Highlander",
    avatarHue: 150,
    gender: "man",
    hasDashcam: true,
    dashcamNote: "Front + cabin audio",
    publicBio: "Lafayette born. I drive LFT–SHV a lot for family and work. Music low, AC high, dashcam always on so everyone feels safer.",
    hometown: "Lafayette, LA",
    otherJob: "Runs local errands / shop handoffs",
    platforms: [
      { platform: "uber", years: 4, tripsApprox: 2100, rating: 4.97, active: true },
      { platform: "lyft", years: 3, tripsApprox: 800, rating: 4.95, active: true },
      { platform: "spark", years: 1, tripsApprox: 320, rating: 4.9, active: true },
    ],
    photoNotes: ["Gray Highlander · Oil Center meetups", "Cabin clean, phone mount ready"],
  },
  {
    id: "d2",
    name: "Maya R.",
    city: "Houston, TX",
    rating: 4.94,
    trips: 89,
    verified: true,
    vehicle: "2021 Honda CR-V",
    avatarHue: 200,
    gender: "woman",
    hasDashcam: true,
    dashcamNote: "Road + cabin",
    publicBio: "Houston-based, calm evening drives. Prefer women and families when possible. Happy to chat or give quiet rides.",
    hometown: "Houston, TX",
    otherJob: "Part-time design work",
    platforms: [
      { platform: "lyft", years: 5, tripsApprox: 3400, rating: 4.98, active: true },
      { platform: "uber", years: 2, tripsApprox: 900, rating: 4.94, active: false },
    ],
    photoNotes: ["CR-V · soft bags welcome"],
  },
  {
    id: "d3",
    name: "Jordan K.",
    city: "New Orleans, LA",
    rating: 4.91,
    trips: 67,
    verified: true,
    vehicle: "2020 Subaru Outback",
    avatarHue: 30,
    gender: "nonbinary",
    hasDashcam: false,
    publicBio: "NOLA roots, Acadiana routes. Queer-friendly car, always transparent about other gigs.",
    hometown: "New Orleans, LA",
    platforms: [
      { platform: "uber", years: 3, tripsApprox: 1500, rating: 4.91, active: true },
      { platform: "uber_eats", years: 2, tripsApprox: 600, rating: 4.88, active: true },
    ],
  },
  {
    id: "d4",
    name: "Alicia P.",
    city: "Shreveport, LA",
    rating: 4.97,
    trips: 118,
    verified: true,
    vehicle: "2018 Ford Explorer",
    avatarHue: 280,
    gender: "woman",
    hasDashcam: true,
    dashcamNote: "Always-on road cam",
    publicBio: "Mom of two, school runs and corridor trips. Soft-spoken, on time.",
    hometown: "Lafayette, LA",
    otherJob: "School admin (part-time)",
    platforms: [
      { platform: "lyft", years: 2, tripsApprox: 700, rating: 4.99, active: true },
    ],
  },
  {
    id: "d5",
    name: "Chris B.",
    city: "Dallas, TX",
    rating: 4.88,
    trips: 54,
    verified: true,
    vehicle: "2022 Tesla Model Y",
    avatarHue: 190,
    gender: "man",
    hasDashcam: true,
    dashcamNote: "Tesla cabin cam",
    publicBio: "Dallas tech + long hauls. Tesla cabin cam disclosed. Supercharger stops planned.",
    hometown: "Dallas, TX",
    otherJob: "Software contractor",
    platforms: [
      { platform: "uber", years: 6, tripsApprox: 5000, rating: 4.93, active: true },
      { platform: "flex", years: 1, tripsApprox: 200, rating: 4.9, active: true },
    ],
  },
];

function daysFromNow(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const TRIPS: Trip[] = [
  {
    id: "t1",
    type: "ride",
    from: "Lafayette, LA",
    to: "Houston, TX",
    fromShort: "LFT",
    toShort: "HOU",
    departAt: daysFromNow(1, 7, 30),
    arriveAt: daysFromNow(1, 11, 15),
    seatsAvailable: 3,
    seatsTotal: 3,
    cargoCapacity: "2 medium bags + trunk space",
    pricePerSeat: 28,
    deliveryRate: 18,
    stops: ["Beaumont, TX"],
    schedule: "moderate",
    notes: "Quiet ride preferred. Cooler with water in back.",
    driverId: "d1",
    distanceMiles: 217,
    durationHours: 3.75,
  },
  {
    id: "t2",
    type: "ride",
    from: "Lafayette, LA",
    to: "New Orleans, LA",
    fromShort: "LFT",
    toShort: "MSY",
    departAt: daysFromNow(1, 14, 0),
    arriveAt: daysFromNow(1, 16, 30),
    seatsAvailable: 2,
    seatsTotal: 3,
    cargoCapacity: "1 large suitcase",
    pricePerSeat: 22,
    deliveryRate: 12,
    stops: [],
    schedule: "flexible",
    notes: "Happy to swing by ULL campus for pickup.",
    driverId: "d3",
    distanceMiles: 135,
    durationHours: 2.5,
  },
  {
    id: "t3",
    type: "ride",
    from: "Lafayette, LA",
    to: "Shreveport, LA",
    fromShort: "LFT",
    toShort: "SHV",
    departAt: daysFromNow(2, 9, 0),
    arriveAt: daysFromNow(2, 12, 45),
    seatsAvailable: 4,
    seatsTotal: 4,
    cargoCapacity: "Full cargo area available",
    pricePerSeat: 35,
    deliveryRate: 25,
    stops: ["Alexandria, LA"],
    schedule: "strict",
    notes: "Heading home for the weekend. On-time departure.",
    driverId: "d1",
    distanceMiles: 215,
    durationHours: 3.75,
  },
  {
    id: "t4",
    type: "ride",
    from: "Houston, TX",
    to: "Dallas, TX",
    fromShort: "HOU",
    toShort: "DFW",
    departAt: daysFromNow(2, 8, 15),
    arriveAt: daysFromNow(2, 12, 0),
    seatsAvailable: 2,
    seatsTotal: 2,
    cargoCapacity: "2 carry-ons",
    pricePerSeat: 40,
    deliveryRate: 22,
    stops: [],
    schedule: "moderate",
    notes: "Airport-friendly drop near Hobby if needed.",
    driverId: "d2",
    distanceMiles: 239,
    durationHours: 3.75,
  },
  {
    id: "t5",
    type: "ride",
    from: "Shreveport, LA",
    to: "Lafayette, LA",
    fromShort: "SHV",
    toShort: "LFT",
    departAt: daysFromNow(3, 10, 0),
    arriveAt: daysFromNow(3, 13, 45),
    seatsAvailable: 3,
    seatsTotal: 3,
    cargoCapacity: "Printer-sized box OK",
    pricePerSeat: 32,
    deliveryRate: 20,
    stops: ["Natchitoches, LA"],
    schedule: "flexible",
    notes: "Can pick up packages in SHV before leaving.",
    driverId: "d4",
    distanceMiles: 215,
    durationHours: 3.75,
  },
  {
    id: "t6",
    type: "ride",
    from: "New Orleans, LA",
    to: "Houston, TX",
    fromShort: "MSY",
    toShort: "HOU",
    departAt: daysFromNow(3, 16, 0),
    arriveAt: daysFromNow(3, 21, 30),
    seatsAvailable: 1,
    seatsTotal: 3,
    cargoCapacity: "Limited — 1 small box",
    pricePerSeat: 45,
    deliveryRate: 28,
    stops: ["Baton Rouge, LA", "Lake Charles, LA"],
    schedule: "moderate",
    notes: "Evening drive, good playlist.",
    driverId: "d3",
    distanceMiles: 348,
    durationHours: 5.5,
  },
  {
    id: "t7",
    type: "ride",
    from: "Dallas, TX",
    to: "Lafayette, LA",
    fromShort: "DFW",
    toShort: "LFT",
    departAt: daysFromNow(4, 7, 0),
    arriveAt: daysFromNow(4, 14, 0),
    seatsAvailable: 2,
    seatsTotal: 2,
    cargoCapacity: "Roof box available",
    pricePerSeat: 55,
    deliveryRate: 35,
    stops: ["Tyler, TX", "Shreveport, LA"],
    schedule: "flexible",
    notes: "Long haul — stops for coffee and stretch.",
    driverId: "d5",
    distanceMiles: 420,
    durationHours: 7,
  },
  {
    id: "t8",
    type: "ride",
    from: "Baton Rouge, LA",
    to: "Houston, TX",
    fromShort: "BTR",
    toShort: "HOU",
    departAt: daysFromNow(5, 11, 30),
    arriveAt: daysFromNow(5, 15, 0),
    seatsAvailable: 3,
    seatsTotal: 3,
    cargoCapacity: "2 medium packages",
    pricePerSeat: 30,
    deliveryRate: 18,
    stops: ["Lafayette, LA"],
    schedule: "moderate",
    notes: "Can meet near LSU or downtown BR.",
    driverId: "d2",
    distanceMiles: 268,
    durationHours: 3.5,
  },
  {
    id: "t9",
    type: "ride",
    from: "Lafayette, LA",
    to: "Houston, TX",
    fromShort: "LFT",
    toShort: "HOU",
    departAt: daysFromNow(1, 16, 0),
    arriveAt: daysFromNow(1, 19, 45),
    seatsAvailable: 2,
    seatsTotal: 2,
    cargoCapacity: "1 medium bag",
    pricePerSeat: 30,
    deliveryRate: 16,
    stops: [],
    schedule: "moderate",
    notes: "Women riders welcome — calm evening drive.",
    driverId: "d2",
    distanceMiles: 217,
    durationHours: 3.75,
  },
];

export const OPEN_DELIVERIES: DeliveryRequest[] = [
  {
    id: "del_alex_demo",
    from: "Alexandria, LA",
    to: "Shreveport, LA",
    item: "Box of shop fittings (~15 lb)",
    size: "medium",
    offer: 18,
    neededBy: daysFromNow(2, 18, 0),
    notes: "Pickup near MacArthur Dr. Needs Saturday if possible.",
    status: "open",
    trackingCode: "SHR-ALEX",
    events: [
      {
        id: "ev_alex0",
        status: "open",
        label: "Posted",
        at: new Date().toISOString(),
        note: "Waiting for corridor drivers LFT→SHV",
      },
    ],
  },

  {
    id: "del1",
    from: "Shreveport, LA",
    to: "Lafayette, LA",
    item: "Desktop printer (boxed)",
    size: "medium",
    offer: 25,
    neededBy: daysFromNow(3, 18, 0),
    notes: "Mom bought it on sale — son is at ULL.",
    status: "open",
  },
  {
    id: "del2",
    from: "Lafayette, LA",
    to: "New Orleans, LA",
    item: "Care package + textbooks",
    size: "medium",
    offer: 18,
    neededBy: daysFromNow(2, 20, 0),
    notes: "Fragile — keep upright if possible.",
    status: "open",
  },
  {
    id: "del3",
    from: "Houston, TX",
    to: "Lafayette, LA",
    item: "Small electronics kit",
    size: "small",
    offer: 20,
    neededBy: daysFromNow(1, 22, 0),
    notes: "Fits in a backpack.",
    status: "open",
  },
  {
    id: "del4",
    from: "Lafayette, LA",
    to: "Baton Rouge, LA",
    item: "Shop part — HVAC valve",
    size: "small",
    offer: 10,
    neededBy: daysFromNow(1, 17, 0),
    notes: "Local shop needs same-day handoff. $10 is fine.",
    status: "open",
    isBusiness: true,
    contactName: "Acadiana HVAC",
    contactEmail: "parts@example.com",
  },
  {
    id: "del_track1",
    from: "Lafayette, LA",
    to: "Baton Rouge, LA",
    item: "HVAC valve (shop part)",
    size: "small",
    offer: 10,
    neededBy: daysFromNow(0, 20, 0),
    notes: "Pickup at shop counter — hand to driver.",
    status: "in_transit",
    isBusiness: true,
    contactName: "Acadiana HVAC",
    contactEmail: "parts@example.com",
    driverName: "Travis D.",
    trackingCode: "SHR-4K2M",
    events: [
      {
        id: "ev1",
        status: "open",
        label: "Posted",
        at: daysFromNow(0, 8, 0),
        note: "Shop uploaded part request",
      },
      {
        id: "ev2",
        status: "matched",
        label: "Driver matched",
        at: daysFromNow(0, 9, 15),
        note: "Travis D. accepted · $10",
      },
      {
        id: "ev3",
        status: "picked_up",
        label: "Picked up",
        at: daysFromNow(0, 10, 5),
        note: "Signed for at counter",
      },
      {
        id: "ev4",
        status: "in_transit",
        label: "In transit",
        at: daysFromNow(0, 10, 20),
        note: "Heading toward Baton Rouge",
      },
    ],
    lastLat: 30.32,
    lastLng: -91.75,
  },
];

export const SEED_DRIVER_APPS: DriverApplication[] = [
  {
    id: "da_seed1",
    fullName: "Morgan Ellis",
    email: "morgan@example.com",
    phone: "(337) 555-0142",
    city: "Lafayette, LA",
    vehicle: "2017 Honda Pilot",
    licensePlate: "LA·DEMO1",
    yearsDriving: "10+",
    corridors: "LFT–SHV weekly, LFT–HOU monthly",
    interviewMode: "in_person",
    preferredTime: "Saturday mornings",
    notes: "Saw the Facebook group posts. Drive SHV every other weekend.",
    gender: "woman",
    status: "pending_interview",
    createdAt: daysFromNow(-1, 10, 0),
  },
  {
    id: "da_seed2",
    fullName: "Derek Fontenot",
    email: "derek@example.com",
    phone: "(337) 555-0199",
    city: "Lafayette, LA",
    vehicle: "2020 F-150",
    licensePlate: "LA·DEMO2",
    yearsDriving: "5+",
    corridors: "LFT–MSY, local runs",
    interviewMode: "either",
    preferredTime: "Weeknight Zoom OK",
    notes: "Happy to haul packages and parts for shops.",
    gender: "man",
    status: "scheduled",
    interviewAt: daysFromNow(1, 18, 0),
    createdAt: daysFromNow(-2, 14, 0),
    adminNote: "Zoom booked Tue 6pm",
  },
];

export const SEED_RIDER_APPS: RiderApplication[] = [
  {
    id: "ra_seed1",
    fullName: "Priya N.",
    email: "priya@example.com",
    phone: "(318) 555-0110",
    city: "Shreveport, LA",
    typicalRoutes: "SHV–LFT for ULL weekends",
    interviewMode: "zoom",
    preferredTime: "Evenings",
    notes: "Student — needs safer option than bus.",
    status: "pending_interview",
    createdAt: daysFromNow(-1, 16, 0),
  },
];

export type VolunteerCategory =
  | "veteran"
  | "disabled"
  | "elder"
  | "hardship"
  | "medical"
  | "work";

export type VolunteerRideStatus =
  | "seeking_volunteer"
  | "escalated_paid"
  | "matched"
  | "completed"
  | "cancelled";

export type VolunteerCancelActor = "rider" | "driver" | "admin" | "system";

export type VolunteerRide = {
  id: string;
  category: VolunteerCategory;
  fullName: string;
  phone: string;
  pickup: string;
  dropoff: string;
  when: string;
  notes: string;
  escalateAfterHours: number;
  status: VolunteerRideStatus;
  createdAt: string;
  escalatedAt?: string;
  /** When the request was cancelled (history) */
  cancelledAt?: string;
  /** Who cancelled — rider, driver, admin (founder), or system */
  cancelledBy?: VolunteerCancelActor;
  /** Display name of who cancelled */
  cancelledByName?: string;
  /** When marked complete */
  completedAt?: string;
  /** Driver tapped Begin ride — rider sees SOS/audio */
  tripStartedAt?: string;
  /** Driver tapped End ride */
  tripEndedAt?: string;
  paidOffer: number;
  matchedDriverName?: string;
  requesterName: string;
};

export const VOLUNTEER_LABELS: Record<VolunteerCategory, string> = {
  veteran: "Veteran",
  disabled: "Disabled / mobility need",
  elder: "Elder (75+)",
  hardship: "Hardship",
  medical: "Medical appointment",
  work: "Work / job interview",
};

export const SEED_VOLUNTEERS: VolunteerRide[] = [
  {
    id: "vol1",
    category: "veteran",
    fullName: "Robert H.",
    phone: "(337) 555-0188",
    pickup: "Our Lady of Lourdes Hospital",
    dropoff: "Home — south Lafayette",
    when: "Today after 2pm",
    notes: "Wheelchair-accessible car preferred if possible.",
    escalateAfterHours: 2,
    status: "seeking_volunteer",
    createdAt: daysFromNow(0, 8, 0),
    paidOffer: 12,
    requesterName: "Care coordinator",
  },
  {
    id: "vol2",
    category: "elder",
    fullName: "Miss Elaine",
    phone: "(337) 555-0166",
    pickup: "Costco, Lafayette",
    dropoff: "River Ranch, Lafayette",
    when: "ASAP",
    notes: "Needs help with a few bags. Free volunteer first.",
    escalateAfterHours: 1,
    status: "seeking_volunteer",
    createdAt: new Date(Date.now() - 90 * 60_000).toISOString(),
    paidOffer: 10,
    requesterName: "Neighbor",
  },
];


export const RENTAL_LISTINGS: RentalListing[] = [
  {
    id: "r1",
    title: "Igloo 70-qt ice chest",
    description: "Holds a full party run. Clean, with drain plug. Pickup in south Lafayette.",
    category: "outdoors",
    rate: 10,
    rateUnit: "day",
    city: "Lafayette, LA",
    ownerName: "Travis D.",
    available: true,
    deposit: 20,
    forRent: true,
    forSale: true,
    salePrice: 45,
  },
  {
    id: "r_food1",
    title: "Homemade banana pudding",
    description:
      "Fresh made banana pudding — $12 a piece. Local pickup / meet-up. Message for today’s batch size. Pay cook in person (pilot).",
    category: "food",
    rate: 0,
    rateUnit: "piece",
    city: "Lafayette, LA",
    ownerName: "Neighbor baker",
    available: true,
    forRent: false,
    forSale: true,
    salePrice: 12,
    qtyAvailable: 8,
  },
  {
    id: "r2",
    title: "Hybrid bicycle (M size)",
    description: "Great for campus or town. Helmet included. Lock available.",
    category: "wheels",
    rate: 25,
    rateUnit: "day",
    city: "Austin, TX",
    ownerName: "Sam L.",
    available: true,
    deposit: 50,
    forRent: true,
    forSale: true,
    salePrice: 180,
  },
  {
    id: "r3",
    title: "DeWalt 20V impact drill kit",
    description: "Drill + 2 batteries + charger + bits. Hourly or daily.",
    category: "tools",
    rate: 15,
    rateUnit: "hour",
    city: "Lafayette, LA",
    ownerName: "Chris B.",
    available: true,
    deposit: 40,
  },
  {
    id: "r4",
    title: "Weber gas grill + tank",
    description: "Patio grill with full propane tank. Weekend cookouts welcome.",
    category: "party",
    rate: 35,
    rateUnit: "day",
    city: "Lafayette, LA",
    ownerName: "Maya R.",
    available: true,
    deposit: 75,
  },
  {
    id: "r5",
    title: "Utility trailer (5×8)",
    description: "Haul yard waste, furniture, or a fridge. Hitch required.",
    category: "wheels",
    rate: 45,
    rateUnit: "day",
    city: "Lafayette, LA",
    ownerName: "Jordan K.",
    available: true,
    deposit: 100,
  },
  {
    id: "r6",
    title: "Kids go-kart",
    description: "Neighborhood fun for ages 8+. Adult supervision assumed.",
    category: "wheels",
    rate: 20,
    rateUnit: "hour",
    city: "Lafayette, LA",
    ownerName: "Alicia P.",
    available: true,
    deposit: 60,
  },
  {
    id: "r7",
    title: "Propane turkey burner + tank",
    description: "Crawfish / turkey / outdoor boil setup.",
    category: "party",
    rate: 30,
    rateUnit: "day",
    city: "Lafayette, LA",
    ownerName: "Travis D.",
    available: true,
    deposit: 50,
  },
  {
    id: "r8",
    title: "Round-point shovel",
    description: "Good condition. Cheaper than buying one for a single job.",
    category: "tools",
    rate: 5,
    rateUnit: "day",
    city: "Lafayette, LA",
    ownerName: "Sam L.",
    available: true,
  },
];

export const BORROW_REQUESTS: BorrowRequest[] = [
  {
    id: "br1",
    title: "Need an impact drill this afternoon",
    description: "Mounting a TV. Happy to pay well for convenience.",
    category: "tools",
    offer: 50,
    rateUnit: "day",
    city: "Lafayette, LA",
    neededBy: daysFromNow(0, 18, 0),
    requesterName: "Alex M.",
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "br2",
    title: "Borrow a trailer Saturday morning",
    description: "Moving a couch across town. Will return by evening.",
    category: "wheels",
    offer: 60,
    rateUnit: "day",
    city: "Lafayette, LA",
    neededBy: daysFromNow(2, 9, 0),
    requesterName: "Pat R.",
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "br3",
    title: "Bike for a weekend in Austin",
    description: "Flying in without a bike. Prefer hybrid or road.",
    category: "wheels",
    offer: 30,
    rateUnit: "day",
    city: "Austin, TX",
    neededBy: daysFromNow(5, 10, 0),
    requesterName: "Jordan K.",
    status: "open",
    createdAt: new Date().toISOString(),
  },
];



export const GIG_PLATFORM_LABELS: Record<GigPlatform, string> = {
  uber: "Uber",
  lyft: "Lyft",
  spark: "Spark",
  uber_eats: "Uber Eats",
  flex: "Amazon Flex",
  door_dash: "DoorDash",
  other: "Other",
};

export const AIRPORT_PRESETS = [
  { id: "lft", label: "Lafayette Regional (LFT)", city: "Lafayette, LA", short: "LFT" },
  { id: "hou", label: "Houston Hobby / IAH area", city: "Houston, TX", short: "HOU" },
  { id: "msy", label: "New Orleans (MSY)", city: "New Orleans, LA", short: "MSY" },
  { id: "shv", label: "Shreveport (SHV)", city: "Shreveport, LA", short: "SHV" },
  { id: "dfw", label: "Dallas–Fort Worth area", city: "Dallas, TX", short: "DFW" },
  { id: "btr", label: "Baton Rouge (BTR)", city: "Baton Rouge, LA", short: "BTR" },
] as const;

export const PILOT_INVITE_CODES = ["HUBCITY", "FB60K", "SHARE2026", "ENDEAVORS"] as const;

export type ChatThread = {
  id: string;
  subject: string;
  participants: string[];
  relatedType: "ride" | "delivery" | "volunteer" | "support" | "local" | "rental";
  relatedId?: string;
  updatedAt: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  from: string;
  body: string;
  at: string;
  kind?: "text" | "system" | "photo";
};

export type SavedPlace = {
  id: string;
  label: string;
  address: string;
};

export type PaymentRecord = {
  id: string;
  label: string;
  amount: number;
  status: "demo_paid" | "pending" | "failed";
  createdAt: string;
  bookingId?: string;
  stripeLikeId: string;
};

export const SEED_THREADS: ChatThread[] = [
  {
    id: "th1",
    subject: "LFT → SHV · Travis D.",
    participants: ["You", "Travis D."],
    relatedType: "ride",
    relatedId: "t3",
    updatedAt: new Date().toISOString(),
    unread: 1,
  },
  {
    id: "th2",
    subject: "HVAC valve · SHR-4K2M",
    participants: ["You", "Acadiana HVAC", "Travis D."],
    relatedType: "delivery",
    relatedId: "del_track1",
    updatedAt: new Date(Date.now() - 3600_000).toISOString(),
    unread: 0,
  },
  {
    id: "th3",
    subject: "Share support",
    participants: ["You", "Share Ops"],
    relatedType: "support",
    updatedAt: new Date(Date.now() - 86400_000).toISOString(),
    unread: 0,
  },
];

export const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    threadId: "th1",
    from: "Travis D.",
    body: "I'll be in a gray Highlander. Dashcam is on for both our safety.",
    at: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    id: "m2",
    threadId: "th1",
    from: "You",
    body: "Perfect — one medium suitcase. Thanks!",
    at: new Date(Date.now() - 7000_000).toISOString(),
  },
  {
    id: "m3",
    threadId: "th1",
    from: "Travis D.",
    body: "See you at the Oil Center curb at 8:50.",
    at: new Date(Date.now() - 1800_000).toISOString(),
  },
  {
    id: "m4",
    threadId: "th2",
    from: "Share Ops",
    body: "Delivery matched. All chat on this thread is saved for safety review.",
    at: new Date(Date.now() - 4000_000).toISOString(),
    kind: "system",
  },
  {
    id: "m5",
    threadId: "th2",
    from: "Travis D.",
    body: "Picked up the valve. Photo on tracking. ETA ~11:40.",
    at: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: "m6",
    threadId: "th3",
    from: "Share Ops",
    body: "Welcome to the Hub City pilot. Use in-app messages for trip chat — we keep a record if something goes wrong.",
    at: new Date(Date.now() - 86400_000).toISOString(),
  },
];

export const DEFAULT_SAVED_PLACES: SavedPlace[] = [
  { id: "sp1", label: "Home", address: "South Lafayette" },
  { id: "sp2", label: "Work / shop", address: "Oil Center, Lafayette" },
  { id: "sp3", label: "LFT Airport", address: "Lafayette Regional Airport (LFT)" },
];


export type CarShareListing = {
  id: string;
  makeModel: string;
  year: number;
  seats: number;
  transmission: "auto" | "manual";
  ratePerDay: number;
  deposit: number;
  city: string;
  ownerName: string;
  ownerId?: string;
  hasDashcam: boolean;
  insuranceNote: string;
  rules: string;
  available: boolean;
  tripsHosted: number;
  rating: number;
  /** Photo of the car for rent (Turo-style card) */
  photoUrl?: string;
};

export const CAR_LISTINGS: CarShareListing[] = [
  {
    id: "car1",
    makeModel: "Toyota Highlander",
    year: 2019,
    seats: 7,
    transmission: "auto",
    ratePerDay: 55,
    deposit: 200,
    city: "Lafayette, LA",
    ownerName: "Travis D.",
    ownerId: "d1",
    hasDashcam: true,
    insuranceNote: "Owner policy primary · renter must be 21+",
    rules: "No smoking. Full tank return. Acadiana only first 2 days.",
    available: true,
    tripsHosted: 24,
    rating: 4.96,
    photoUrl:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900&q=80",
  },
  {
    id: "car2",
    makeModel: "Honda CR-V",
    year: 2021,
    seats: 5,
    transmission: "auto",
    ratePerDay: 48,
    deposit: 175,
    city: "Lafayette, LA",
    ownerName: "Maya R.",
    ownerId: "d2",
    hasDashcam: true,
    insuranceNote: "Commercial host add-on pending pilot rules",
    rules: "Pets OK with blanket. Airport pickup available.",
    available: true,
    tripsHosted: 18,
    rating: 4.94,
    photoUrl:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&q=80",
  },
  {
    id: "car3",
    makeModel: "Ford F-150",
    year: 2020,
    seats: 5,
    transmission: "auto",
    ratePerDay: 65,
    deposit: 250,
    city: "Lafayette, LA",
    ownerName: "Derek F.",
    hasDashcam: false,
    insuranceNote: "Owner lists personal use only — confirm before book",
    rules: "Towing package. No off-roading.",
    available: true,
    tripsHosted: 9,
    rating: 4.88,
    photoUrl:
      "https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?w=900&q=80",
  },
  {
    id: "car4",
    makeModel: "Tesla Model Y",
    year: 2022,
    seats: 5,
    transmission: "auto",
    ratePerDay: 89,
    deposit: 300,
    city: "Dallas, TX",
    ownerName: "Chris B.",
    ownerId: "d5",
    hasDashcam: true,
    insuranceNote: "Supercharging on renter · cabin cam on",
    rules: "Charge to 50%+ on return. No track mode.",
    available: true,
    tripsHosted: 31,
    rating: 4.97,
    photoUrl:
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900&q=80",
  },
];

export function getDriver(id: string) {
  return DRIVERS.find((d) => d.id === id);
}

export function getTrip(id: string) {
  return TRIPS.find((t) => t.id === id);
}

export const SCHEDULE_LABELS: Record<ScheduleStrictness, string> = {
  flexible: "Fully flexible",
  moderate: "Somewhat flexible",
  strict: "On-time departure",
};

/** Short badge text for trip cards (full words, not truncated “Somewhat”). */
export const SCHEDULE_BADGE: Record<ScheduleStrictness, string> = {
  flexible: "Fully flexible",
  moderate: "Somewhat flexible",
  strict: "On-time",
};

/** Common vehicle body styles for ride posts / driver apps. */
export const VEHICLE_TYPES = [
  "Sedan",
  "SUV / Crossover",
  "Truck",
  "Van / Minivan",
  "Hatchback",
  "Coupe",
  "Wagon",
  "Other",
] as const;

export type RentalHandoff = {
  id: string;
  rentalId: string;
  borrowerName: string;
  /** Lender checked: demonstrated tool works at pickup */
  demonstratedWorking: boolean;
  createdAt: string;
  completedAt?: string;
};

export const INTERVIEW_LABELS: Record<InterviewMode, string> = {
  in_person: "In person (Lafayette area)",
  zoom: "Quick Zoom call",
  either: "Either works",
};

export const PREF_LABELS: Record<DriverPreference, string> = {
  any: "Any approved driver",
  woman: "Woman driver preferred",
  man: "Man driver preferred",
  preferred: "Specific preferred driver",
};

/** Demo fare comparison for local trips — illustrative, not live API. */
export function estimateLocalFares(pickup: string, dropoff: string) {
  const key = `${pickup}|${dropoff}`.toLowerCase();
  const base = 6 + ((key.length * 7) % 14);
  const miles = Math.max(2, Math.min(18, base));
  const sharePrice = Math.max(6, Math.round(miles * 1.35 + 3));
  const uberEstimate = Math.round(sharePrice * 2.1 + 4);
  const lyftEstimate = Math.round(sharePrice * 2.0 + 5);
  return { miles, sharePrice, uberEstimate, lyftEstimate };
}

/** Share take rate demo — keep drivers whole. */
export const PLATFORM_TAKE_RATE = 0.1; // 10% vs ~25% industry

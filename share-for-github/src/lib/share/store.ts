import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  BORROW_REQUESTS,
  CAR_LISTINGS,
  DEFAULT_SAVED_PLACES,
  OPEN_DELIVERIES,
  PILOT_INVITE_CODES,
  RENTAL_LISTINGS,
  SEED_DRIVER_APPS,
  SEED_MESSAGES,
  SEED_RIDER_APPS,
  SEED_THREADS,
  SEED_VOLUNTEERS,
  SEED_RIDE_REQUESTS,
  TRIPS,
  type ApplicationStatus,
  type Booking,
  type BorrowRequest,
  type CarShareListing,
  type ChatMessage,
  type ChatThread,
  type DeliveryRequest,
  type DeliveryTrackStatus,
  type DriverApplication,
  type DriverPreference,
  type LocalRideRequest,
  type PaymentRecord,
  type RentalListing,
  type RiderApplication,
  type SavedPlace,
  type TrackEvent,
  type Trip,
  type VolunteerRide,
  type RentalHandoff,
  type MarketplaceRequest,
  type SavedVehicle,
  type CorridorRideRequest,
  type RideOffer,
} from "./data";
import { fakeStripeId } from "./payments";
import { makeTrackingCode, shouldEscalate, trackLabel } from "./tracking";
import { matchedFare } from "./corridor";
import { isDemoMode } from "./mode";

type CarBooking = {
  id: string;
  carId: string;
  days: number;
  total: number;
  status: string;
  createdAt: string;
};

type ShareState = {
  trips: Trip[];
  bookings: Booking[];
  deliveries: DeliveryRequest[];
  driverApps: DriverApplication[];
  riderApps: RiderApplication[];
  rentals: RentalListing[];
  borrowRequests: BorrowRequest[];
  localRides: LocalRideRequest[];
  volunteerRides: VolunteerRide[];
  carListings: CarShareListing[];
  carBookings: CarBooking[];
  rideRequests: CorridorRideRequest[];
  waitlistEmails: string[];
  threads: ChatThread[];
  messages: ChatMessage[];
  savedPlaces: SavedPlace[];
  payments: PaymentRecord[];
  inviteCodeUsed: string | null;
  referralCode: string;
  referralCount: number;
  notifications: string[];
  riderName: string;
  isDriverApproved: boolean;
  isRiderApproved: boolean;
  favoriteDriverIds: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  idVerified: boolean;
  tripRatings: Record<string, number>;
  setEmergencyContact: (name: string, phone: string) => void;
  setIdVerified: (v: boolean) => void;
  rateTrip: (bookingId: string, stars: number) => void;
  postRideRequest: (
    req: Omit<
      CorridorRideRequest,
      "id" | "status" | "createdAt" | "offers" | "matchedOfferId" | "matchedAmount" | "matchedDriverName"
    >,
  ) => CorridorRideRequest;
  offerOnRideRequest: (
    requestId: string,
    offer: { driverName: string; driverId?: string; amount: number; note: string },
  ) => RideOffer | null;
  acceptRideOffer: (requestId: string, offerId: string) => boolean;
  /** Rider raises private max offer; over-budget bids that now fit become pending_approval */
  raisePrivateOffer: (requestId: string, newMax: number) => number;
  cancelRideRequest: (requestId: string) => void;
  claimDeliveryOnTrip: (deliveryId: string, tripId: string, driverName?: string) => void;
  bookRide: (
    tripId: string,
    seats: number,
    cargoNote: string,
    opts?: { driverPreference?: DriverPreference; preferredDriverId?: string },
  ) => Booking | null;
  bookDelivery: (tripId: string, cargoNote: string) => Booking | null;
  postTrip: (trip: Trip) => void;
  updateTrip: (id: string, patch: Partial<Trip>) => void;
  deleteTrip: (id: string) => boolean;
  requestDelivery: (
    req: Omit<
      DeliveryRequest,
      "id" | "status" | "events" | "trackingCode" | "driverName"
    >,
  ) => DeliveryRequest;
  advanceDelivery: (
    id: string,
    status: DeliveryTrackStatus,
    note?: string,
    driverName?: string,
    photoNote?: string,
  ) => void;
  submitDriverApp: (
    app: Omit<
      DriverApplication,
      "id" | "status" | "createdAt" | "interviewAt" | "adminNote"
    > & { inviteCode?: string },
  ) => DriverApplication;
  submitRiderApp: (
    app: Omit<
      RiderApplication,
      "id" | "status" | "createdAt" | "interviewAt" | "adminNote"
    > & { inviteCode?: string },
  ) => RiderApplication;
  listRental: (item: Omit<RentalListing, "id" | "available">) => string;
  replaceRentalId: (localId: string, cloudId: string) => void;
  replaceBorrowId: (localId: string, cloudId: string) => void;
  startRentalHandoff: (rentalId: string, borrowerName: string) => string;
  confirmRentalDemo: (handoffId: string) => void;
  rentalHandoffs: RentalHandoff[];
  marketplaceRequests: MarketplaceRequest[];
  requestListing: (
    req: Omit<MarketplaceRequest, "id" | "status" | "createdAt">,
  ) => MarketplaceRequest;
  requestBorrow: (
    req: Omit<BorrowRequest, "id" | "status" | "createdAt">,
  ) => string;
  requestLocalRide: (
    req: Omit<LocalRideRequest, "id" | "status" | "createdAt" | "adminNote">,
  ) => LocalRideRequest;
  listCar: (
    car: Omit<CarShareListing, "id" | "available" | "tripsHosted" | "rating">,
  ) => void;
  bookCar: (carId: string, days: number) => void;
  requestVolunteerRide: (
    req: Omit<
      VolunteerRide,
      "id" | "status" | "createdAt" | "escalatedAt" | "matchedDriverName"
    >,
  ) => VolunteerRide;
  claimVolunteer: (id: string, driverName: string) => void;
  /** Rider/driver changed trip details after match — back to open board for re-accept */
  reopenVolunteerForReaccept: (
    id: string,
    patch?: Partial<
      Omit<
        VolunteerRide,
        "id" | "status" | "createdAt" | "matchedDriverName" | "escalatedAt"
      >
    >,
  ) => void;
  completeVolunteerRide: (id: string) => void;
  beginVolunteerTrip: (id: string, startedAt?: string) => void;
  endVolunteerTrip: (id: string, endedAt?: string) => void;
  updateVolunteerRide: (
    id: string,
    patch: Partial<
      Omit<VolunteerRide, "id" | "status" | "createdAt" | "matchedDriverName" | "escalatedAt">
    >,
  ) => void;
  cancelVolunteerRide: (
    id: string,
    meta?: {
      cancelledBy?: "rider" | "driver" | "admin" | "system";
      cancelledByName?: string;
    },
  ) => void;
  restoreVolunteerRide: (
    id: string,
    as?: "matched" | "seeking_volunteer",
  ) => void;
  processVolunteerEscalations: () => number;
  forceEscalateVolunteer: (id: string) => void;
  joinWaitlist: (email: string) => void;
  setRiderName: (name: string) => void;
  profileSelfie: string;
  setProfileSelfie: (dataUrl: string) => void;
  myVehicles: SavedVehicle[];
  addVehicle: (
    v: Omit<SavedVehicle, "id" | "createdAt"> & { id?: string },
  ) => SavedVehicle;
  updateVehicle: (id: string, patch: Partial<SavedVehicle>) => void;
  removeVehicle: (id: string) => void;
  setDefaultVehicle: (id: string) => void;
  applyAsDriver: () => void;
  cancelBooking: (id: string) => void;
  toggleFavoriteDriver: (id: string) => void;
  setDriverAppStatus: (
    id: string,
    status: ApplicationStatus,
    extra?: { interviewAt?: string; adminNote?: string },
  ) => void;
  removeDriverApp: (id: string) => void;
  removeRiderApp: (id: string) => void;
  setRiderAppStatus: (
    id: string,
    status: ApplicationStatus,
    extra?: { interviewAt?: string; adminNote?: string },
  ) => void;
  /** Merge cloud driver/rider apps for the signed-in email into local state. */
  syncMyApps: (payload: {
    drivers: DriverApplication[];
    riders: RiderApplication[];
  }) => void;
  setDeliveryStatus: (
    id: string,
    status: DeliveryTrackStatus,
    adminNote?: string,
  ) => void;
  setLocalRideStatus: (
    id: string,
    status: LocalRideRequest["status"],
    adminNote?: string,
  ) => void;
  sendMessage: (threadId: string, body: string, from?: string) => void;
  openThread: (threadId: string) => void;
  startThread: (opts: {
    subject: string;
    withName: string;
    relatedType: ChatThread["relatedType"];
    relatedId?: string;
    firstMessage?: string;
  }) => string;
  addSavedPlace: (label: string, address: string) => void;
  removeSavedPlace: (id: string) => void;
  redeemInvite: (code: string) => boolean;
  recordReferral: () => void;
  demoCheckout: (
    label: string,
    amount: number,
    bookingId?: string,
  ) => PaymentRecord;
  pushNotification: (text: string) => void;
  clearNotifications: () => void;
  resetDemo: () => void;
};

export const SHARE_PERSIST_KEY = "share-app-v14";
/** Face photo lives in its own key so main-state prune/quota cannot kill it. */
export const PROFILE_SELFIE_KEY = "share-profile-selfie-v1";

/** Separate localStorage so demo sample data never pollutes beta. */
function persistStorageName() {
  if (typeof window === "undefined") return "share-app-v14-beta";
  return isDemoMode() ? "share-app-v14-demo" : "share-app-v14-beta";
}

function readDedicatedSelfie(): string {
  if (typeof window === "undefined") return "";
  try {
    const v = localStorage.getItem(PROFILE_SELFIE_KEY);
    if (v && v.startsWith("data:") && v.length > 40) return v;
  } catch {
    /* ignore */
  }
  return "";
}

function writeDedicatedSelfie(dataUrl: string) {
  if (typeof window === "undefined") return;
  try {
    if (!dataUrl) {
      localStorage.removeItem(PROFILE_SELFIE_KEY);
      return;
    }
    localStorage.setItem(PROFILE_SELFIE_KEY, dataUrl);
  } catch {
    console.warn("[share] dedicated selfie write failed (quota)");
  }
}

const DEMO =
  typeof window !== "undefined"
    ? isDemoMode()
    : !import.meta.env.PROD; // SSR: demo in dev, beta in prod build

function emptySeed() {
  return {
    trips: [] as typeof TRIPS,
    bookings: [] as Booking[],
    deliveries: [] as DeliveryRequest[],
    driverApps: [] as DriverApplication[],
    riderApps: [] as RiderApplication[],
    rentals: [] as RentalListing[],
    rentalHandoffs: [] as RentalHandoff[],
    marketplaceRequests: [] as MarketplaceRequest[],
    borrowRequests: [] as BorrowRequest[],
    localRides: [] as LocalRideRequest[],
    volunteerRides: [] as VolunteerRide[],
    carListings: [] as CarShareListing[],
    carBookings: [] as { id: string; carId: string; days: number; total: number; status: string; createdAt: string }[],
    rideRequests: [] as CorridorRideRequest[],
    waitlistEmails: [] as string[],
    threads: [] as ChatThread[],
    messages: [] as ChatMessage[],
    savedPlaces: DEFAULT_SAVED_PLACES,
    payments: [] as PaymentRecord[],
  };
}

function demoSeed() {
  return {
    trips: TRIPS,
    bookings: [] as Booking[],
    deliveries: OPEN_DELIVERIES,
    driverApps: SEED_DRIVER_APPS,
    riderApps: SEED_RIDER_APPS,
    rentals: RENTAL_LISTINGS,
    rentalHandoffs: [] as RentalHandoff[],
    marketplaceRequests: [] as MarketplaceRequest[],
    borrowRequests: BORROW_REQUESTS,
    localRides: [] as LocalRideRequest[],
    volunteerRides: SEED_VOLUNTEERS,
    carListings: CAR_LISTINGS,
    carBookings: [] as { id: string; carId: string; days: number; total: number; status: string; createdAt: string }[],
    rideRequests: SEED_RIDE_REQUESTS,
    waitlistEmails: [] as string[],
    threads: SEED_THREADS,
    messages: SEED_MESSAGES,
    savedPlaces: DEFAULT_SAVED_PLACES,
    payments: [] as PaymentRecord[],
  };
}

const initialMarket = DEMO ? demoSeed() : emptySeed();

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function pushEvent(
  d: DeliveryRequest,
  status: DeliveryTrackStatus,
  note?: string,
): TrackEvent[] {
  const ev: TrackEvent = {
    id: uid("ev"),
    status,
    label: trackLabel(status),
    at: new Date().toISOString(),
    note,
  };
  return [...(d.events ?? []), ev];
}

function systemNotify(
  set: (fn: (s: ShareState) => Partial<ShareState>) => void,
  text: string,
) {
  set((state) => ({
    notifications: [text, ...state.notifications].slice(0, 20),
  }));
}

/** Keep localStorage under quota — ID scans live on the server, not forever in the phone. */
function slimDriverApp(a: DriverApplication): DriverApplication {
  return {
    ...a,
    licenseFront: undefined,
    licenseBack: undefined,
    insuranceCard: undefined,
    // face + car live on profileSelfie / myVehicles
    selfie: undefined,
    vehiclePhoto: undefined,
  };
}

function slimRiderApp(a: RiderApplication): RiderApplication {
  const { selfie: _s, ...rest } = a;
  return rest;
}

function slimTrip(t: Trip): Trip {
  // keep vehicle photo but cap absurd sizes (older posts)
  if (t.vehiclePhoto && t.vehiclePhoto.length > 280_000) {
    return { ...t, vehiclePhoto: undefined, driverSelfie: t.driverSelfie && t.driverSelfie.length > 120_000 ? undefined : t.driverSelfie };
  }
  if (t.driverSelfie && t.driverSelfie.length > 120_000) {
    return { ...t, driverSelfie: undefined };
  }
  return t;
}

function slimVehicle(v: SavedVehicle): SavedVehicle {
  if (v.photoUrl && v.photoUrl.length > 280_000) {
    return { ...v, photoUrl: undefined };
  }
  return v;
}

function slimRental(r: RentalListing): RentalListing {
  if (r.photoUrl && r.photoUrl.length > 280_000) {
    return { ...r, photoUrl: undefined };
  }
  return r;
}

/** Zustand storage that recovers when localStorage quota is exceeded. */
function createSafeStorage(): {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
} {
  return {
    getItem: (name) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      const tryWrite = (v: string) => {
        localStorage.setItem(name, v);
      };
      try {
        tryWrite(value);
        return;
      } catch {
        /* fall through — multi-stage prune */
      }

      // Rescue face into dedicated key before we strip anything
      try {
        const parsed = JSON.parse(value) as { state?: Record<string, unknown> };
        const face =
          typeof parsed.state?.profileSelfie === "string"
            ? (parsed.state.profileSelfie as string)
            : "";
        if (face.length > 40) writeDedicatedSelfie(face);
      } catch {
        /* ignore */
      }

      const stripStage = (stage: 1 | 2 | 3) => {
        try {
          const parsed = JSON.parse(value) as { state?: Record<string, unknown> };
          const s = parsed.state;
          if (!s || typeof s !== "object") return null;

          // Stage 1: strip trip/vehicle/docs/messages — KEEP profileSelfie
          if (Array.isArray(s.myVehicles)) {
            s.myVehicles = (s.myVehicles as { photoUrl?: string }[]).map(
              (v) => ({ ...v, photoUrl: undefined }),
            );
          }
          if (Array.isArray(s.trips)) {
            s.trips = (
              s.trips as { vehiclePhoto?: string; driverSelfie?: string }[]
            ).map((tr) => ({
              ...tr,
              vehiclePhoto: undefined,
              driverSelfie: undefined,
            }));
          }
          if (Array.isArray(s.rentals)) {
            s.rentals = (s.rentals as { photoUrl?: string }[]).map((r) => ({
              ...r,
              photoUrl: undefined,
            }));
          }
          if (Array.isArray(s.driverApps)) {
            s.driverApps = (s.driverApps as Record<string, unknown>[]).map(
              (a) => ({
                ...a,
                licenseFront: undefined,
                licenseBack: undefined,
                insuranceCard: undefined,
                // keep selfie until stage 2
                selfie: stage >= 2 ? undefined : a.selfie,
                vehiclePhoto: undefined,
              }),
            );
          }
          if (Array.isArray(s.riderApps)) {
            s.riderApps = (s.riderApps as Record<string, unknown>[]).map(
              (a) => ({
                ...a,
                selfie: stage >= 2 ? undefined : a.selfie,
              }),
            );
          }
          if (Array.isArray(s.messages)) {
            s.messages =
              stage >= 2
                ? []
                : (s.messages as unknown[]).slice(0, 20);
          }
          if (stage >= 2) {
            // Drop marketplace bulk
            s.trips = [];
            s.deliveries = [];
            s.rideRequests = [];
            s.volunteerRides = (s.volunteerRides as unknown[])?.slice?.(0, 5) ?? [];
          }
          if (stage >= 3) {
            // Last resort: still keep face if present; if huge, rely on dedicated key
            if (
              typeof s.profileSelfie === "string" &&
              (s.profileSelfie as string).length > 80_000
            ) {
              writeDedicatedSelfie(s.profileSelfie as string);
              s.profileSelfie = "";
            }
          }
          return JSON.stringify(parsed);
        } catch {
          return null;
        }
      };

      for (const stage of [1, 2, 3] as const) {
        const compact = stripStage(stage);
        if (!compact) continue;
        try {
          tryWrite(compact);
          console.warn(`[share] localStorage pruned stage ${stage}`);
          return;
        } catch {
          /* next stage */
        }
      }

      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
      console.warn(
        "[share] localStorage full — main state cleared; face kept in dedicated key if saved",
      );
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}

export const useShareStore = create<ShareState>()(
  persist(
    (set, get) => ({
      ...initialMarket,
      inviteCodeUsed: null,
      referralCode:
        "SHARE-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
      referralCount: 0,
      notifications: [
        "In-app messages are saved for safety. Prefer chat over off-app texts.",
      ],
      riderName: "Guest",
      isDriverApproved: false,
      profileSelfie: "",
      myVehicles: [] as SavedVehicle[],
      isRiderApproved: false,
      favoriteDriverIds: DEMO ? ["d2", "d4"] : [],
      emergencyContactName: "",
      emergencyContactPhone: "",
      idVerified: false,
      tripRatings: {},

      bookRide: (tripId, seats, cargoNote, opts) => {
        const trip = get().trips.find((t) => t.id === tripId);
        if (!trip || seats < 1 || seats > trip.seatsAvailable) return null;
        const booking: Booking = {
          id: uid("bk"),
          tripId,
          kind: "ride",
          seats,
          cargoNote,
          status: "confirmed",
          createdAt: new Date().toISOString(),
          total: seats * trip.pricePerSeat,
          driverPreference: opts?.driverPreference ?? "any",
          preferredDriverId: opts?.preferredDriverId,
        };
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? { ...t, seatsAvailable: t.seatsAvailable - seats }
              : t,
          ),
          bookings: [booking, ...state.bookings],
        }));
        systemNotify(
          set,
          `Ride reserved · $${booking.total}. Pay in Checkout when ready.`,
        );
        return booking;
      },

      bookDelivery: (tripId, cargoNote) => {
        const trip = get().trips.find((t) => t.id === tripId);
        if (!trip) return null;
        const booking: Booking = {
          id: uid("bk"),
          tripId,
          kind: "delivery",
          seats: 0,
          cargoNote,
          status: "confirmed",
          createdAt: new Date().toISOString(),
          total: trip.deliveryRate,
        };
        set((state) => ({ bookings: [booking, ...state.bookings] }));
        return booking;
      },

      postTrip: (trip) => set((state) => ({ trips: [trip, ...state.trips] })),

      updateTrip: (id, patch) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === id ? { ...t, ...patch, id: t.id } : t,
          ),
        }));
      },

      deleteTrip: (id) => {
        const exists = get().trips.some((t) => t.id === id);
        if (!exists) return false;
        set((state) => ({
          trips: state.trips.filter((t) => t.id !== id),
          // drop open bookings for that trip
          bookings: state.bookings.filter((b) => b.tripId !== id),
        }));
        systemNotify(set, "Trip post removed");
        return true;
      },

      requestDelivery: (req) => {
        const now = new Date().toISOString();
        const delivery: DeliveryRequest = {
          ...req,
          id: uid("del"),
          status: "open",
          trackingCode: makeTrackingCode(),
          events: [
            {
              id: uid("ev"),
              status: "open",
              label: "Posted",
              at: now,
              note: "Waiting for a Share driver",
            },
          ],
        };
        set((state) => ({ deliveries: [delivery, ...state.deliveries] }));
        systemNotify(set, `Delivery posted · track ${delivery.trackingCode}`);
        return delivery;
      },

      advanceDelivery: (id, status, note, driverName, photoNote) => {
        const combined = [note, photoNote ? `📷 ${photoNote}` : null]
          .filter(Boolean)
          .join(" · ");
        set((state) => ({
          deliveries: state.deliveries.map((d) => {
            if (d.id !== id) return d;
            return {
              ...d,
              status,
              driverName: driverName ?? d.driverName,
              trackingCode: d.trackingCode ?? makeTrackingCode(),
              events: pushEvent(d, status, combined || undefined),
              adminNote: note ?? d.adminNote,
            };
          }),
        }));
        if (status === "matched") {
          systemNotify(set, "SMS/email demo: driver matched — check Messages");
        }
      },

      submitDriverApp: (app) => {
        const { inviteCode, ...rest } = app as typeof app & {
          inviteCode?: string;
        };
        if (inviteCode) get().redeemInvite(inviteCode);
        const full: DriverApplication = {
          ...rest,
          id: uid("da"),
          status: "pending_interview",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          driverApps: [full, ...state.driverApps],
          isDriverApproved: false,
          profileSelfie: (() => {
            const next = full.selfie || state.profileSelfie || "";
            if (full.selfie && full.selfie.length > 40) {
              writeDedicatedSelfie(full.selfie);
            }
            return next;
          })(),
        }));
        if (full.vehicle?.trim()) {
          get().addVehicle({
            label: full.vehicle.trim(),
            vehicleType: full.vehicleType || "Other",
            licensePlate: full.licensePlate || undefined,
            photoUrl: full.vehiclePhoto || undefined,
            isDefault: true,
          });
        }
        systemNotify(set, "Driver application received — interview next");
        return full;
      },

      submitRiderApp: (app) => {
        const { inviteCode, ...rest } = app as typeof app & {
          inviteCode?: string;
        };
        if (inviteCode) get().redeemInvite(inviteCode);
        const full: RiderApplication = {
          ...rest,
          id: uid("ra"),
          status: "pending_interview",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          riderApps: [full, ...state.riderApps],
          profileSelfie: (() => {
            const next = full.selfie || state.profileSelfie || "";
            if (full.selfie && full.selfie.length > 40) {
              writeDedicatedSelfie(full.selfie);
            }
            return next;
          })(),
        }));
        return full;
      },

      listRental: (item) => {
        const id = uid("r");
        set((state) => ({
          rentals: [{ ...item, id, available: true }, ...state.rentals],
        }));
        return id;
      },

      replaceRentalId: (localId, cloudId) => {
        if (!cloudId || localId === cloudId) return;
        set((state) => ({
          rentals: state.rentals.map((r) =>
            r.id === localId ? { ...r, id: cloudId } : r,
          ),
        }));
      },

      replaceBorrowId: (localId, cloudId) => {
        if (!cloudId || localId === cloudId) return;
        set((state) => ({
          borrowRequests: state.borrowRequests.map((r) =>
            r.id === localId ? { ...r, id: cloudId } : r,
          ),
        }));
      },

      startRentalHandoff: (rentalId, borrowerName) => {
        const id = uid("rh");
        set((state) => ({
          rentalHandoffs: [
            {
              id,
              rentalId,
              borrowerName: borrowerName.trim() || "Borrower",
              demonstratedWorking: false,
              createdAt: new Date().toISOString(),
            },
            ...state.rentalHandoffs,
          ],
        }));
        return id;
      },

      confirmRentalDemo: (handoffId) => {
        set((state) => ({
          rentalHandoffs: state.rentalHandoffs.map((h) =>
            h.id === handoffId
              ? {
                  ...h,
                  demonstratedWorking: true,
                  completedAt: new Date().toISOString(),
                }
              : h,
          ),
        }));
        systemNotify(
          set,
          "Pickup demo confirmed — tool works · handoff recorded",
        );
      },

      requestListing: (req) => {
        const full: MarketplaceRequest = {
          ...req,
          id: uid("mreq"),
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          marketplaceRequests: [full, ...(state.marketplaceRequests ?? [])],
        }));
        systemNotify(
          set,
          req.kind === "buy"
            ? "Buy request sent to owner"
            : "Rent request sent to owner",
        );
        return full;
      },

      requestBorrow: (req) => {
        const id = uid("br");
        set((state) => ({
          borrowRequests: [
            {
              ...req,
              id,
              status: "open",
              createdAt: new Date().toISOString(),
            },
            ...state.borrowRequests,
          ],
        }));
        return id;
      },

      requestLocalRide: (req) => {
        const ride: LocalRideRequest = {
          ...req,
          id: uid("lr"),
          status: "broadcasting",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ localRides: [ride, ...state.localRides] }));
        systemNotify(set, "Local drivers notified (demo push/SMS)");
        return ride;
      },

      listCar: (car) => {
        set((state) => ({
          carListings: [
            {
              ...car,
              id: uid("car"),
              available: true,
              tripsHosted: 0,
              rating: 5,
            },
            ...state.carListings,
          ],
        }));
        systemNotify(set, "Car listed for Share a car");
      },

      bookCar: (carId, days) => {
        const car = get().carListings.find((c) => c.id === carId);
        if (!car || days < 1) return;
        const total = car.ratePerDay * days;
        set((state) => ({
          carBookings: [
            {
              id: uid("cb"),
              carId,
              days,
              total,
              status: "reserved",
              createdAt: new Date().toISOString(),
            },
            ...state.carBookings,
          ],
        }));
        systemNotify(
          set,
          `Car reserved ${days}d · $${total} (Share ~10% when live payments)`,
        );
      },

      requestVolunteerRide: (req) => {
        const ride: VolunteerRide = {
          ...req,
          id: (req as { id?: string }).id || uid("vol"),
          status: "seeking_volunteer",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          volunteerRides: [ride, ...state.volunteerRides.filter((r) => r.id !== ride.id)],
        }));
        return ride;
      },

      claimVolunteer: (id, driverName) => {
        set((state) => ({
          volunteerRides: state.volunteerRides.map((r) =>
            r.id === id
              ? { ...r, status: "matched", matchedDriverName: driverName }
              : r,
          ),
        }));
        systemNotify(set, `Volunteer ride matched with ${driverName}`);
      },

      reopenVolunteerForReaccept: (id, patch) => {
        set((state) => ({
          volunteerRides: state.volunteerRides.map((r) => {
            if (r.id !== id) return r;
            if (r.status !== "matched" && r.status !== "escalated_paid" && r.status !== "seeking_volunteer") {
              return r;
            }
            return {
              ...r,
              ...patch,
              status: "seeking_volunteer" as const,
              matchedDriverName: undefined,
              escalatedAt: undefined,
            };
          }),
        }));
        systemNotify(
          set,
          "Ride details changed — needs a driver to accept again",
        );
      },

      completeVolunteerRide: (id) => {
        const at = new Date().toISOString();
        set((state) => ({
          volunteerRides: state.volunteerRides.map((r) =>
            r.id === id && r.status === "matched"
              ? { ...r, status: "completed" as const, completedAt: at }
              : r,
          ),
        }));
        systemNotify(set, "Ride marked complete");
      },

      beginVolunteerTrip: (id, startedAt) => {
        const at = startedAt || new Date().toISOString();
        set((state) => ({
          volunteerRides: state.volunteerRides.map((r) =>
            r.id === id
              ? {
                  ...r,
                  tripStartedAt: at,
                  tripEndedAt: undefined,
                }
              : r,
          ),
        }));
        systemNotify(set, "Ride in progress — SOS available for rider & driver");
      },

      endVolunteerTrip: (id, endedAt) => {
        const at = endedAt || new Date().toISOString();
        set((state) => ({
          volunteerRides: state.volunteerRides.map((r) =>
            r.id === id ? { ...r, tripEndedAt: at } : r,
          ),
        }));
        systemNotify(set, "Ride ended");
      },

      updateVolunteerRide: (id, patch) => {
        set((state) => ({
          volunteerRides: state.volunteerRides.map((r) => {
            if (r.id !== id) return r;
            if (
              r.status !== "seeking_volunteer" &&
              r.status !== "escalated_paid"
            ) {
              return r;
            }
            return { ...r, ...patch };
          }),
        }));
      },

      cancelVolunteerRide: (id, meta) => {
        const at = new Date().toISOString();
        set((state) => ({
          volunteerRides: state.volunteerRides.map((r) =>
            r.id === id &&
            (r.status === "seeking_volunteer" ||
              r.status === "escalated_paid" ||
              r.status === "matched")
              ? {
                  ...r,
                  status: "cancelled" as const,
                  cancelledAt: at,
                  cancelledBy: meta?.cancelledBy || "system",
                  cancelledByName:
                    meta?.cancelledByName || meta?.cancelledBy || "system",
                }
              : r,
          ),
        }));
      },

      restoreVolunteerRide: (id, as) => {
        set((state) => ({
          volunteerRides: state.volunteerRides.map((r) => {
            if (r.id !== id || r.status !== "cancelled") return r;
            const next =
              as ||
              (r.matchedDriverName ? "matched" : "seeking_volunteer");
            return {
              ...r,
              status: next as VolunteerRide["status"],
              cancelledAt: undefined,
              cancelledBy: undefined,
              cancelledByName: undefined,
            };
          }),
        }));
        systemNotify(set, "Cancelled ride restored");
      },

      processVolunteerEscalations: () => {
        const now = Date.now();
        let count = 0;
        set((state) => ({
          volunteerRides: state.volunteerRides.map((r) => {
            if (!shouldEscalate(r, now)) return r;
            count += 1;
            return {
              ...r,
              status: "escalated_paid" as const,
              escalatedAt: new Date().toISOString(),
            };
          }),
        }));
        return count;
      },

      forceEscalateVolunteer: (id) => {
        set((state) => ({
          volunteerRides: state.volunteerRides.map((r) =>
            r.id === id && r.status === "seeking_volunteer"
              ? {
                  ...r,
                  status: "escalated_paid" as const,
                  escalatedAt: new Date().toISOString(),
                }
              : r,
          ),
        }));
      },

      joinWaitlist: (email) => {
        const cleaned = email.trim().toLowerCase();
        if (!cleaned) return;
        set((state) => ({
          waitlistEmails: state.waitlistEmails.includes(cleaned)
            ? state.waitlistEmails
            : [cleaned, ...state.waitlistEmails],
        }));
      },

      setRiderName: (name) => set({ riderName: name }),
      setProfileSelfie: (dataUrl) => {
        const next = dataUrl || "";
        writeDedicatedSelfie(next);
        set((state) => ({
          profileSelfie: next,
          // Keep app rows aligned so cloud sync cannot resurrect an old face
          driverApps: state.driverApps.map((a) =>
            next ? { ...a, selfie: next } : a,
          ),
          riderApps: state.riderApps.map((a) =>
            next ? { ...a, selfie: next } : a,
          ),
        }));
      },

      addVehicle: (v) => {
        const vehicle: SavedVehicle = {
          id: v.id || uid("veh"),
          label: v.label.trim(),
          vehicleType: v.vehicleType || "Other",
          licensePlate: v.licensePlate?.trim() || undefined,
          photoUrl: v.photoUrl || undefined,
          isDefault: v.isDefault ?? get().myVehicles.length === 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          let list = [...state.myVehicles];
          if (vehicle.isDefault) {
            list = list.map((x) => ({ ...x, isDefault: false }));
          }
          // upsert by label+plate
          const existingIdx = list.findIndex(
            (x) =>
              x.label.toLowerCase() === vehicle.label.toLowerCase() ||
              (vehicle.licensePlate &&
                x.licensePlate?.toLowerCase() ===
                  vehicle.licensePlate.toLowerCase()),
          );
          if (existingIdx >= 0) {
            list[existingIdx] = {
              ...list[existingIdx],
              ...vehicle,
              id: list[existingIdx].id,
              createdAt: list[existingIdx].createdAt,
            };
          } else {
            list = [vehicle, ...list];
          }
          return { myVehicles: list };
        });
        return vehicle;
      },

      updateVehicle: (id, patch) => {
        set((state) => ({
          myVehicles: state.myVehicles.map((v) =>
            v.id === id ? { ...v, ...patch, id: v.id } : v,
          ),
        }));
      },

      removeVehicle: (id) => {
        set((state) => {
          const list = state.myVehicles.filter((v) => v.id !== id);
          if (list.length && !list.some((v) => v.isDefault)) {
            list[0] = { ...list[0], isDefault: true };
          }
          return { myVehicles: list };
        });
      },

      setDefaultVehicle: (id) => {
        set((state) => ({
          myVehicles: state.myVehicles.map((v) => ({
            ...v,
            isDefault: v.id === id,
          })),
        }));
      },
      applyAsDriver: () => set({ isDriverApproved: true }),

      cancelBooking: (id) => {
        const booking = get().bookings.find((b) => b.id === id);
        if (!booking) return;
        set((state) => ({
          bookings: state.bookings.filter((b) => b.id !== id),
          trips:
            booking.kind === "ride"
              ? state.trips.map((t) =>
                  t.id === booking.tripId
                    ? {
                        ...t,
                        seatsAvailable: t.seatsAvailable + booking.seats,
                      }
                    : t,
                )
              : state.trips,
        }));
      },

      toggleFavoriteDriver: (id) => {
        set((state) => ({
          favoriteDriverIds: state.favoriteDriverIds.includes(id)
            ? state.favoriteDriverIds.filter((x) => x !== id)
            : [...state.favoriteDriverIds, id],
        }));
      },

      setDriverAppStatus: (id, status, extra) => {
        set((state) => ({
          driverApps: state.driverApps.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  interviewAt: extra?.interviewAt ?? a.interviewAt,
                  adminNote: extra?.adminNote ?? a.adminNote,
                }
              : a,
          ),
          isDriverApproved:
            status === "approved" || status === "active"
              ? true
              : status === "inactive" || status === "declined"
                ? false
                : state.isDriverApproved,
        }));
        if (status === "approved" || status === "active") {
          systemNotify(set, "Driver approved — ready to take trips");
        }
      },

      removeDriverApp: (id) => {
        set((state) => {
          const remaining = state.driverApps.filter((a) => a.id !== id);
          const stillActive = remaining.some(
            (a) => a.status === "active" || a.status === "approved",
          );
          return {
            driverApps: remaining,
            isDriverApproved: stillActive,
          };
        });
      },

      removeRiderApp: (id) => {
        set((state) => {
          const remaining = state.riderApps.filter((a) => a.id !== id);
          const stillActive = remaining.some(
            (a) => a.status === "active" || a.status === "approved",
          );
          return {
            riderApps: remaining,
            isRiderApproved: stillActive,
          };
        });
      },

      setRiderAppStatus: (id, status, extra) => {
        set((state) => ({
          riderApps: state.riderApps.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  interviewAt: extra?.interviewAt ?? a.interviewAt,
                  adminNote: extra?.adminNote ?? a.adminNote,
                }
              : a,
          ),
          isRiderApproved:
            status === "approved" || status === "active"
              ? true
              : status === "inactive" || status === "declined"
                ? false
                : state.isRiderApproved,
        }));
      },

      syncMyApps: ({ drivers, riders }) => {
        set((state) => {
          const merge = <T extends { id: string }>(local: T[], remote: T[]): T[] => {
            const byId = new Map<string, T>();
            for (const a of local) byId.set(a.id, a);
            for (const a of remote) byId.set(a.id, { ...byId.get(a.id), ...a });
            const remoteIds = new Set(remote.map((r) => r.id));
            const rest = local.filter((a) => !remoteIds.has(a.id));
            return [...remote, ...rest];
          };
          const driverApps = merge(state.driverApps, drivers);
          const riderApps = merge(state.riderApps, riders);
          const isDriverApproved =
            driverApps.some(
              (a) => a.status === "active" || a.status === "approved",
            ) || state.isDriverApproved;
          const isRiderApproved =
            riderApps.some(
              (a) => a.status === "active" || a.status === "approved",
            ) || state.isRiderApproved;

          // Source of truth: dedicated key → current profile → apps (never overwrite a real face)
          const dedicated = readDedicatedSelfie();
          const currentFace =
            state.profileSelfie && state.profileSelfie.length > 40
              ? state.profileSelfie
              : "";
          const fromApps =
            driverApps.find((a) => a.selfie && a.selfie.length > 40)?.selfie ||
            riderApps.find((a) => a.selfie && a.selfie.length > 40)?.selfie ||
            "";
          const profileSelfie =
            dedicated || currentFace || fromApps || "";

          if (profileSelfie && profileSelfie !== dedicated) {
            writeDedicatedSelfie(profileSelfie);
          }

          let myVehicles = state.myVehicles;
          if (myVehicles.length === 0) {
            const fromAppVehicles: SavedVehicle[] = [];
            for (const d of driverApps) {
              if (!d.vehicle?.trim()) continue;
              fromAppVehicles.push({
                id: uid("veh"),
                label: d.vehicle.trim(),
                vehicleType: d.vehicleType || "Other",
                licensePlate: d.licensePlate || undefined,
                photoUrl: d.vehiclePhoto || undefined,
                isDefault: fromAppVehicles.length === 0,
                createdAt: d.createdAt || new Date().toISOString(),
              });
            }
            if (fromAppVehicles.length) myVehicles = fromAppVehicles;
          }
          return {
            driverApps,
            riderApps,
            isDriverApproved,
            isRiderApproved,
            profileSelfie,
            myVehicles,
          };
        });
      },

      setDeliveryStatus: (id, status, adminNote) => {
        get().advanceDelivery(id, status, adminNote);
      },

      setLocalRideStatus: (id, status, adminNote) => {
        set((state) => ({
          localRides: state.localRides.map((r) =>
            r.id === id
              ? { ...r, status, adminNote: adminNote ?? r.adminNote }
              : r,
          ),
        }));
      },

      sendMessage: (threadId, body, from) => {
        const text = body.trim();
        if (!text) return;
        const sender = from ?? (get().riderName || "You");
        const msg: ChatMessage = {
          id: uid("m"),
          threadId,
          from: sender,
          body: text,
          at: new Date().toISOString(),
          kind: "text",
        };
        set((state) => ({
          messages: [...state.messages, msg],
          threads: state.threads.map((t) =>
            t.id === threadId ? { ...t, updatedAt: msg.at, unread: 0 } : t,
          ),
        }));
      },

      openThread: (threadId) => {
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId ? { ...t, unread: 0 } : t,
          ),
        }));
      },

      startThread: ({
        subject,
        withName,
        relatedType,
        relatedId,
        firstMessage,
      }) => {
        const id = uid("th");
        const now = new Date().toISOString();
        const thread: ChatThread = {
          id,
          subject,
          participants: ["You", withName],
          relatedType,
          relatedId,
          updatedAt: now,
          unread: 0,
        };
        const msgs: ChatMessage[] = [
          {
            id: uid("m"),
            threadId: id,
            from: "Share Ops",
            body: "This conversation is logged for safety. Keep trip talk in Share.",
            at: now,
            kind: "system",
          },
        ];
        if (firstMessage) {
          msgs.push({
            id: uid("m"),
            threadId: id,
            from: get().riderName || "You",
            body: firstMessage,
            at: now,
            kind: "text",
          });
        }
        set((state) => ({
          threads: [thread, ...state.threads],
          messages: [...state.messages, ...msgs],
        }));
        return id;
      },

      addSavedPlace: (label, address) => {
        if (!label.trim() || !address.trim()) return;
        set((state) => ({
          savedPlaces: [
            { id: uid("sp"), label: label.trim(), address: address.trim() },
            ...state.savedPlaces,
          ],
        }));
      },

      removeSavedPlace: (id) => {
        set((state) => ({
          savedPlaces: state.savedPlaces.filter((p) => p.id !== id),
        }));
      },

      redeemInvite: (code) => {
        const c = code.trim().toUpperCase();
        const ok = (PILOT_INVITE_CODES as readonly string[]).includes(c);
        if (ok) {
          set({ inviteCodeUsed: c });
          systemNotify(set, `Invite ${c} accepted — pilot access`);
        }
        return ok;
      },

      recordReferral: () => {
        set((state) => ({ referralCount: state.referralCount + 1 }));
        systemNotify(set, "Referral recorded (demo)");
      },

      demoCheckout: (label, amount, bookingId) => {
        const payment: PaymentRecord = {
          id: uid("pay"),
          label,
          amount,
          status: "demo_paid",
          createdAt: new Date().toISOString(),
          bookingId,
          stripeLikeId: fakeStripeId(),
        };
        set((state) => ({ payments: [payment, ...state.payments] }));
        systemNotify(
          set,
          `Demo Stripe paid $${amount} · ${payment.stripeLikeId}`,
        );
        return payment;
      },

      postRideRequest: (req) => {
        const full: CorridorRideRequest = {
          ...req,
          id: uid("req"),
          status: "open",
          createdAt: new Date().toISOString(),
          offers: [],
        };
        set((state) => ({
          rideRequests: [full, ...state.rideRequests],
        }));
        systemNotify(
          set,
          `Ride request ${req.from.split(",")[0]} → ${req.to.split(",")[0]} — private offer set · drivers can bid`,
        );
        return full;
      },

      offerOnRideRequest: (requestId, offer) => {
        const req = get().rideRequests.find((r) => r.id === requestId);
        if (!req || req.status !== "open") return null;
        if (offer.amount <= 0) return null;
        // Rider maxOffer is private — drivers never see the number.
        // Bid ≤ private offer → pending rider approval.
        // Bid above private offer → over_budget (driver told to lower bid).
        const within = matchedFare(req.maxBid, offer.amount) != null;
        const o: RideOffer = {
          id: uid("off"),
          requestId,
          driverName: offer.driverName,
          driverId: offer.driverId,
          amount: offer.amount,
          note: offer.note,
          status: within ? "pending_approval" : "over_budget",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          rideRequests: state.rideRequests.map((r) =>
            r.id === requestId ? { ...r, offers: [o, ...r.offers] } : r,
          ),
        }));
        if (within) {
          systemNotify(
            set,
            `${offer.driverName} bid $${offer.amount} on ${req.requesterName}'s trip — awaiting rider approval`,
          );
        } else {
          // Driver: no number. Rider: interest signal so they can raise offer.
          systemNotify(
            set,
            `${offer.driverName}: bid $${offer.amount} is above the rider's private offer — lower your bid and try again`,
          );
          systemNotify(
            set,
            `${req.requesterName}: a driver bid $${offer.amount} but your private offer is lower — raise your offer to unlock, or wait for a lower bid`,
          );
        }
        return o;
      },

      acceptRideOffer: (requestId, offerId) => {
        const req = get().rideRequests.find((r) => r.id === requestId);
        if (!req || req.status !== "open") return false;
        const offer = req.offers.find((o) => o.id === offerId);
        if (
          !offer ||
          (offer.status !== "pending_approval" && offer.status !== "open")
        )
          return false;
        const fare = matchedFare(req.maxBid, offer.amount);
        if (fare == null) return false;

        // Build a trip from the deal so it appears in rides
        const depart = new Date(req.neededBy);
        const hours =
          req.from.includes("Lafayette") && req.to.includes("Shreveport")
            ? 3.2
            : 3.5;
        const arrive = new Date(depart.getTime() + hours * 3600_000);
        const short = (c: string) => {
          const m: Record<string, string> = {
            "Lafayette, LA": "LFT",
            "Shreveport, LA": "SHV",
            "Houston, TX": "HOU",
            "Alexandria, LA": "AEX",
            "New Orleans, LA": "MSY",
            "Dallas, TX": "DFW",
          };
          return m[c] ?? c.slice(0, 3).toUpperCase();
        };
        const trip: Trip = {
          id: uid("user"),
          type: "ride",
          from: req.from,
          to: req.to,
          fromShort: short(req.from),
          toShort: short(req.to),
          departAt: depart.toISOString(),
          arriveAt: arrive.toISOString(),
          seatsAvailable: Math.max(0, 3 - req.seats),
          seatsTotal: 3,
          cargoCapacity: "2 bags",
          pricePerSeat: fare,
          deliveryRate: Math.max(10, Math.round(fare * 0.6)),
          stops:
            req.from.includes("Lafayette") && req.to.includes("Shreveport")
              ? ["Alexandria, LA"]
              : [],
          schedule: "flexible",
          notes: `Matched from request · ${offer.note || "Deal closed"}`,
          driverId: offer.driverId ?? "d1",
          distanceMiles: 215,
          durationHours: hours,
        };
        const booking: Booking = {
          id: uid("bk"),
          tripId: trip.id,
          kind: "ride",
          seats: req.seats,
          cargoNote: req.notes,
          status: "confirmed",
          createdAt: new Date().toISOString(),
          total: fare * req.seats,
        };
        set((state) => ({
          rideRequests: state.rideRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "matched" as const,
                  matchedOfferId: offerId,
                  matchedAmount: fare,
                  matchedDriverName: offer.driverName,
                  offers: r.offers.map((o) =>
                    o.id === offerId
                      ? { ...o, status: "accepted" as const }
                      : o.status === "open" || o.status === "pending_approval"
                        ? { ...o, status: "declined" as const }
                        : o,
                  ),
                }
              : r,
          ),
          trips: [trip, ...state.trips],
          bookings: [booking, ...state.bookings],
        }));
        systemNotify(
          set,
          `Deal! ${req.requesterName} × ${offer.driverName} @ $${fare}`,
        );
        return true;
      },


      raisePrivateOffer: (requestId, newMax) => {
        const req = get().rideRequests.find((r) => r.id === requestId);
        if (!req || req.status !== "open") return 0;
        if (newMax < 5) return 0;
        let unlocked = 0;
        const nextOffers = req.offers.map((o) => {
          if (o.status === "over_budget" && o.amount <= newMax) {
            unlocked += 1;
            return { ...o, status: "pending_approval" as const };
          }
          if (
            (o.status === "pending_approval" || o.status === "open") &&
            o.amount > newMax
          ) {
            return { ...o, status: "over_budget" as const };
          }
          return o;
        });
        set((state) => ({
          rideRequests: state.rideRequests.map((r) =>
            r.id === requestId
              ? { ...r, maxBid: newMax, offers: nextOffers }
              : r,
          ),
        }));
        systemNotify(
          set,
          unlocked
            ? `Private offer raised to $${newMax} — ${unlocked} bid(s) now ready to approve`
            : `Private offer set to $${newMax}`,
        );
        return unlocked;
      },

      cancelRideRequest: (requestId) => {
        set((state) => ({
          rideRequests: state.rideRequests.map((r) =>
            r.id === requestId ? { ...r, status: "cancelled" as const } : r,
          ),
        }));
      },

      claimDeliveryOnTrip: (deliveryId, tripId, driverName) => {
        const trip = get().trips.find((t) => t.id === tripId);
        const name = driverName ?? "Driver";
        get().advanceDelivery(
          deliveryId,
          "matched",
          trip
            ? `Matched to ${trip.fromShort}→${trip.toShort} corridor trip`
            : "Matched on corridor",
          name,
        );
      },

      pushNotification: (text) => systemNotify(set, text),
      clearNotifications: () => set({ notifications: [] }),

      resetDemo: () => {
        try {
          [
            "share-app-v5",
            "share-app-v6",
            "share-app-v7",
            "share-app-v8",
            "share-app-v9",
            "share-app-v11",
            "share-app-v12",
            "share-app-v12-demo",
            "share-app-v12-beta",
            "share-app-v13-demo",
            "share-app-v13-beta",
            "share-app-v14-demo",
            "share-app-v14-beta",
            "share-profile-selfie-v1",
            "share-force-mode",
            "share-demo-notice-v1",
          ].forEach((k) => localStorage.removeItem(k));
        } catch {
          /* ignore */
        }
        if (typeof window !== "undefined") {
          window.location.href = "/app";
        }
      },

      setEmergencyContact: (name, phone) =>
        set({
          emergencyContactName: name.trim(),
          emergencyContactPhone: phone.trim(),
        }),
      setIdVerified: (v) => set({ idVerified: v }),
      rateTrip: (bookingId, stars) => {
        set((state) => ({
          tripRatings: { ...state.tripRatings, [bookingId]: stars },
        }));
        systemNotify(set, `Rated trip ${stars}★`);
      },
    }),
    {
      name: persistStorageName(),
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: (s) => ({
        bookings: s.bookings,
        deliveries: s.deliveries,
        trips: s.trips
          .filter((t) => t.id.startsWith("user_"))
          .map(slimTrip),
        driverApps: s.driverApps.map(slimDriverApp),
        riderApps: s.riderApps.map(slimRiderApp),
        rentals: s.rentals.filter((r) => r.id.startsWith("r_")).map(slimRental),
        rentalHandoffs: s.rentalHandoffs ?? [],
        marketplaceRequests: s.marketplaceRequests ?? [],
        borrowRequests: s.borrowRequests.filter((b) => b.id.startsWith("br_")),
        localRides: s.localRides,
        volunteerRides: s.volunteerRides,
        carListings: s.carListings.filter((c) => c.id.startsWith("car_")),
        carBookings: s.carBookings,
        rideRequests: s.rideRequests,
        waitlistEmails: s.waitlistEmails,
        threads: s.threads,
        messages: s.messages,
        savedPlaces: s.savedPlaces,
        payments: s.payments,
        inviteCodeUsed: s.inviteCodeUsed,
        referralCode: s.referralCode,
        referralCount: s.referralCount,
        notifications: s.notifications,
        riderName: s.riderName,
        isDriverApproved: s.isDriverApproved,
        isRiderApproved: s.isRiderApproved,
        profileSelfie:
          (s.profileSelfie ?? "").length > 250_000
            ? ""
            : (s.profileSelfie ?? ""),
        myVehicles: (s.myVehicles ?? []).map(slimVehicle),
        favoriteDriverIds: s.favoriteDriverIds,
        emergencyContactName: s.emergencyContactName,
        emergencyContactPhone: s.emergencyContactPhone,
        idVerified: s.idVerified,
        tripRatings: s.tripRatings,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ShareState>;
        const demo = isDemoMode();

        // Pull face from older storage keys if dedicated key is empty (v13 → v14)
        if (typeof window !== "undefined" && !readDedicatedSelfie()) {
          try {
            for (const key of [
              "share-app-v13-beta",
              "share-app-v13-demo",
              "share-app-v14-beta",
              "share-app-v14-demo",
            ]) {
              const raw = localStorage.getItem(key);
              if (!raw) continue;
              const parsed = JSON.parse(raw) as {
                state?: { profileSelfie?: string };
              };
              const face = parsed?.state?.profileSelfie;
              if (typeof face === "string" && face.length > 40) {
                writeDedicatedSelfie(face);
                break;
              }
            }
          } catch {
            /* ignore */
          }
        }

        // BETA: never re-inject sample marketplace — only user-created rows
        if (!demo) {
          return {
            ...current,
            ...p,
            trips: (p.trips ?? []).filter((t) => t.id.startsWith("user_")),
            bookings: p.bookings ?? [],
            deliveries: (p.deliveries ?? []).filter(
              (d) => !OPEN_DELIVERIES.some((x) => x.id === d.id),
            ),
            driverApps: p.driverApps ?? [],
            riderApps: p.riderApps ?? [],
            rentals: (p.rentals ?? []).filter((r) => r.id.startsWith("r_")),
            rentalHandoffs: p.rentalHandoffs ?? [],
            marketplaceRequests: p.marketplaceRequests ?? [],
            borrowRequests: (p.borrowRequests ?? []).filter((b) =>
              b.id.startsWith("br_"),
            ),
            localRides: p.localRides ?? [],
            volunteerRides: (p.volunteerRides ?? []).filter(
              (v) => !SEED_VOLUNTEERS.some((s) => s.id === v.id),
            ),
            carListings: (p.carListings ?? []).filter((c) =>
              c.id.startsWith("car_"),
            ),
            carBookings: p.carBookings ?? [],
            rideRequests: (p.rideRequests ?? []).filter(
              (r) => !SEED_RIDE_REQUESTS.some((s) => s.id === r.id),
            ),
            waitlistEmails: p.waitlistEmails ?? [],
            threads: p.threads ?? [],
            messages: p.messages ?? [],
            savedPlaces:
              p.savedPlaces && p.savedPlaces.length > 0
                ? p.savedPlaces
                : DEFAULT_SAVED_PLACES,
            payments: p.payments ?? [],
            favoriteDriverIds: (p.favoriteDriverIds ?? []).filter(
              (id) => !/^d\d+$/.test(id),
            ),
            notifications: (p.notifications ?? current.notifications).filter(
              (n) => !/Amy|Tom|sample|demo push/i.test(n),
            ),
            isDriverApproved: p.isDriverApproved ?? false,
            isRiderApproved: p.isRiderApproved ?? false,
            profileSelfie: (() => {
              const dedicated = readDedicatedSelfie();
              const fromPersist =
                typeof p.profileSelfie === "string" ? p.profileSelfie : "";
              // Dedicated key always wins (most recent explicit retake)
              if (dedicated.length > 40) return dedicated;
              if (fromPersist.length > 40) {
                writeDedicatedSelfie(fromPersist);
                return fromPersist;
              }
              return current.profileSelfie || "";
            })(),
            myVehicles: p.myVehicles ?? [],
            riderName: p.riderName ?? current.riderName,
          };
        }

        // DEMO: seed + user rows
        const userTrips = p.trips ?? [];
        const baseIds = new Set(TRIPS.map((t) => t.id));
        const mergedTrips = [
          ...userTrips.filter((t) => !baseIds.has(t.id)),
          ...TRIPS.map((base) => {
            const booked = (p.bookings ?? [])
              .filter((b) => b.tripId === base.id && b.kind === "ride")
              .reduce((sum, b) => sum + b.seats, 0);
            return {
              ...base,
              seatsAvailable: Math.max(0, base.seatsAvailable - booked),
            };
          }),
        ];
        const userRentals = (p.rentals ?? []).filter(
          (r) => !RENTAL_LISTINGS.some((b) => b.id === r.id),
        );
        const userBorrows = (p.borrowRequests ?? []).filter(
          (b) => !BORROW_REQUESTS.some((x) => x.id === b.id),
        );
        const persistedDrivers = p.driverApps ?? [];
        const persistedRiders = p.riderApps ?? [];
        const driverApps = [
          ...persistedDrivers,
          ...SEED_DRIVER_APPS.filter(
            (s) => !persistedDrivers.some((x) => x.id === s.id),
          ),
        ];
        const riderApps = [
          ...persistedRiders,
          ...SEED_RIDER_APPS.filter(
            (s) => !persistedRiders.some((x) => x.id === s.id),
          ),
        ];
        const userDeliveries = (p.deliveries ?? []).filter(
          (d) => !OPEN_DELIVERIES.some((x) => x.id === d.id),
        );
        const persistedVol = p.volunteerRides ?? [];
        const volunteerRides = [
          ...persistedVol,
          ...SEED_VOLUNTEERS.filter(
            (s) => !persistedVol.some((x) => x.id === s.id),
          ),
        ];
        const userCars = (p.carListings ?? []).filter(
          (c) => !CAR_LISTINGS.some((b) => b.id === c.id),
        );
        return {
          ...current,
          ...p,
          trips: mergedTrips,
          rentals: [...userRentals, ...RENTAL_LISTINGS],
          borrowRequests: [...userBorrows, ...BORROW_REQUESTS],
          deliveries: userDeliveries.length
            ? [
                ...userDeliveries,
                ...OPEN_DELIVERIES.filter(
                  (d) => !userDeliveries.some((u) => u.id === d.id),
                ),
              ]
            : OPEN_DELIVERIES,
          driverApps,
          riderApps,
          localRides: p.localRides ?? [],
          volunteerRides,
          carListings: [...userCars, ...CAR_LISTINGS],
          carBookings: p.carBookings ?? [],
          rideRequests: (() => {
            const persisted = p.rideRequests ?? [];
            const seeds = SEED_RIDE_REQUESTS.filter(
              (s) => !persisted.some((x) => x.id === s.id),
            );
            return [...persisted, ...seeds];
          })(),
          waitlistEmails: p.waitlistEmails ?? [],
          favoriteDriverIds: p.favoriteDriverIds ?? current.favoriteDriverIds,
          threads:
            p.threads && p.threads.length > 0 ? p.threads : SEED_THREADS,
          messages:
            p.messages && p.messages.length > 0 ? p.messages : SEED_MESSAGES,
          savedPlaces:
            p.savedPlaces && p.savedPlaces.length > 0
              ? p.savedPlaces
              : DEFAULT_SAVED_PLACES,
          payments: p.payments ?? [],
          notifications: p.notifications ?? current.notifications,
          profileSelfie: (() => {
            const dedicated = readDedicatedSelfie();
            const fromPersist =
              typeof p.profileSelfie === "string" ? p.profileSelfie : "";
            if (dedicated.length > 40) return dedicated;
            if (fromPersist.length > 40) {
              writeDedicatedSelfie(fromPersist);
              return fromPersist;
            }
            return current.profileSelfie || "";
          })(),
        };
      },
    },
  ),
);

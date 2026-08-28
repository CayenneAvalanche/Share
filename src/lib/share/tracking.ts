import type { DeliveryTrackStatus, VolunteerRide } from "./data";

/** Public brand host for Share under Endeavors */
export const SHARE_DOMAIN = "share.myendeavors.me";
export const PARENT_DOMAIN = "myendeavors.me";

export const TRACK_STEPS: {
  status: DeliveryTrackStatus;
  label: string;
}[] = [
  { status: "open", label: "Posted" },
  { status: "matched", label: "Driver matched" },
  { status: "picked_up", label: "Picked up" },
  { status: "in_transit", label: "In transit" },
  { status: "delivered", label: "Delivered" },
];

export function trackLabel(status: DeliveryTrackStatus): string {
  return TRACK_STEPS.find((s) => s.status === status)?.label ?? status;
}

export function hoursUntilEscalate(ride: VolunteerRide, now = Date.now()) {
  if (ride.status !== "seeking_volunteer") return 0;
  const deadline =
    new Date(ride.createdAt).getTime() + ride.escalateAfterHours * 3600_000;
  return Math.max(0, (deadline - now) / 3600_000);
}

export function shouldEscalate(ride: VolunteerRide, now = Date.now()) {
  if (ride.status !== "seeking_volunteer") return false;
  const deadline =
    new Date(ride.createdAt).getTime() + ride.escalateAfterHours * 3600_000;
  return now >= deadline;
}

export function makeTrackingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SHR-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

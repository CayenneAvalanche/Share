import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Full local date + time for history logs (when request was made). */
export function formatRequestedAt(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** mm:ss or h:mm:ss for in-car stopwatch */
export function formatDurationSeconds(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) return "—";
  const s = Math.floor(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/**
 * In-car time (Phase 2): Begin ride → End ride.
 * Returns null if begin/end not recorded.
 */
export function tripInCarSeconds(
  tripStartedAt?: string | null,
  tripEndedAt?: string | null,
): number | null {
  if (!tripStartedAt || !tripEndedAt) return null;
  const a = +new Date(tripStartedAt);
  const b = +new Date(tripEndedAt);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.floor((b - a) / 1000);
}

/** Human summary for completed volunteer trips */
export function formatInCarTripSummary(opts: {
  tripStartedAt?: string | null;
  tripEndedAt?: string | null;
  completedAt?: string | null;
}): string | null {
  const sec = tripInCarSeconds(opts.tripStartedAt, opts.tripEndedAt);
  if (sec == null) return null;
  const dur = formatDurationSeconds(sec);
  const start = formatTime(opts.tripStartedAt!);
  const end = formatTime(opts.tripEndedAt!);
  return `In car ${dur} · Phase 2 ${start} → ${end}`;
}

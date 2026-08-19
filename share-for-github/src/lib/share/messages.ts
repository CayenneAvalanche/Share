import type { ChatMessage, ChatThread, VolunteerRide, RiderApplication } from "./data";

/** Fake tour threads — never show these on the live site. */
const DEMO_SEED_THREAD_IDS = new Set(["th1", "th2", "th3"]);

export function isDemoSeedThread(id: string) {
  return DEMO_SEED_THREAD_IDS.has(id);
}

export function stripDemoSeedChat<T extends { id?: string; threadId?: string }>(
  items: T[],
): T[] {
  return items.filter((x) => {
    const id = x.threadId || x.id || "";
    return !isDemoSeedThread(id);
  });
}

export function sortThreads(threads: ChatThread[]) {
  return [...threads].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function messagesForThread(all: ChatMessage[], threadId: string) {
  return all
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export function threadPreview(all: ChatMessage[], threadId: string) {
  const msgs = messagesForThread(all, threadId);
  return msgs[msgs.length - 1]?.body ?? "No messages yet";
}

function phone10(p?: string) {
  return String(p || "").replace(/\D/g, "").slice(-10);
}

/**
 * Prefer approved rider full name on volunteer chat subjects/participants
 * so Chat matches ride cards.
 */
export function enrichThreadsWithRiderNames(
  threads: ChatThread[],
  volunteerRides: VolunteerRide[],
  riderApps: Pick<RiderApplication, "phone" | "fullName" | "status">[],
): ChatThread[] {
  const rideById = new Map(volunteerRides.map((r) => [r.id, r]));
  const nameByPhone = new Map<string, string>();
  for (const a of riderApps) {
    const p = phone10(a.phone);
    if (p.length < 10) continue;
    if (a.status !== "active" && a.status !== "approved") continue;
    const nm = (a.fullName || "").trim();
    if (nm.length < 2) continue;
    if (!nameByPhone.has(p)) nameByPhone.set(p, nm);
  }
  // Also from rides that already have riderLegalName attached
  for (const r of volunteerRides) {
    const p = phone10(r.phone);
    const nm = (r.riderLegalName || "").trim();
    if (p.length >= 10 && nm.length >= 2 && !nameByPhone.has(p)) {
      nameByPhone.set(p, nm);
    }
  }

  return threads.map((th) => {
    if (th.relatedType !== "volunteer" || !th.relatedId) return th;
    const ride = rideById.get(th.relatedId);
    const legal =
      (ride && (ride.riderLegalName || nameByPhone.get(phone10(ride.phone)))) ||
      (ride?.phone ? nameByPhone.get(phone10(ride.phone)) : undefined) ||
      ride?.fullName;
    if (!legal || legal.length < 2) return th;

    const parts = th.participants.map((p) => {
      if (p === "You" || p === "Share Ops") return p;
      const pl = p.toLowerCase();
      const ll = legal.toLowerCase();
      if (pl === ll) return legal;
      const first = ll.split(/\s+/)[0] || "";
      if (first && (pl.startsWith(first) || pl.includes(first))) return legal;
      return p;
    });
    if (!parts.some((p) => p.toLowerCase() === legal.toLowerCase())) {
      const idx = parts.findIndex((p) => p !== "You" && p !== "Share Ops");
      if (idx >= 0) parts[idx] = legal;
      else parts.push(legal);
    }

    let subject = th.subject;
    if (/^Ride\s*·/i.test(subject) || /^Chat\s*·/i.test(subject)) {
      subject = `Chat · ${legal}`;
    } else if (ride?.fullName && subject.includes(ride.fullName) && ride.fullName !== legal) {
      subject = subject.split(ride.fullName).join(legal);
    } else if (th.id.startsWith("th_rider_")) {
      subject = `Chat · ${legal}`;
    }

    return { ...th, subject, participants: parts };
  });
}

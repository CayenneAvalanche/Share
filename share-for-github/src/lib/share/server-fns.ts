import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type {
  ApplicationStatus,
  DriverApplication,
  DriverGender,
  InterviewMode,
  RiderApplication,
} from "@/lib/share/data";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function checkPin(pin: string | undefined) {
  const expected = process.env.FOUNDER_PIN?.trim() || "share";
  if (!pin || pin !== expected) {
    throw new Error("Unauthorized — wrong founder PIN");
  }
}

type DriverRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  vehicle: string;
  license_plate: string;
  years_driving: string;
  corridors: string;
  interview_mode: string;
  preferred_time: string;
  notes: string;
  gender: string;
  status: string;
  public_bio: string;
  hometown: string;
  other_job: string;
  platforms_text: string;
  has_dashcam: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  docs_note: string;
  interview_at: string | Date | null;
  admin_note: string | null;
  created_at: string | Date;
};

type RiderRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  typical_routes: string;
  interview_mode: string;
  preferred_time: string;
  notes: string;
  status: string;
  interview_at: string | Date | null;
  admin_note: string | null;
  created_at: string | Date;
};

function iso(v: string | Date | null | undefined): string | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function mapDriver(r: DriverRow): DriverApplication {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    city: r.city,
    vehicle: r.vehicle,
    licensePlate: r.license_plate,
    yearsDriving: r.years_driving,
    corridors: r.corridors,
    interviewMode: r.interview_mode as InterviewMode,
    preferredTime: r.preferred_time,
    notes: r.notes,
    gender: r.gender as DriverGender,
    status: r.status as ApplicationStatus,
    createdAt: iso(r.created_at) ?? new Date().toISOString(),
    interviewAt: iso(r.interview_at),
    adminNote: r.admin_note ?? undefined,
    publicBio: r.public_bio,
    hometown: r.hometown,
    otherJob: r.other_job,
    platformsText: r.platforms_text,
    hasDashcam: r.has_dashcam,
    emergencyContactName: r.emergency_contact_name,
    emergencyContactPhone: r.emergency_contact_phone,
    docsNote: r.docs_note,
  };
}

function mapRider(r: RiderRow): RiderApplication {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    city: r.city,
    typicalRoutes: r.typical_routes,
    interviewMode: r.interview_mode as InterviewMode,
    preferredTime: r.preferred_time,
    notes: r.notes,
    status: r.status as ApplicationStatus,
    createdAt: iso(r.created_at) ?? new Date().toISOString(),
    interviewAt: iso(r.interview_at),
    adminNote: r.admin_note ?? undefined,
  };
}

export const submitDriverAppFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = uid("da");
    const createdAt = new Date().toISOString();
    await sql`
      insert into share_driver_apps (
        id, full_name, email, phone, city, vehicle, license_plate,
        years_driving, corridors, interview_mode, preferred_time, notes,
        gender, status, public_bio, hometown, other_job, platforms_text,
        has_dashcam, emergency_contact_name, emergency_contact_phone,
        docs_note, invite_code, created_at, updated_at
      ) values (
        ${id},
        ${String(data.fullName ?? "").trim()},
        ${String(data.email ?? "").trim().toLowerCase()},
        ${String(data.phone ?? "").trim()},
        ${String(data.city ?? "")},
        ${String(data.vehicle ?? "")},
        ${String(data.licensePlate ?? "")},
        ${String(data.yearsDriving ?? "")},
        ${String(data.corridors ?? "")},
        ${String(data.interviewMode ?? "either")},
        ${String(data.preferredTime ?? "")},
        ${String(data.notes ?? "")},
        ${String(data.gender ?? "unspecified")},
        ${"pending_interview"},
        ${String(data.publicBio ?? "")},
        ${String(data.hometown ?? "")},
        ${String(data.otherJob ?? "")},
        ${String(data.platformsText ?? "")},
        ${Boolean(data.hasDashcam)},
        ${String(data.emergencyContactName ?? "")},
        ${String(data.emergencyContactPhone ?? "")},
        ${String(data.docsNote ?? "")},
        ${data.inviteCode ? String(data.inviteCode) : null},
        ${createdAt},
        ${createdAt}
      )
    `;
    return { id, status: "pending_interview" as const, createdAt };
  });

export const submitRiderAppFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = uid("ra");
    const createdAt = new Date().toISOString();
    await sql`
      insert into share_rider_apps (
        id, full_name, email, phone, city, typical_routes, interview_mode,
        preferred_time, notes, status, invite_code, created_at, updated_at
      ) values (
        ${id},
        ${String(data.fullName ?? "").trim()},
        ${String(data.email ?? "").trim().toLowerCase()},
        ${String(data.phone ?? "").trim()},
        ${String(data.city ?? "")},
        ${String(data.typicalRoutes ?? "")},
        ${String(data.interviewMode ?? "either")},
        ${String(data.preferredTime ?? "")},
        ${String(data.notes ?? "")},
        ${"pending_interview"},
        ${data.inviteCode ? String(data.inviteCode) : null},
        ${createdAt},
        ${createdAt}
      )
    `;
    return { id, status: "pending_interview" as const, createdAt };
  });

export const joinWaitlistFn = createServerFn({ method: "POST" })
  .validator((data: { email: string; source?: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("Invalid email");
    const sql = await getSql();
    const id = uid("wl");
    try {
      await sql`
        insert into share_waitlist (id, email, source)
        values (${id}, ${email}, ${data.source ?? "landing"})
      `;
    } catch {
      // duplicate email — ok
    }
    return { ok: true as const };
  });

export const listApplicationsFn = createServerFn({ method: "POST" })
  .validator((data: { pin: string }) => data)
  .handler(async ({ data }) => {
    checkPin(data.pin);
    const sql = await getSql();
    const drivers = await sql.query<DriverRow>(
      `select * from share_driver_apps order by created_at desc limit 100`,
    );
    const riders = await sql.query<RiderRow>(
      `select * from share_rider_apps order by created_at desc limit 100`,
    );
    const waitlist = await sql.query<{
      email: string;
      created_at: string | Date;
    }>(
      `select email, created_at from share_waitlist order by created_at desc limit 200`,
    );
    const presence = await sql.query<{ id: string }>(
      `select id from share_driver_presence where available = true`,
    );
    return {
      drivers: drivers.map(mapDriver),
      riders: riders.map(mapRider),
      waitlistEmails: waitlist.map((w) => w.email),
      availableDrivers: presence.length,
    };
  });

export const setDriverAppStatusFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      pin: string;
      id: string;
      status: ApplicationStatus;
      interviewAt?: string;
      adminNote?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    checkPin(data.pin);
    const sql = await getSql();
    await sql`
      update share_driver_apps set
        status = ${data.status},
        interview_at = ${data.interviewAt ?? null},
        admin_note = ${data.adminNote ?? null},
        updated_at = ${new Date().toISOString()}
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const setRiderAppStatusFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      pin: string;
      id: string;
      status: ApplicationStatus;
      interviewAt?: string;
      adminNote?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    checkPin(data.pin);
    const sql = await getSql();
    await sql`
      update share_rider_apps set
        status = ${data.status},
        interview_at = ${data.interviewAt ?? null},
        admin_note = ${data.adminNote ?? null},
        updated_at = ${new Date().toISOString()}
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const setDriverAvailableFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      displayName: string;
      city?: string;
      available: boolean;
      presenceId?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = data.presenceId || uid("pr");
    await sql`
      insert into share_driver_presence (id, display_name, city, available, updated_at)
      values (
        ${id},
        ${data.displayName.trim() || "Driver"},
        ${data.city ?? "Lafayette, LA"},
        ${data.available},
        ${new Date().toISOString()}
      )
      on conflict (id) do update set
        display_name = excluded.display_name,
        city = excluded.city,
        available = excluded.available,
        updated_at = excluded.updated_at
    `;
    const rows = await sql.query<{ c: number }>(
      `select count(*)::int as c from share_driver_presence where available = true`,
    );
    return { presenceId: id, availableCount: Number(rows[0]?.c ?? 0) };
  });

export const countAvailableDriversFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<{ c: number }>(
    `select count(*)::int as c from share_driver_presence where available = true`,
  );
  return { availableCount: Number(rows[0]?.c ?? 0) };
});

export const dbHealthFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const sql = await getSql();
      await sql`select 1 as ok`;
      return {
        ok: true as const,
        source: process.env.DATABASE_URL ? ("neon" as const) : ("pglite" as const),
      };
    } catch (e) {
      return {
        ok: false as const,
        source: process.env.DATABASE_URL ? ("neon" as const) : ("pglite" as const),
        error: e instanceof Error ? e.message : "unknown",
      };
    }
  },
);

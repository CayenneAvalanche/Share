import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type {
  ApplicationStatus,
  DriverApplication,
  DriverGender,
  InterviewMode,
  RiderApplication,
  VolunteerCategory,
  VolunteerRide,
} from "@/lib/share/data";
import {
  FOUNDER_NOTIFY_EMAIL_DEFAULT,
  FOUNDER_NOTIFY_PHONE_DEFAULT,
} from "@/lib/share/contact";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function checkPin(pin: string | undefined) {
  // PIN only from env FOUNDER_PIN — never hardcode the value in source
  // (Netlify secret scan fails if env values appear in the client/server bundle).
  const expected = process.env.FOUNDER_PIN?.trim();
  if (!expected) {
    throw new Error("FOUNDER_PIN is not set on the server");
  }
  if (!pin || pin !== expected) {
    throw new Error("Unauthorized — wrong founder PIN");
  }
}

/** Unlock founder inbox — PIN checked only on the server. */
export const verifyFounderPinFn = createServerFn({ method: "POST" })
  .validator((data: { pin: string }) => data)
  .handler(async ({ data }) => {
    checkPin(data.pin);
    return { ok: true as const };
  });

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
  license_front?: string;
  license_back?: string;
  insurance_card?: string;
  selfie?: string;
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
  selfie?: string;
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
    licenseFront: r.license_front || undefined,
    licenseBack: r.license_back || undefined,
    insuranceCard: r.insurance_card || undefined,
    selfie: r.selfie || undefined,
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
    selfie: r.selfie || undefined,
  };
}

/**
 * Founder alert: email (Resend) + SMS (Twilio) when a volunteer ride is requested.
 * Fire-and-forget — never throws to the caller. Missing env keys just skip that channel.
 */
async function notifyFounderVolunteerRequest(payload: {
  id: string;
  category: string;
  fullName: string;
  phone: string;
  pickup: string;
  dropoff: string;
  when: string;
  notes: string;
  paidOffer: number;
  kind?: "new" | "cancel";
}) {
  const emailTo =
    process.env.FOUNDER_NOTIFY_EMAIL?.trim() || FOUNDER_NOTIFY_EMAIL_DEFAULT;
  const phones = [
    process.env.FOUNDER_NOTIFY_PHONE?.trim() || FOUNDER_NOTIFY_PHONE_DEFAULT,
    process.env.FOUNDER_NOTIFY_PHONE_2?.trim() || "",
  ].filter(Boolean);

  const isCancel = payload.kind === "cancel";
  const subject = isCancel
    ? `Share CANCELLED: ${payload.fullName}`
    : `🚨 Share ride NOW: ${payload.fullName} (${payload.category})`;
  const textBody = [
    isCancel ? `Volunteer ride CANCELLED` : `NEW volunteer ride — act now`,
    `ID: ${payload.id}`,
    `Category: ${payload.category}`,
    `Rider: ${payload.fullName}`,
    `Phone: ${payload.phone}`,
    `Pickup: ${payload.pickup}`,
    `Dropoff: ${payload.dropoff}`,
    `When: ${payload.when}`,
    `Paid offer if needed: $${payload.paidOffer}`,
    payload.notes ? `Notes: ${payload.notes}` : "",
    `Open: https://share.myendeavors.me/admin`,
    `Board: https://share.myendeavors.me/volunteer`,
  ]
    .filter(Boolean)
    .join("\n");

  const smsBody = isCancel
    ? `Share CANCELLED: ${payload.fullName} · ${payload.pickup} → ${payload.dropoff}. Call ${payload.phone} if needed.`
    : `🚨 SHARE RIDE NOW: ${payload.fullName} (${payload.category}) ${payload.pickup} → ${payload.dropoff} @ ${payload.when}. CALL ${payload.phone} — open founder inbox.`;

  // --- Email via Resend ---
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      const from =
        process.env.RESEND_FROM?.trim() || "Share <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [emailTo],
          subject,
          text: textBody,
        }),
      });
      if (!res.ok) {
        console.error("[notify] Resend failed", res.status, await res.text());
      }
    } catch (e) {
      console.error("[notify] Resend error", e);
    }
  } else {
    console.warn("[notify] RESEND_API_KEY not set — skipping email");
  }

  // --- SMS via Twilio (all founder phones) ---
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = process.env.TWILIO_FROM_NUMBER?.trim();
  if (twilioSid && twilioToken && twilioFrom && phones.length) {
    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
    for (const phoneTo of phones) {
      try {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: phoneTo,
              From: twilioFrom,
              Body: smsBody.slice(0, 320),
            }),
          },
        );
        if (!res.ok) {
          console.error(
            "[notify] Twilio SMS failed",
            phoneTo,
            res.status,
            await res.text(),
          );
        }
      } catch (e) {
        console.error("[notify] Twilio SMS error", phoneTo, e);
      }
    }

    // Voice ring for NEW rides only (harder to miss at 6am)
    if (!isCancel) {
      const say = encodeURIComponent(
        "New Share ride request. Check your text messages and open the founder inbox now.",
      );
      const twiml = `<Response><Say voice="alice">${say.replace(/%20/g, " ")}</Say><Pause length="1"/><Say voice="alice">New Share ride request. Check your phone.</Say></Response>`;
      // Use Twilio Twiml URL-less: Body as Twiml param
      for (const phoneTo of phones) {
        try {
          const res = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: phoneTo,
                From: twilioFrom,
                Twiml:
                  '<Response><Say voice="alice">New Share ride request. Check your texts and founder inbox now.</Say><Pause length="1"/><Say voice="alice">Again: new Share ride waiting.</Say></Response>',
              }),
            },
          );
          if (!res.ok) {
            console.error(
              "[notify] Twilio Call failed",
              phoneTo,
              res.status,
              await res.text(),
            );
          }
        } catch (e) {
          console.error("[notify] Twilio Call error", phoneTo, e);
        }
      }
    }
  } else {
    console.warn("[notify] Twilio env incomplete — skipping SMS/call");
  }
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
        docs_note, license_front, license_back, insurance_card, selfie,
        invite_code, created_at, updated_at
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
        ${String(data.licenseFront ?? "")},
        ${String(data.licenseBack ?? "")},
        ${String(data.insuranceCard ?? "")},
        ${String(data.selfie ?? "")},
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
        preferred_time, notes, status, selfie, invite_code, created_at, updated_at
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
        ${String(data.selfie ?? "")},
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

export const deleteDriverAppFn = createServerFn({ method: "POST" })
  .validator((data: { pin: string; id: string }) => data)
  .handler(async ({ data }) => {
    checkPin(data.pin);
    const sql = await getSql();
    await sql`delete from share_driver_apps where id = ${data.id}`;
    // clear availability presence if any
    try {
      await sql`delete from share_driver_presence where id = ${data.id}`;
    } catch {
      /* table may not match id */
    }
    return { ok: true as const };
  });

export const deleteRiderAppFn = createServerFn({ method: "POST" })
  .validator((data: { pin: string; id: string }) => data)
  .handler(async ({ data }) => {
    checkPin(data.pin);
    const sql = await getSql();
    await sql`delete from share_rider_apps where id = ${data.id}`;
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
      email?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const email = data.email?.trim().toLowerCase() || null;
    // Only approved/active drivers may go available (when email provided)
    if (data.available && email) {
      const apps = await sql<{ status: string }>`
        select status from share_driver_apps
        where lower(email) = ${email}
          and status in ('active', 'approved')
        limit 1
      `;
      if (!apps.length) {
        throw new Error("Only approved active drivers can go available");
      }
    }
    const id = data.presenceId || uid("pr");
    const now = new Date().toISOString();
    try {
      await sql`
        insert into share_driver_presence (id, display_name, city, available, email, updated_at)
        values (
          ${id},
          ${data.displayName.trim() || "Driver"},
          ${data.city ?? "Lafayette, LA"},
          ${data.available},
          ${email},
          ${now}
        )
        on conflict (id) do update set
          display_name = excluded.display_name,
          city = excluded.city,
          available = excluded.available,
          email = coalesce(excluded.email, share_driver_presence.email),
          updated_at = excluded.updated_at
      `;
    } catch {
      // fallback if email column not migrated yet
      await sql`
        insert into share_driver_presence (id, display_name, city, available, updated_at)
        values (
          ${id},
          ${data.displayName.trim() || "Driver"},
          ${data.city ?? "Lafayette, LA"},
          ${data.available},
          ${now}
        )
        on conflict (id) do update set
          display_name = excluded.display_name,
          city = excluded.city,
          available = excluded.available,
          updated_at = excluded.updated_at
      `;
    }
    // count only fresh presence (30 min)
    const rows = await sql.query<{ c: number }>(
      `select count(*)::int as c from share_driver_presence
       where available = true
         and updated_at > now() - interval '30 minutes'`,
    );
    return { presenceId: id, availableCount: Number(rows[0]?.c ?? 0) };
  });

export const countAvailableDriversFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<{ c: number }>(
    `select count(*)::int as c from share_driver_presence
     where available = true
       and updated_at > now() - interval '30 minutes'`,
  );
  return { availableCount: Number(rows[0]?.c ?? 0) };
});

/** Founder: who is online for local rides right now */
export const listOnlineDriversFn = createServerFn({ method: "POST" })
  .validator((data: { pin: string }) => data)
  .handler(async ({ data }) => {
    checkPin(data.pin);
    const sql = await getSql();
    try {
      const rows = await sql.query<{
        id: string;
        display_name: string;
        city: string;
        email: string | null;
        updated_at: string | Date;
      }>(
        `select id, display_name, city, email, updated_at
         from share_driver_presence
         where available = true
           and updated_at > now() - interval '30 minutes'
         order by updated_at desc
         limit 50`,
      );
      return {
        drivers: rows.map((r) => ({
          id: r.id,
          displayName: r.display_name,
          city: r.city,
          email: r.email ?? undefined,
          updatedAt:
            r.updated_at instanceof Date
              ? r.updated_at.toISOString()
              : String(r.updated_at),
        })),
      };
    } catch {
      const rows = await sql.query<{
        id: string;
        display_name: string;
        city: string;
        updated_at: string | Date;
      }>(
        `select id, display_name, city, updated_at
         from share_driver_presence
         where available = true
           and updated_at > now() - interval '30 minutes'
         order by updated_at desc
         limit 50`,
      );
      return {
        drivers: rows.map((r) => ({
          id: r.id,
          displayName: r.display_name,
          city: r.city,
          updatedAt:
            r.updated_at instanceof Date
              ? r.updated_at.toISOString()
              : String(r.updated_at),
        })),
      };
    }
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

export const listMarketplaceFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    const rentals = await sql.query<{
      id: string;
      title: string;
      description: string;
      category: string;
      rate: number;
      rate_unit: string;
      city: string;
      owner_name: string;
      deposit: number | null;
      available: boolean;
      photo: string | null;
      for_rent: boolean;
      for_sale: boolean;
      sale_price: number | null;
    }>(
      `select id, title, description, category, rate, rate_unit, city, owner_name, deposit, available, photo,
              coalesce(for_rent, true) as for_rent,
              coalesce(for_sale, false) as for_sale,
              sale_price
       from share_rentals where available = true order by created_at desc limit 100`,
    );
    const borrows = await sql.query<{
      id: string;
      title: string;
      description: string;
      category: string;
      offer: number;
      rate_unit: string;
      city: string;
      needed_by: string | Date | null;
      requester_name: string;
      status: string;
      created_at: string | Date;
      photo: string | null;
    }>(
      `select id, title, description, category, offer, rate_unit, city, needed_by, requester_name, status, created_at, photo
       from share_borrows where status = 'open' order by created_at desc limit 100`,
    );
    return {
      rentals: rentals.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        rate: Number(r.rate),
        rateUnit: r.rate_unit as "hour" | "day" | "weekend",
        city: r.city,
        ownerName: r.owner_name,
        deposit: r.deposit ?? undefined,
        available: r.available,
        photoUrl: r.photo || undefined,
        forRent: r.for_rent !== false,
        forSale: Boolean(r.for_sale),
        salePrice: r.sale_price != null ? Number(r.sale_price) : undefined,
      })),
      borrows: borrows.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        category: b.category,
        offer: Number(b.offer),
        rateUnit: b.rate_unit as "hour" | "day" | "weekend",
        city: b.city,
        neededBy: iso(b.needed_by) ?? new Date().toISOString(),
        requesterName: b.requester_name,
        status: (b.status === "matched" ? "matched" : "open") as "open" | "matched",
        createdAt: iso(b.created_at) ?? new Date().toISOString(),
        photoUrl: b.photo || undefined,
      })),
    };
  },
);

export const createRentalFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = uid("r");
    const forRent = data.forRent === false ? false : true;
    const forSale = Boolean(data.forSale);
    await sql`
      insert into share_rentals (
        id, title, description, category, rate, rate_unit, city,
        owner_name, owner_email, deposit, available, photo, created_at,
        for_rent, for_sale, sale_price
      ) values (
        ${id},
        ${String(data.title ?? "").trim()},
        ${String(data.description ?? "")},
        ${String(data.category ?? "other")},
        ${Number(data.rate ?? 0)},
        ${String(data.rateUnit ?? "day")},
        ${String(data.city ?? "Lafayette, LA")},
        ${String(data.ownerName ?? "Share member")},
        ${data.ownerEmail ? String(data.ownerEmail) : null},
        ${data.deposit != null ? Number(data.deposit) : null},
        ${true},
        ${String(data.photoUrl ?? data.photo ?? "")},
        ${new Date().toISOString()},
        ${forRent},
        ${forSale},
        ${forSale && data.salePrice != null ? Number(data.salePrice) : null}
      )
    `;
    return { id };
  });

export const createBorrowFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = uid("br");
    await sql`
      insert into share_borrows (
        id, title, description, category, offer, rate_unit, city,
        needed_by, requester_name, requester_email, status, photo, created_at
      ) values (
        ${id},
        ${String(data.title ?? "").trim()},
        ${String(data.description ?? "")},
        ${String(data.category ?? "other")},
        ${Number(data.offer ?? 0)},
        ${String(data.rateUnit ?? "day")},
        ${String(data.city ?? "Lafayette, LA")},
        ${data.neededBy ? String(data.neededBy) : null},
        ${String(data.requesterName ?? "Share member")},
        ${data.requesterEmail ? String(data.requesterEmail) : null},
        ${"open"},
        ${String(data.photoUrl ?? data.photo ?? "")},
        ${new Date().toISOString()}
      )
    `;
    return { id };
  });

export const createMarketplaceRequestFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = uid("mreq");
    await sql`
      insert into share_marketplace_requests (
        id, rental_id, kind, requester_name, requester_email, note,
        preferred_pickup, status, created_at
      ) values (
        ${id},
        ${String(data.rentalId ?? "")},
        ${String(data.kind ?? "rent")},
        ${String(data.requesterName ?? "Share member")},
        ${data.requesterEmail ? String(data.requesterEmail) : null},
        ${String(data.note ?? "")},
        ${data.preferredPickup ? String(data.preferredPickup) : null},
        ${"pending"},
        ${new Date().toISOString()}
      )
    `;
    return { id };
  });


async function ensureVolunteerExtras(sql: Awaited<ReturnType<typeof getSql>>) {
  try {
    await sql.query(
      `alter table share_volunteer_rides add column if not exists cancelled_at timestamptz`,
    );
  } catch (e) {
    console.warn("[schema] cancelled_at", e);
  }
}

export const listVolunteerRidesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    await ensureVolunteerExtras(sql);
    const rows = await sql.query<{
      id: string;
      category: string;
      full_name: string;
      phone: string;
      pickup: string;
      dropoff: string;
      when_text: string;
      notes: string;
      escalate_after_hours: number;
      paid_offer: number;
      requester_name: string;
      status: string;
      matched_driver_name: string | null;
      escalated_at: string | Date | null;
      cancelled_at: string | Date | null;
      created_at: string | Date;
    }>(
      `select * from share_volunteer_rides order by created_at desc limit 100`,
    );
    const rides: VolunteerRide[] = rows.map((r) => ({
      id: r.id,
      category: r.category as VolunteerCategory,
      fullName: r.full_name,
      phone: r.phone,
      pickup: r.pickup,
      dropoff: r.dropoff,
      when: r.when_text,
      notes: r.notes,
      escalateAfterHours: Number(r.escalate_after_hours),
      paidOffer: Number(r.paid_offer),
      requesterName: r.requester_name,
      status: r.status as VolunteerRide["status"],
      matchedDriverName: r.matched_driver_name ?? undefined,
      escalatedAt: iso(r.escalated_at),
      cancelledAt: iso(r.cancelled_at),
      createdAt: iso(r.created_at) ?? new Date().toISOString(),
    }));
    return { rides };
  },
);

export const createVolunteerRideFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = uid("vol");
    const createdAt = new Date().toISOString();
    const category = String(data.category ?? "elder");
    const fullName = String(data.fullName ?? "").trim();
    const phone = String(data.phone ?? "").trim();
    const pickup = String(data.pickup ?? "");
    const dropoff = String(data.dropoff ?? "");
    const when = String(data.when ?? "ASAP");
    const notes = String(data.notes ?? "");
    const paidOffer = Number(data.paidOffer ?? 12);

    await sql`
      insert into share_volunteer_rides (
        id, category, full_name, phone, pickup, dropoff, when_text, notes,
        escalate_after_hours, paid_offer, requester_name, status, created_at
      ) values (
        ${id},
        ${category},
        ${fullName},
        ${phone},
        ${pickup},
        ${dropoff},
        ${when},
        ${notes},
        ${Number(data.escalateAfterHours ?? 2)},
        ${paidOffer},
        ${String(data.requesterName ?? "Community")},
        ${"seeking_volunteer"},
        ${createdAt}
      )
    `;

    // Fire-and-forget founder alert (email + SMS). Never block the rider.
    void notifyFounderVolunteerRequest({
      id,
      category,
      fullName,
      phone,
      pickup,
      dropoff,
      when,
      notes,
      paidOffer,
    }).catch(() => {});

    return { id, createdAt };
  });

export const claimVolunteerRideFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; driverName: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const name = data.driverName.trim() || "Share driver";
    await sql`
      update share_volunteer_rides set
        status = ${"matched"},
        matched_driver_name = ${name}
      where id = ${data.id}
        and status in ('seeking_volunteer', 'escalated_paid')
    `;
    return { ok: true as const };
  });

export const updateVolunteerRideFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = String(data.id ?? "");
    if (!id) throw new Error("Missing id");
    await sql`
      update share_volunteer_rides set
        category = ${String(data.category ?? "elder")},
        full_name = ${String(data.fullName ?? "").trim()},
        phone = ${String(data.phone ?? "").trim()},
        pickup = ${String(data.pickup ?? "")},
        dropoff = ${String(data.dropoff ?? "")},
        when_text = ${String(data.when ?? "ASAP")},
        notes = ${String(data.notes ?? "")},
        escalate_after_hours = ${Number(data.escalateAfterHours ?? 2)},
        paid_offer = ${Number(data.paidOffer ?? 12)}
      where id = ${id}
        and status in ('seeking_volunteer', 'escalated_paid')
    `;
    return { ok: true as const };
  });

export const cancelVolunteerRideFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureVolunteerExtras(sql);
    const at = new Date().toISOString();
    // Guests/founders may cancel even after a driver matched
    const rows = await sql`
      update share_volunteer_rides set
        status = ${"cancelled"},
        cancelled_at = ${at}
      where id = ${data.id}
        and status in ('seeking_volunteer', 'escalated_paid', 'matched')
      returning id, category, full_name, phone, pickup, dropoff, when_text, notes, paid_offer
    `;
    const row = rows[0] as
      | {
          id: string;
          category: string;
          full_name: string;
          phone: string;
          pickup: string;
          dropoff: string;
          when_text: string;
          notes: string;
          paid_offer: number;
        }
      | undefined;
    if (row) {
      void notifyFounderVolunteerRequest({
        id: row.id,
        category: row.category,
        fullName: row.full_name,
        phone: row.phone,
        pickup: row.pickup,
        dropoff: row.dropoff,
        when: row.when_text,
        notes: row.notes || "",
        paidOffer: Number(row.paid_offer),
        kind: "cancel",
      }).catch(() => {});
    }
    return { ok: true as const, cancelledAt: at };
  });


/** Guest manage: find open/matched requests by phone (no account). */
export const lookupVolunteerByPhoneFn = createServerFn({ method: "POST" })
  .validator((data: { phone: string; fullName?: string }) => data)
  .handler(async ({ data }) => {
    const digits = String(data.phone ?? "").replace(/\D/g, "");
    if (digits.length < 10) return { rides: [] as VolunteerRide[] };
    const last10 = digits.slice(-10);
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      category: string;
      full_name: string;
      phone: string;
      pickup: string;
      dropoff: string;
      when_text: string;
      notes: string;
      escalate_after_hours: number;
      paid_offer: number;
      requester_name: string;
      status: string;
      matched_driver_name: string | null;
      escalated_at: string | Date | null;
      created_at: string | Date;
    }>(
      `select * from share_volunteer_rides
       where status in ('seeking_volunteer', 'escalated_paid', 'matched')
       order by created_at desc
       limit 150`,
    );
    let rides: VolunteerRide[] = rows
      .filter((r) => String(r.phone ?? "").replace(/\D/g, "").slice(-10) === last10)
      .map((r) => ({
        id: r.id,
        category: r.category as VolunteerCategory,
        fullName: r.full_name,
        phone: r.phone,
        pickup: r.pickup,
        dropoff: r.dropoff,
        when: r.when_text,
        notes: r.notes,
        escalateAfterHours: Number(r.escalate_after_hours),
        paidOffer: Number(r.paid_offer),
        requesterName: r.requester_name,
        status: r.status as VolunteerRide["status"],
        matchedDriverName: r.matched_driver_name ?? undefined,
        escalatedAt: iso(r.escalated_at),
        cancelledAt: iso((r as { cancelled_at?: string | Date | null }).cancelled_at),
        createdAt: iso(r.created_at) ?? new Date().toISOString(),
      }));
    const name = String(data.fullName ?? "").trim().toLowerCase();
    if (name.length >= 2) {
      rides = rides.filter((r) => {
        const fn = r.fullName.toLowerCase();
        return fn.includes(name) || name.includes(fn.split(/\s+/)[0] || "");
      });
    }
    return { rides };
  });

/** Founder: permanently remove a volunteer request from the database. */
export const founderDeleteVolunteerRideFn = createServerFn({ method: "POST" })
  .validator((data: { pin: string; id: string }) => data)
  .handler(async ({ data }) => {
    checkPin(data.pin);
    const sql = await getSql();
    await sql`delete from share_volunteer_rides where id = ${data.id}`;
    return { ok: true as const };
  });

export const escalateVolunteerRideFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const at = new Date().toISOString();
    await sql`
      update share_volunteer_rides set
        status = ${"escalated_paid"},
        escalated_at = ${at}
      where id = ${data.id} and status = 'seeking_volunteer'
    `;
    return { ok: true as const };
  });


/** After match, rider/driver edits trip details — reopen for a new accept. */
export const reopenVolunteerRideFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = String(data.id ?? "");
    if (!id) throw new Error("Missing id");
    await sql`
      update share_volunteer_rides set
        category = ${String(data.category ?? "elder")},
        full_name = ${String(data.fullName ?? "").trim()},
        phone = ${String(data.phone ?? "").trim()},
        pickup = ${String(data.pickup ?? "")},
        dropoff = ${String(data.dropoff ?? "")},
        when_text = ${String(data.when ?? "ASAP")},
        notes = ${String(data.notes ?? "")},
        escalate_after_hours = ${Number(data.escalateAfterHours ?? 2)},
        paid_offer = ${Number(data.paidOffer ?? 12)},
        status = ${"seeking_volunteer"},
        matched_driver_name = null
      where id = ${id}
        and status in ('matched', 'seeking_volunteer', 'escalated_paid')
    `;
    return { ok: true as const };
  });

export const completeVolunteerRideFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      update share_volunteer_rides set status = ${"completed"}
      where id = ${data.id}
        and status = 'matched'
    `;
    return { ok: true as const };
  });

/** Drivers/riders check their application status by email after approval. */
export const lookupMyAppsFn = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) return { drivers: [], riders: [] };
    const sql = await getSql();
    const drivers = await sql<DriverRow>`
      select * from share_driver_apps where lower(email) = ${email} order by created_at desc limit 5
    `;
    const riders = await sql<RiderRow>`
      select * from share_rider_apps where lower(email) = ${email} order by created_at desc limit 5
    `;
    return {
      drivers: drivers.map(mapDriver),
      riders: riders.map(mapRider),
    };
  });


/**
 * Push the member's current face photo to every driver/rider application
 * row for their email so other devices pick it up on refresh/sign-in.
 */
export const updateMyProfileSelfieFn = createServerFn({ method: "POST" })
  .validator((data: { email: string; selfie: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("Sign in required to save photo");
    const selfie = String(data.selfie ?? "");
    if (selfie && !selfie.startsWith("data:image/")) {
      throw new Error("Invalid photo data");
    }
    if (selfie.length > 400_000) {
      throw new Error("Photo too large — retake a closer selfie");
    }
    const sql = await getSql();
    const at = new Date().toISOString();
    await sql`
      update share_driver_apps set
        selfie = ${selfie},
        updated_at = ${at}
      where lower(email) = ${email}
    `;
    await sql`
      update share_rider_apps set
        selfie = ${selfie},
        updated_at = ${at}
      where lower(email) = ${email}
    `;
    return { ok: true as const };
  });

/** Founder: list sign-up accounts (Better Auth "user" table). */
export const listAuthUsersFn = createServerFn({ method: "POST" })
  .validator((data: { pin: string }) => data)
  .handler(async ({ data }) => {
    checkPin(data.pin);
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      name: string;
      email: string;
      createdAt: string | Date;
    }>(
      `select id, name, email, "createdAt" from "user" order by "createdAt" desc limit 200`,
    );
    return {
      users: rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt),
      })),
    };
  });

/** Founder: set a temporary password for an account (email/password credential). */
export const founderResetPasswordFn = createServerFn({ method: "POST" })
  .validator(
    (data: { pin: string; email: string; newPassword: string }) => data,
  )
  .handler(async ({ data }) => {
    checkPin(data.pin);
    const email = data.email.trim().toLowerCase();
    const newPassword = data.newPassword;
    if (!email.includes("@") || newPassword.length < 8) {
      throw new Error("Valid email and password (8+ chars) required");
    }
    const { hashPassword } = await import("better-auth/crypto");
    const sql = await getSql();
    const users = await sql<{ id: string }>`
      select id from "user" where lower(email) = ${email} limit 1
    `;
    if (!users.length) {
      throw new Error("No account with that email");
    }
    const userId = users[0].id;
    const hashed = await hashPassword(newPassword);
    const accounts = await sql<{ id: string }>`
      select id from "account" where "userId" = ${userId} and "providerId" = ${"credential"} limit 1
    `;
    const now = new Date().toISOString();
    if (accounts.length) {
      await sql`
        update "account" set password = ${hashed}, "updatedAt" = ${now} where id = ${accounts[0].id}
      `;
    } else {
      const id = uid("acc");
      await sql`
        insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
        values (${id}, ${userId}, ${"credential"}, ${userId}, ${hashed}, ${now}, ${now})
      `;
    }
    return { ok: true as const, email };
  });

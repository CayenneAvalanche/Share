import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type {
  ApplicationStatus,
  CarShareListing,
  ChatMessage,
  ChatThread,
  DriverApplication,
  DriverGender,
  InterviewMode,
  RiderApplication,
  Trip,
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
  vehicle_photo?: string;
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
    vehiclePhoto: r.vehicle_photo || undefined,
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


async function notifyFounderApplication(payload: {
  kind: "rider" | "driver";
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  extra?: string;
}) {
  const emailTo =
    process.env.FOUNDER_NOTIFY_EMAIL?.trim() || FOUNDER_NOTIFY_EMAIL_DEFAULT;
  const phones = [
    process.env.FOUNDER_NOTIFY_PHONE?.trim() || FOUNDER_NOTIFY_PHONE_DEFAULT,
    process.env.FOUNDER_NOTIFY_PHONE_2?.trim() || "",
  ].filter(Boolean);

  const label = payload.kind === "rider" ? "RIDER" : "DRIVER";
  const subject = `📝 Share ${label} application: ${payload.fullName}`;
  const textBody = [
    `NEW ${label} APPLICATION`,
    `ID: ${payload.id}`,
    `Name: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    payload.city ? `City: ${payload.city}` : "",
    payload.extra ? payload.extra : "",
    `Open founder inbox: https://share.myendeavors.me/admin`,
  ]
    .filter(Boolean)
    .join("\n");

  const smsBody =
    `Share ${label} app: ${payload.fullName} · ${payload.phone} · ${payload.email}. Review in founder inbox.`.slice(
      0,
      320,
    );

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
        console.error("[notify-app] Resend failed", res.status, await res.text());
      }
    } catch (e) {
      console.error("[notify-app] Resend error", e);
    }
  } else {
    console.warn("[notify-app] RESEND_API_KEY not set — skipping email");
  }

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
              Body: smsBody,
            }),
          },
        );
        if (!res.ok) {
          console.error(
            "[notify-app] Twilio SMS failed",
            phoneTo,
            res.status,
            await res.text(),
          );
        }
      } catch (e) {
        console.error("[notify-app] Twilio SMS error", phoneTo, e);
      }
    }
  } else {
    console.warn("[notify-app] Twilio env incomplete — skipping SMS");
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
    void notifyFounderApplication({
      kind: "driver",
      id,
      fullName: String(data.fullName ?? "").trim(),
      email: String(data.email ?? "").trim().toLowerCase(),
      phone: String(data.phone ?? "").trim(),
      city: String(data.city ?? ""),
      extra: data.vehicle ? `Vehicle: ${String(data.vehicle)}` : undefined,
    }).catch(() => {});
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
    void notifyFounderApplication({
      kind: "rider",
      id,
      fullName: String(data.fullName ?? "").trim(),
      email: String(data.email ?? "").trim().toLowerCase(),
      phone: String(data.phone ?? "").trim(),
      city: String(data.city ?? ""),
      extra: data.typicalRoutes
        ? `Routes: ${String(data.typicalRoutes)}`
        : undefined,
    }).catch(() => {});
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
      `select id from (
         select distinct on (coalesce(nullif(lower(trim(email)), ''), id)) id
         from share_driver_presence
         where available = true
           and updated_at > now() - interval '12 minutes'
         order by coalesce(nullif(lower(trim(email)), ''), id), updated_at desc
       ) t`,
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

/** Count unique online drivers (dedupe by email; stale rows ignored). */
async function countFreshDrivers(
  sql: Awaited<ReturnType<typeof getSql>>,
): Promise<number> {
  // Mark stale rows offline so counts don't balloon after refresh spam
  try {
    await sql.query(
      `update share_driver_presence
       set available = false
       where available = true
         and updated_at < now() - interval '12 minutes'`,
    );
  } catch {
    /* ignore */
  }
  try {
    const rows = await sql.query<{ c: number }>(
      `select count(*)::int as c from (
         select distinct on (coalesce(nullif(lower(trim(email)), ''), id)) id
         from share_driver_presence
         where available = true
           and updated_at > now() - interval '12 minutes'
         order by coalesce(nullif(lower(trim(email)), ''), id), updated_at desc
       ) t`,
    );
    return Number(rows[0]?.c ?? 0);
  } catch {
    const rows = await sql.query<{ c: number }>(
      `select count(*)::int as c from share_driver_presence
       where available = true
         and updated_at > now() - interval '12 minutes'`,
    );
    return Number(rows[0]?.c ?? 0);
  }
}

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

    // One presence row per email — reuse existing so refresh doesn't mint ghosts
    let id = data.presenceId?.trim() || "";
    if (email) {
      try {
        const existing = await sql<{ id: string }>`
          select id from share_driver_presence
          where lower(email) = ${email}
          order by updated_at desc
          limit 1
        `;
        if (existing[0]?.id) id = existing[0].id;
      } catch {
        /* email column may be missing */
      }
    }
    if (!id) id = uid("pr");

    const now = new Date().toISOString();
    const name = data.displayName.trim() || "Driver";
    const city = data.city ?? "Lafayette, LA";

    try {
      await sql`
        insert into share_driver_presence (id, display_name, city, available, email, updated_at)
        values (
          ${id},
          ${name},
          ${city},
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
      // Drop duplicate rows for same email (old refresh ghosts)
      if (email) {
        await sql`
          delete from share_driver_presence
          where lower(email) = ${email}
            and id <> ${id}
        `;
      }
    } catch {
      await sql`
        insert into share_driver_presence (id, display_name, city, available, updated_at)
        values (
          ${id},
          ${name},
          ${city},
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

    const availableCount = await countFreshDrivers(sql);
    return {
      presenceId: id,
      availableCount,
      available: data.available,
    };
  });

/** Restore online status after page refresh (by email). */
export const getMyDriverPresenceFn = createServerFn({ method: "POST" })
  .validator((data: { email?: string; presenceId?: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const email = data.email?.trim().toLowerCase() || null;
    const presenceId = data.presenceId?.trim() || null;
    try {
      if (email) {
        const rows = await sql<{
          id: string;
          available: boolean;
          updated_at: string | Date;
        }>`
          select id, available, updated_at from share_driver_presence
          where lower(email) = ${email}
          order by updated_at desc
          limit 1
        `;
        const r = rows[0];
        if (r) {
          const updated =
            r.updated_at instanceof Date
              ? r.updated_at.toISOString()
              : String(r.updated_at);
          const fresh =
            Date.now() - new Date(updated).getTime() < 12 * 60 * 1000;
          return {
            presenceId: r.id,
            available: Boolean(r.available) && fresh,
            availableCount: await countFreshDrivers(sql),
          };
        }
      }
      if (presenceId) {
        const rows = await sql<{
          id: string;
          available: boolean;
          updated_at: string | Date;
        }>`
          select id, available, updated_at from share_driver_presence
          where id = ${presenceId}
          limit 1
        `;
        const r = rows[0];
        if (r) {
          const updated =
            r.updated_at instanceof Date
              ? r.updated_at.toISOString()
              : String(r.updated_at);
          const fresh =
            Date.now() - new Date(updated).getTime() < 12 * 60 * 1000;
          return {
            presenceId: r.id,
            available: Boolean(r.available) && fresh,
            availableCount: await countFreshDrivers(sql),
          };
        }
      }
    } catch {
      /* ignore */
    }
    return {
      presenceId: presenceId || undefined,
      available: false,
      availableCount: await countFreshDrivers(sql),
    };
  });

export const countAvailableDriversFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const sql = await getSql();
  return { availableCount: await countFreshDrivers(sql) };
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
        `select distinct on (coalesce(nullif(lower(trim(email)), ''), id))
            id, display_name, city, email, updated_at
         from share_driver_presence
         where available = true
           and updated_at > now() - interval '12 minutes'
         order by coalesce(nullif(lower(trim(email)), ''), id), updated_at desc
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
           and updated_at > now() - interval '12 minutes'
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
  for (const col of [
    "cancelled_at timestamptz",
    "cancelled_by text",
    "cancelled_by_name text",
    "completed_at timestamptz",
    "trip_started_at timestamptz",
    "trip_ended_at timestamptz",
    "matched_driver_email text",
    "rider_rating int",
    "rider_review text",
    "rated_at timestamptz",
  ]) {
    try {
      await sql.query(
        `alter table share_volunteer_rides add column if not exists ${col}`,
      );
    } catch (e) {
      console.warn("[schema]", col, e);
    }
  }
}

function last10Digits(phone?: string | null): string {
  return String(phone ?? "").replace(/\D/g, "").slice(-10);
}

function mapVolunteerRow(r: {
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
  matched_driver_email?: string | null;
  escalated_at: string | Date | null;
  cancelled_at: string | Date | null;
  cancelled_by?: string | null;
  cancelled_by_name?: string | null;
  completed_at?: string | Date | null;
  trip_started_at: string | Date | null;
  trip_ended_at: string | Date | null;
  created_at: string | Date;
  rider_rating?: number | null;
  rider_review?: string | null;
  rated_at?: string | Date | null;
}): VolunteerRide {
  const by = (r.cancelled_by || "").toLowerCase();
  const cancelledBy =
    by === "rider" || by === "driver" || by === "admin" || by === "system"
      ? (by as VolunteerRide["cancelledBy"])
      : undefined;
  return {
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
    cancelledBy,
    cancelledByName: r.cancelled_by_name ?? undefined,
    completedAt: iso(r.completed_at ?? null),
    tripStartedAt: iso(r.trip_started_at),
    tripEndedAt: iso(r.trip_ended_at),
    createdAt: iso(r.created_at) ?? new Date().toISOString(),
    riderRating:
      r.rider_rating != null &&
      Number(r.rider_rating) >= 1 &&
      Number(r.rider_rating) <= 5
        ? Number(r.rider_rating)
        : undefined,
    riderReview: (r.rider_review && String(r.rider_review).trim()) || undefined,
    ratedAt: iso(r.rated_at ?? null),
  };
}


async function ensureTripsAndCars(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql`
    create table if not exists share_trips (
      id text primary key,
      type text not null default 'ride',
      from_place text not null,
      to_place text not null,
      from_short text not null default '',
      to_short text not null default '',
      depart_at timestamptz not null,
      arrive_at timestamptz not null,
      seats_available integer not null default 1,
      seats_total integer not null default 1,
      cargo_capacity text not null default '',
      price_per_seat integer not null default 0,
      delivery_rate integer not null default 0,
      stops_json text not null default '[]',
      schedule text not null default 'moderate',
      notes text not null default '',
      driver_id text not null default 'member',
      distance_miles integer not null default 0,
      duration_hours real not null default 0,
      vehicle_photo text,
      vehicle_type text,
      vehicle_label text,
      posted_by_email text,
      posted_by_name text,
      driver_selfie text,
      created_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists share_car_listings (
      id text primary key,
      make_model text not null,
      year integer not null default 2020,
      seats integer not null default 5,
      transmission text not null default 'auto',
      rate_per_day integer not null default 45,
      deposit integer not null default 200,
      city text not null default 'Lafayette, LA',
      owner_name text not null default '',
      owner_email text,
      has_dashcam boolean not null default true,
      insurance_note text not null default '',
      rules text not null default '',
      available boolean not null default true,
      trips_hosted integer not null default 0,
      rating real not null default 5,
      photo_url text,
      created_at timestamptz not null default now()
    )
  `;
}

function mapTripRow(r: Record<string, unknown>): Trip {
  let stops: string[] = [];
  try {
    stops = JSON.parse(String(r.stops_json || "[]"));
    if (!Array.isArray(stops)) stops = [];
  } catch {
    stops = [];
  }
  return {
    id: String(r.id),
    type: (r.type === "delivery" ? "delivery" : "ride") as Trip["type"],
    from: String(r.from_place ?? ""),
    to: String(r.to_place ?? ""),
    fromShort: String(r.from_short ?? ""),
    toShort: String(r.to_short ?? ""),
    departAt: iso(r.depart_at as string | Date | null) ?? new Date().toISOString(),
    arriveAt: iso(r.arrive_at as string | Date | null) ?? new Date().toISOString(),
    seatsAvailable: Number(r.seats_available ?? 1),
    seatsTotal: Number(r.seats_total ?? 1),
    cargoCapacity: String(r.cargo_capacity ?? ""),
    pricePerSeat: Number(r.price_per_seat ?? 0),
    deliveryRate: Number(r.delivery_rate ?? 0),
    stops,
    schedule: (String(r.schedule || "moderate") as Trip["schedule"]),
    notes: String(r.notes ?? ""),
    driverId: String(r.driver_id ?? "member"),
    distanceMiles: Number(r.distance_miles ?? 0),
    durationHours: Number(r.duration_hours ?? 0),
    vehiclePhoto: r.vehicle_photo ? String(r.vehicle_photo) : undefined,
    vehicleType: r.vehicle_type ? String(r.vehicle_type) : undefined,
    vehicleLabel: r.vehicle_label ? String(r.vehicle_label) : undefined,
    postedByEmail: r.posted_by_email ? String(r.posted_by_email) : undefined,
    postedByName: r.posted_by_name ? String(r.posted_by_name) : undefined,
    driverSelfie: r.driver_selfie ? String(r.driver_selfie) : undefined,
  };
}

function mapCarRow(r: Record<string, unknown>): CarShareListing {
  return {
    id: String(r.id),
    makeModel: String(r.make_model ?? ""),
    year: Number(r.year ?? 2020),
    seats: Number(r.seats ?? 5),
    transmission: r.transmission === "manual" ? "manual" : "auto",
    ratePerDay: Number(r.rate_per_day ?? 0),
    deposit: Number(r.deposit ?? 0),
    city: String(r.city ?? "Lafayette, LA"),
    ownerName: String(r.owner_name ?? ""),
    ownerId: r.owner_email ? String(r.owner_email) : undefined,
    hasDashcam: Boolean(r.has_dashcam),
    insuranceNote: String(r.insurance_note ?? ""),
    rules: String(r.rules ?? ""),
    available: r.available !== false,
    tripsHosted: Number(r.trips_hosted ?? 0),
    rating: Number(r.rating ?? 5),
    photoUrl: r.photo_url ? String(r.photo_url) : undefined,
  };
}

/**
 * Attach rider application profile to volunteer rides (by phone last-10).
 * When rider is approved/active: show full legal/app name + selfie on the trip.
 */
async function attachRiderFaces(
  sql: Awaited<ReturnType<typeof getSql>>,
  rides: VolunteerRide[],
): Promise<VolunteerRide[]> {
  if (!rides.length) return rides;
  try {
    const rows = await sql.query<{
      phone: string;
      selfie: string | null;
      status: string;
      full_name: string;
    }>(
      `select phone, selfie, status, full_name from share_rider_apps
       order by created_at desc limit 400`,
    );
    const byPhone = new Map<
      string,
      { selfie: string; status: ApplicationStatus; name: string }
    >();
    for (const row of rows) {
      const p = last10Digits(row.phone);
      if (p.length < 10) continue;
      if (byPhone.has(p)) continue; // newest first
      byPhone.set(p, {
        selfie: String(row.selfie || ""),
        status: row.status as ApplicationStatus,
        name: String(row.full_name || "").trim(),
      });
    }
    return rides.map((ride) => {
      const hit = byPhone.get(last10Digits(ride.phone));
      if (!hit) {
        return { ...ride, riderAppStatus: "none" as const };
      }
      const approved =
        hit.status === "active" || hit.status === "approved";
      // Once active: prefer full name from rider application (not abbreviated trip name)
      const fullFromApp =
        approved && hit.name.length >= 2 ? hit.name : undefined;
      return {
        ...ride,
        fullName: fullFromApp || ride.fullName,
        requesterName: fullFromApp || ride.requesterName,
        riderSelfie:
          approved && hit.selfie && hit.selfie.length > 20
            ? hit.selfie
            : undefined,
        riderAppStatus: hit.status,
        riderLegalName: fullFromApp || undefined,
      };
    });
  } catch {
    return rides;
  }
}

/**
 * Privacy-scoped volunteer list.
 * - Founder pin → full board
 * - Approved driver → open requests + only THEIR matched/completed/cancelled
 * - Rider (phone) → only rides with that phone
 * - Everyone else → empty (no public peeking)
 */
export const listVolunteerRidesFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      email?: string;
      phone?: string;
      driverName?: string;
      /** Founder inbox full board */
      pin?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureVolunteerExtras(sql);

    let founder = false;
    if (data.pin) {
      try {
        checkPin(data.pin);
        founder = true;
      } catch {
        founder = false;
      }
    }

    const email = data.email?.trim().toLowerCase() || "";
    let isDriver = false;
    if (email) {
      try {
        const apps = await sql<{ status: string }>`
          select status from share_driver_apps
          where lower(email) = ${email}
            and status in ('active', 'approved')
          limit 1
        `;
        isDriver = apps.length > 0;
      } catch {
        isDriver = false;
      }
    }

    const phone10 = last10Digits(data.phone);
    const driverName = (data.driverName || "").trim().toLowerCase();
    const driverFirst = driverName.split(/\s+/)[0] || "";

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
      matched_driver_email: string | null;
      escalated_at: string | Date | null;
      cancelled_at: string | Date | null;
      trip_started_at: string | Date | null;
      trip_ended_at: string | Date | null;
      created_at: string | Date;
    }>(
      `select * from share_volunteer_rides order by created_at desc limit 150`,
    );

    if (founder) {
      const mapped = rows.map(mapVolunteerRow);
      return {
        rides: await attachRiderFaces(sql, mapped),
        scope: "founder" as const,
      };
    }

    const rides = rows.filter((r) => {
      const status = r.status;
      const open =
        status === "seeking_volunteer" || status === "escalated_paid";
      const minePhone =
        phone10.length >= 10 && last10Digits(r.phone) === phone10;

      // Rider / booker: only own trips (by phone)
      if (minePhone) return true;

      if (!isDriver) return false;

      // Drivers: open board for claiming
      if (open) return true;

      // Drivers: only trips they matched
      const matchedEmail = (r.matched_driver_email || "").toLowerCase();
      if (email && matchedEmail && matchedEmail === email) return true;

      const matchedName = (r.matched_driver_name || "").toLowerCase();
      if (driverName && matchedName) {
        if (matchedName === driverName) return true;
        if (driverFirst.length >= 3 && matchedName.includes(driverFirst)) {
          return true;
        }
      }
      return false;
    });

    const mapped = rides.map(mapVolunteerRow);
    return {
      rides: await attachRiderFaces(sql, mapped),
      scope: isDriver ? ("driver" as const) : ("self" as const),
    };
  });

/**
 * Single volunteer ride by id — founder pin, matching driver/rider, or open board.
 * Used by the trip detail page so completed rides open reliably from Founder inbox.
 */
export const getVolunteerRideFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      pin?: string;
      email?: string;
      phone?: string;
      driverName?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const id = String(data.id || "").trim();
    if (!id) return { ride: null as VolunteerRide | null, scope: "none" as const };

    const sql = await getSql();
    await ensureVolunteerExtras(sql);

    let founder = false;
    if (data.pin) {
      try {
        checkPin(data.pin);
        founder = true;
      } catch {
        founder = false;
      }
    }

    const rowList = await sql`
      select * from share_volunteer_rides where id = ${id} limit 1
    `;
    const row = (rowList[0] || null) as {
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
      matched_driver_email: string | null;
      escalated_at: string | Date | null;
      cancelled_at: string | Date | null;
      cancelled_by: string | null;
      cancelled_by_name: string | null;
      completed_at: string | Date | null;
      trip_started_at: string | Date | null;
      trip_ended_at: string | Date | null;
      created_at: string | Date;
      rider_rating: number | null;
      rider_review: string | null;
      rated_at: string | Date | null;
    } | null;
    if (!row) return { ride: null as VolunteerRide | null, scope: "none" as const };

    const mapped = mapVolunteerRow(row);
    const [enriched] = await attachRiderFaces(sql, [mapped]);

    if (founder) {
      return { ride: enriched, scope: "founder" as const };
    }

    const email = data.email?.trim().toLowerCase() || "";
    const phone10 = last10Digits(data.phone);
    const driverName = (data.driverName || "").trim().toLowerCase();
    const driverFirst = driverName.split(/\s+/)[0] || "";
    const status = row.status;
    const open =
      status === "seeking_volunteer" || status === "escalated_paid";
    const minePhone =
      phone10.length >= 10 && last10Digits(row.phone) === phone10;
    if (minePhone) return { ride: enriched, scope: "self" as const };

    let isDriver = false;
    if (email) {
      try {
        const apps = await sql<{ status: string }>`
          select status from share_driver_apps
          where lower(email) = ${email}
            and status in ('active', 'approved')
          limit 1
        `;
        isDriver = apps.length > 0;
      } catch {
        isDriver = false;
      }
    }
    if (isDriver && open) {
      return { ride: enriched, scope: "driver" as const };
    }
    const matchedEmail = (row.matched_driver_email || "").toLowerCase();
    if (email && matchedEmail && matchedEmail === email) {
      return { ride: enriched, scope: "driver" as const };
    }
    const matchedName = (row.matched_driver_name || "").toLowerCase();
    if (driverName && matchedName) {
      if (matchedName === driverName) {
        return { ride: enriched, scope: "driver" as const };
      }
      if (driverFirst.length >= 3 && matchedName.includes(driverFirst)) {
        return { ride: enriched, scope: "driver" as const };
      }
    }
    // Deny: don't leak others' completed rides
    return { ride: null as VolunteerRide | null, scope: "denied" as const };
  });

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
  .validator(
    (data: { id: string; driverName: string; driverEmail?: string }) => data,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureVolunteerExtras(sql);
    const name = data.driverName.trim() || "Share driver";
    const email = data.driverEmail?.trim().toLowerCase() || null;
    try {
      await sql`
        update share_volunteer_rides set
          status = ${"matched"},
          matched_driver_name = ${name},
          matched_driver_email = ${email}
        where id = ${data.id}
          and status in ('seeking_volunteer', 'escalated_paid')
      `;
    } catch {
      await sql`
        update share_volunteer_rides set
          status = ${"matched"},
          matched_driver_name = ${name}
        where id = ${data.id}
          and status in ('seeking_volunteer', 'escalated_paid')
      `;
    }
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
  .validator(
    (data: {
      id: string;
      cancelledBy?: "rider" | "driver" | "admin" | "system";
      cancelledByName?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureVolunteerExtras(sql);
    const at = new Date().toISOString();
    const who = data.cancelledBy || "system";
    const whoName = (data.cancelledByName || who).trim() || who;
    // Guests/founders/drivers may cancel even after a driver matched
    let rows: unknown[];
    try {
      rows = await sql`
        update share_volunteer_rides set
          status = ${"cancelled"},
          cancelled_at = ${at},
          cancelled_by = ${who},
          cancelled_by_name = ${whoName}
        where id = ${data.id}
          and status in ('seeking_volunteer', 'escalated_paid', 'matched')
        returning id, category, full_name, phone, pickup, dropoff, when_text, notes, paid_offer
      `;
    } catch {
      rows = await sql`
        update share_volunteer_rides set
          status = ${"cancelled"},
          cancelled_at = ${at}
        where id = ${data.id}
          and status in ('seeking_volunteer', 'escalated_paid', 'matched')
        returning id, category, full_name, phone, pickup, dropoff, when_text, notes, paid_offer
      `;
    }
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
    return {
      ok: true as const,
      cancelledAt: at,
      cancelledBy: who,
      cancelledByName: whoName,
    };
  });

/** Founder: undo a mistaken cancel — restore open or matched. */
export const restoreVolunteerRideFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      pin: string;
      id: string;
      /** matched if they had a driver; else seeking */
      as?: "matched" | "seeking_volunteer";
    }) => data,
  )
  .handler(async ({ data }) => {
    checkPin(data.pin);
    const sql = await getSql();
    await ensureVolunteerExtras(sql);
    const id = data.id;
    // Peek matched driver name before restore
    const prev = await sql<{
      matched_driver_name: string | null;
      status: string;
    }>`
      select matched_driver_name, status from share_volunteer_rides
      where id = ${id}
      limit 1
    `;
    const row = prev[0];
    if (!row) throw new Error("Ride not found");
    if (row.status !== "cancelled") {
      throw new Error("Only cancelled rides can be restored");
    }
    const nextStatus =
      data.as ||
      (row.matched_driver_name ? "matched" : "seeking_volunteer");
    try {
      await sql`
        update share_volunteer_rides set
          status = ${nextStatus},
          cancelled_at = null,
          cancelled_by = null,
          cancelled_by_name = null
        where id = ${id}
          and status = ${"cancelled"}
      `;
    } catch {
      await sql`
        update share_volunteer_rides set
          status = ${nextStatus},
          cancelled_at = null
        where id = ${id}
          and status = ${"cancelled"}
      `;
    }
    return { ok: true as const, status: nextStatus };
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
    await ensureVolunteerExtras(sql);
    const at = new Date().toISOString();
    try {
      await sql`
        update share_volunteer_rides set
          status = ${"completed"},
          completed_at = ${at}
        where id = ${data.id}
          and status = ${"matched"}
      `;
    } catch {
      await sql`
        update share_volunteer_rides set status = ${"completed"}
        where id = ${data.id}
          and status = ${"matched"}
      `;
    }
    return { ok: true as const, completedAt: at };
  });

/** Rider rates driver after trip is completed. */
export const submitVolunteerReviewFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      rating: number;
      review?: string;
      reviewerName?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureVolunteerExtras(sql);
    const id = String(data.id ?? "");
    const rating = Math.round(Number(data.rating));
    if (!id) throw new Error("Missing ride id");
    if (rating < 1 || rating > 5) throw new Error("Rating must be 1–5 stars");
    const review = String(data.review ?? "").trim().slice(0, 1000);
    const at = new Date().toISOString();
    await sql`
      update share_volunteer_rides set
        rider_rating = ${rating},
        rider_review = ${review || null},
        rated_at = ${at}
      where id = ${id}
        and status = ${"completed"}
    `;
    return { ok: true as const, ratedAt: at, rating, review };
  });


export const beginVolunteerTripFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureVolunteerExtras(sql);
    const at = new Date().toISOString();
    await sql`
      update share_volunteer_rides set
        trip_started_at = ${at},
        trip_ended_at = null
      where id = ${data.id}
        and status = 'matched'
    `;
    return { ok: true as const, tripStartedAt: at };
  });

export const endVolunteerTripFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureVolunteerExtras(sql);
    const at = new Date().toISOString();
    await sql`
      update share_volunteer_rides set
        trip_ended_at = ${at}
      where id = ${data.id}
        and status = 'matched'
    `;
    return { ok: true as const, tripEndedAt: at };
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


async function ensureUserVehiclesTable(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql`
    create table if not exists share_user_vehicles (
      id text primary key,
      email text not null,
      label text not null,
      vehicle_type text not null default 'Other',
      license_plate text not null default '',
      photo_url text not null default '',
      is_default boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  try {
    await sql.query(
      `create index if not exists share_user_vehicles_email_idx on share_user_vehicles (lower(email))`,
    );
  } catch {
    /* ignore */
  }
  try {
    await sql.query(
      `alter table share_driver_apps add column if not exists vehicle_photo text not null default ''`,
    );
  } catch {
    /* ignore */
  }
}

/**
 * Full replace of the signed-in user's garage — photos included.
 * Keeps default vehicle_photo on driver apps in sync for HQ.
 */
export const syncMyVehiclesFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      email: string;
      vehicles: Array<{
        id: string;
        label: string;
        vehicleType?: string;
        licensePlate?: string;
        photoUrl?: string;
        isDefault?: boolean;
        createdAt?: string;
      }>;
    }) => data,
  )
  .handler(async ({ data }) => {
    const email = String(data.email ?? "").trim().toLowerCase();
    if (!email.includes("@")) throw new Error("Sign in required to sync vehicles");
    const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
    if (vehicles.length > 12) throw new Error("Too many vehicles (max 12)");
    const sql = await getSql();
    await ensureUserVehiclesTable(sql);
    const at = new Date().toISOString();

    // Wipe + rewrite (simple source of truth per account)
    await sql`delete from share_user_vehicles where lower(email) = ${email}`;

    for (const v of vehicles) {
      const id = String(v.id || "").trim();
      const label = String(v.label || "").trim();
      if (!id || !label) continue;
      let photo = String(v.photoUrl || "");
      if (photo && !photo.startsWith("data:image/") && !photo.startsWith("http")) {
        photo = "";
      }
      if (photo.length > 450_000) {
        throw new Error("Vehicle photo too large — retake a bit farther out");
      }
      const created = v.createdAt || at;
      await sql`
        insert into share_user_vehicles (
          id, email, label, vehicle_type, license_plate, photo_url, is_default, created_at, updated_at
        ) values (
          ${id},
          ${email},
          ${label},
          ${String(v.vehicleType || "Other")},
          ${String(v.licensePlate || "")},
          ${photo},
          ${Boolean(v.isDefault)},
          ${created},
          ${at}
        )
      `;
    }

    // Mirror default car onto latest driver application rows
    const def =
      vehicles.find((x) => x.isDefault) || vehicles[0] || null;
    if (def) {
      const photo = String(def.photoUrl || "");
      try {
        await sql`
          update share_driver_apps set
            vehicle = ${String(def.label || "")},
            license_plate = ${String(def.licensePlate || "")},
            vehicle_photo = ${photo},
            updated_at = ${at}
          where lower(email) = ${email}
        `;
      } catch {
        await sql`
          update share_driver_apps set
            vehicle = ${String(def.label || "")},
            license_plate = ${String(def.licensePlate || "")},
            updated_at = ${at}
          where lower(email) = ${email}
        `;
      }
    }

    return { ok: true as const, count: vehicles.length };
  });

export const listMyVehiclesFn = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = String(data.email ?? "").trim().toLowerCase();
    if (!email.includes("@")) return { vehicles: [] as const };
    const sql = await getSql();
    await ensureUserVehiclesTable(sql);
    const rows = await sql<{
      id: string;
      label: string;
      vehicle_type: string;
      license_plate: string;
      photo_url: string;
      is_default: boolean;
      created_at: string | Date;
    }>`
      select * from share_user_vehicles
      where lower(email) = ${email}
      order by is_default desc, created_at desc
      limit 12
    `;
    return {
      vehicles: rows.map((r) => ({
        id: r.id,
        label: r.label,
        vehicleType: r.vehicle_type || "Other",
        licensePlate: r.license_plate || undefined,
        photoUrl: r.photo_url || undefined,
        isDefault: Boolean(r.is_default),
        createdAt: iso(r.created_at) ?? new Date().toISOString(),
      })),
    };
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


/* ─── Corridor trips (cloud) ─── */

export const listTripsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    await ensureTripsAndCars(sql);
    const rows = await sql`
      select * from share_trips
      where depart_at > now() - interval '2 days'
      order by depart_at asc
      limit 200
    `;
    return { trips: (rows as Record<string, unknown>[]).map(mapTripRow) };
  },
);

export const createTripFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureTripsAndCars(sql);
    const id =
      String(data.id ?? "").trim() || uid("user");
    const stops = Array.isArray(data.stops)
      ? data.stops
      : typeof data.stops === "string"
        ? String(data.stops)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    await sql`
      insert into share_trips (
        id, type, from_place, to_place, from_short, to_short,
        depart_at, arrive_at, seats_available, seats_total, cargo_capacity,
        price_per_seat, delivery_rate, stops_json, schedule, notes,
        driver_id, distance_miles, duration_hours, vehicle_photo,
        vehicle_type, vehicle_label, posted_by_email, posted_by_name,
        driver_selfie, created_at
      ) values (
        ${id},
        ${String(data.type ?? "ride")},
        ${String(data.from ?? "").trim()},
        ${String(data.to ?? "").trim()},
        ${String(data.fromShort ?? "")},
        ${String(data.toShort ?? "")},
        ${String(data.departAt ?? new Date().toISOString())},
        ${String(data.arriveAt ?? new Date().toISOString())},
        ${Number(data.seatsAvailable ?? data.seatsTotal ?? 1)},
        ${Number(data.seatsTotal ?? 1)},
        ${String(data.cargoCapacity ?? "")},
        ${Number(data.pricePerSeat ?? 0)},
        ${Number(data.deliveryRate ?? 0)},
        ${JSON.stringify(stops)},
        ${String(data.schedule ?? "moderate")},
        ${String(data.notes ?? "")},
        ${String(data.driverId ?? "member")},
        ${Number(data.distanceMiles ?? 0)},
        ${Number(data.durationHours ?? 0)},
        ${data.vehiclePhoto ? String(data.vehiclePhoto) : null},
        ${data.vehicleType ? String(data.vehicleType) : null},
        ${data.vehicleLabel ? String(data.vehicleLabel) : null},
        ${data.postedByEmail ? String(data.postedByEmail).toLowerCase() : null},
        ${data.postedByName ? String(data.postedByName) : null},
        ${data.driverSelfie ? String(data.driverSelfie) : null},
        ${new Date().toISOString()}
      )
      on conflict (id) do update set
        from_place = excluded.from_place,
        to_place = excluded.to_place,
        from_short = excluded.from_short,
        to_short = excluded.to_short,
        depart_at = excluded.depart_at,
        arrive_at = excluded.arrive_at,
        seats_available = excluded.seats_available,
        seats_total = excluded.seats_total,
        cargo_capacity = excluded.cargo_capacity,
        price_per_seat = excluded.price_per_seat,
        delivery_rate = excluded.delivery_rate,
        stops_json = excluded.stops_json,
        schedule = excluded.schedule,
        notes = excluded.notes,
        vehicle_photo = excluded.vehicle_photo,
        vehicle_type = excluded.vehicle_type,
        vehicle_label = excluded.vehicle_label,
        driver_selfie = excluded.driver_selfie
    `;
    return { id, ok: true as const };
  });

export const deleteTripFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; email?: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureTripsAndCars(sql);
    await sql`delete from share_trips where id = ${data.id}`;
    return { ok: true as const };
  });

/* ─── Share-a-car listings (cloud) ─── */

export const listCarListingsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    await ensureTripsAndCars(sql);
    const rows = await sql`
      select * from share_car_listings
      where available = true
      order by created_at desc
      limit 100
    `;
    return {
      cars: (rows as Record<string, unknown>[]).map(mapCarRow),
    };
  },
);

export const createCarListingFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureTripsAndCars(sql);
    const id = String(data.id ?? "").trim() || uid("car");
    await sql`
      insert into share_car_listings (
        id, make_model, year, seats, transmission, rate_per_day, deposit,
        city, owner_name, owner_email, has_dashcam, insurance_note, rules,
        available, trips_hosted, rating, photo_url, created_at
      ) values (
        ${id},
        ${String(data.makeModel ?? "").trim()},
        ${Number(data.year ?? 2020)},
        ${Number(data.seats ?? 5)},
        ${String(data.transmission ?? "auto")},
        ${Number(data.ratePerDay ?? 45)},
        ${Number(data.deposit ?? 200)},
        ${String(data.city ?? "Lafayette, LA")},
        ${String(data.ownerName ?? "Host")},
        ${data.ownerEmail ? String(data.ownerEmail).toLowerCase() : null},
        ${Boolean(data.hasDashcam !== false)},
        ${String(data.insuranceNote ?? "")},
        ${String(data.rules ?? "")},
        ${true},
        ${Number(data.tripsHosted ?? 0)},
        ${Number(data.rating ?? 5)},
        ${data.photoUrl ? String(data.photoUrl) : null},
        ${new Date().toISOString()}
      )
      on conflict (id) do update set
        make_model = excluded.make_model,
        year = excluded.year,
        seats = excluded.seats,
        transmission = excluded.transmission,
        rate_per_day = excluded.rate_per_day,
        deposit = excluded.deposit,
        city = excluded.city,
        insurance_note = excluded.insurance_note,
        rules = excluded.rules,
        photo_url = excluded.photo_url,
        available = excluded.available
    `;
    return { id, ok: true as const };
  });


/* ─── Cloud Chat (multi-device) ─── */

async function ensureChatTables(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql`
    create table if not exists share_chat_threads (
      id text primary key,
      subject text not null default '',
      participants_json text not null default '[]',
      participant_emails_json text not null default '[]',
      participant_phones_json text not null default '[]',
      related_type text not null default 'support',
      related_id text,
      updated_at timestamptz not null default now(),
      created_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists share_chat_messages (
      id text primary key,
      thread_id text not null,
      from_name text not null default '',
      from_email text,
      body text not null default '',
      kind text not null default 'text',
      at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists share_chat_reads (
      thread_id text not null,
      reader_key text not null,
      last_read_at timestamptz not null default now(),
      primary key (thread_id, reader_key)
    )
  `;
}

function parseJsonArr(raw: unknown): string[] {
  try {
    const v = JSON.parse(String(raw || "[]"));
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function readerKey(email?: string, phone?: string): string {
  const e = (email || "").trim().toLowerCase();
  if (e.includes("@")) return `e:${e}`;
  const p = last10Digits(phone);
  if (p.length >= 10) return `p:${p}`;
  return "anon";
}

function threadIdFor(
  relatedType: string | undefined,
  relatedId: string | undefined,
  fallback?: string,
  /** Prefer one thread per rider phone across all their trips */
  riderPhone?: string,
): string {
  const p = last10Digits(riderPhone);
  if (p.length >= 10) {
    return `th_rider_${p}`;
  }
  if (relatedType && relatedId) {
    return `th_${relatedType}_${relatedId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  }
  return fallback || uid("th");
}

export const listChatFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      email?: string;
      phone?: string;
      name?: string;
      /** Founder PIN → all threads (ops inbox) */
      pin?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureChatTables(sql);
    const email = (data.email || "").trim().toLowerCase();
    const phone = last10Digits(data.phone);
    const name = (data.name || "").trim().toLowerCase();
    const key = readerKey(email, data.phone);

    let founder = false;
    if (data.pin) {
      try {
        checkPin(data.pin);
        founder = true;
      } catch {
        founder = false;
      }
    }
    // Also treat known founder notify email as ops (sees all chats)
    const founderEmail = (
      process.env.FOUNDER_NOTIFY_EMAIL?.trim() ||
      FOUNDER_NOTIFY_EMAIL_DEFAULT
    ).toLowerCase();
    if (email && founderEmail && email === founderEmail) founder = true;

    const rows = await sql`
      select * from share_chat_threads
      order by updated_at desc
      limit 200
    `;

    // Threads where this person has ever sent a message (covers partial participant lists)
    let authoredThreadIds = new Set<string>();
    if (email) {
      try {
        const authored = await sql`
          select distinct thread_id from share_chat_messages
          where lower(from_email) = ${email}
          limit 200
        `;
        authoredThreadIds = new Set(
          (authored as { thread_id: string }[]).map((r) => String(r.thread_id)),
        );
      } catch {
        authoredThreadIds = new Set();
      }
    }

    const mine = (rows as Record<string, unknown>[]).filter((r) => {
      if (founder) return true;
      const id = String(r.id);
      if (authoredThreadIds.has(id)) return true;
      const emails = parseJsonArr(r.participant_emails_json).map((x) =>
        x.toLowerCase(),
      );
      const phones = parseJsonArr(r.participant_phones_json).map((x) =>
        last10Digits(x),
      );
      const parts = parseJsonArr(r.participants_json).map((x) =>
        x.toLowerCase(),
      );
      if (email && emails.includes(email)) return true;
      if (phone.length >= 10 && phones.some((p) => p === phone)) return true;
      // name match as soft fallback (pilot) — full name or first name ≥3
      if (name.length >= 3) {
        const first = name.split(/\s+/)[0] || "";
        if (
          parts.some(
            (p) =>
              p.includes(name) ||
              name.includes(p) ||
              (first.length >= 3 && (p.includes(first) || first.includes(p))),
          )
        ) {
          return true;
        }
      }
      return false;
    });

    const threads: ChatThread[] = [];
    const messages: ChatMessage[] = [];
    // Content-level dedupe for accidental double inserts (same body+from within 8s)
    const seenContent = new Set<string>();

    for (const r of mine) {
      const id = String(r.id);
      const msgs = await sql`
        select * from share_chat_messages
        where thread_id = ${id}
        order by at asc
        limit 500
      `;
      const readRows = await sql`
        select last_read_at from share_chat_reads
        where thread_id = ${id} and reader_key = ${key}
        limit 1
      `;
      const lastRead =
        readRows[0]?.last_read_at != null
          ? +new Date(readRows[0].last_read_at as string | Date)
          : 0;

      let unread = 0;
      for (const m of msgs as Record<string, unknown>[]) {
        const fromEmail = String(m.from_email || "").toLowerCase();
        const fromName = String(m.from_name || "Share");
        const body = String(m.body || "");
        const atIso = iso(m.at as string | Date) ?? new Date().toISOString();
        const at = +new Date(atIso);
        // Bucket time to ~8s to collapse double-sends
        const bucket = Math.floor(at / 8000);
        const contentKey = `${id}|${fromEmail || fromName}|${body}|${bucket}`;
        if (body && seenContent.has(contentKey)) {
          continue; // skip duplicate bubble
        }
        if (body) seenContent.add(contentKey);

        const mineMsg =
          (email && fromEmail && fromEmail === email) ||
          String(m.kind) === "system";
        if (!mineMsg && at > lastRead) unread += 1;
        messages.push({
          id: String(m.id),
          threadId: id,
          from: fromName,
          fromEmail: m.from_email ? String(m.from_email) : undefined,
          body,
          at: atIso,
          kind: (String(m.kind || "text") as ChatMessage["kind"]) || "text",
        });
      }

      threads.push({
        id,
        subject: String(r.subject || "Chat"),
        participants: parseJsonArr(r.participants_json),
        participantEmails: parseJsonArr(r.participant_emails_json),
        participantPhones: parseJsonArr(r.participant_phones_json),
        relatedType: String(
          r.related_type || "support",
        ) as ChatThread["relatedType"],
        relatedId: r.related_id ? String(r.related_id) : undefined,
        updatedAt:
          iso(r.updated_at as string | Date) ?? new Date().toISOString(),
        unread,
      });
    }

    // Upgrade volunteer chat titles to approved rider full names
    const volIds = threads
      .filter((th) => th.relatedType === "volunteer" && th.relatedId)
      .map((th) => th.relatedId!)
      .filter(Boolean);
    if (volIds.length) {
      try {
        const rideRows = await sql`
          select id, full_name, phone from share_volunteer_rides
          order by created_at desc
          limit 200
        `;
        const byRide = new Map<
          string,
          { full_name: string; phone: string }
        >();
        for (const rr of rideRows as {
          id: string;
          full_name: string;
          phone: string;
        }[]) {
          byRide.set(String(rr.id), {
            full_name: String(rr.full_name || "").trim(),
            phone: String(rr.phone || ""),
          });
        }
        // Approved rider apps by phone → preferred display name
        const appRows = await sql`
          select phone, full_name, status from share_rider_apps
          where status in ('active', 'approved')
          order by created_at desc
          limit 400
        `;
        const nameByPhone = new Map<string, string>();
        for (const a of appRows as {
          phone: string;
          full_name: string;
          status: string;
        }[]) {
          const p10 = last10Digits(a.phone);
          if (p10.length < 10) continue;
          if (nameByPhone.has(p10)) continue;
          const nm = String(a.full_name || "").trim();
          if (nm.length >= 2) nameByPhone.set(p10, nm);
        }

        for (let i = 0; i < threads.length; i++) {
          const th = threads[i]!;
          if (th.relatedType !== "volunteer" || !th.relatedId) continue;
          const ride = byRide.get(th.relatedId);
          if (!ride) continue;
          const legal =
            nameByPhone.get(last10Digits(ride.phone)) || ride.full_name;
          if (!legal || legal.length < 2) continue;

          // Replace short names in participants
          const parts = th.participants.map((p) => {
            if (p === "You" || p === "Share Ops") return p;
            // If participant looks like abbreviated form of legal name, upgrade
            const pl = p.toLowerCase();
            const ll = legal.toLowerCase();
            if (pl === ll) return legal;
            const first = ll.split(/\s+/)[0] || "";
            if (first && pl.startsWith(first)) return legal;
            // single initial last name patterns e.g. "Helena S."
            if (first && pl.includes(first)) return legal;
            return p;
          });
          // Ensure legal name is present if only "You" + short name
          if (!parts.some((p) => p.toLowerCase() === legal.toLowerCase())) {
            const idx = parts.findIndex((p) => p !== "You" && p !== "Share Ops");
            if (idx >= 0) parts[idx] = legal;
            else parts.push(legal);
          }

          const betterSubject = th.subject.match(/^Ride\s*·/i)
            ? `Ride · ${legal}`
            : th.subject.includes(ride.full_name) && ride.full_name !== legal
              ? th.subject.split(ride.full_name).join(legal)
              : th.subject.startsWith("Ride")
                ? `Ride · ${legal}`
                : th.subject;

          threads[i] = {
            ...th,
            subject: betterSubject,
            participants: parts,
          };

          // Persist upgrade so every device matches
          if (
            betterSubject !== th.subject ||
            parts.join("|") !== th.participants.join("|")
          ) {
            try {
              await sql`
                update share_chat_threads set
                  subject = ${betterSubject},
                  participants_json = ${JSON.stringify(parts)}
                where id = ${th.id}
              `;
            } catch {
              /* ignore persist */
            }
          }
        }
      } catch (e) {
        console.error("[listChat] name enrich failed", e);
      }
    }

    // Collapse multiple trip chats for the same rider phone → one thread
    try {
      // Map volunteer relatedId → rider phone
      const ridePhoneById = new Map<string, string>();
      try {
        const allRides = await sql`
          select id, phone, full_name from share_volunteer_rides
          order by created_at desc limit 300
        `;
        for (const rr of allRides as {
          id: string;
          phone: string;
          full_name: string;
        }[]) {
          const p = last10Digits(rr.phone);
          if (p.length >= 10) ridePhoneById.set(String(rr.id), p);
        }
      } catch {
        /* ignore */
      }

      type Bucket = {
        phone: string;
        threadIds: string[];
        bestName: string;
        bestSubject: string;
        emails: Set<string>;
        phones: Set<string>;
        parts: Set<string>;
        updatedAt: string;
        unread: number;
      };
      const buckets = new Map<string, Bucket>();

      function ensureBucket(phone: string): Bucket {
        let b = buckets.get(phone);
        if (!b) {
          b = {
            phone,
            threadIds: [],
            bestName: "",
            bestSubject: "",
            emails: new Set(),
            phones: new Set([phone]),
            parts: new Set(),
            updatedAt: "",
            unread: 0,
          };
          buckets.set(phone, b);
        }
        return b;
      }

      for (const th of threads) {
        const phones = (th.participantPhones || [])
          .map((x) => last10Digits(x))
          .filter((x) => x.length >= 10);
        // Infer from volunteer ride
        if (th.relatedType === "volunteer" && th.relatedId) {
          const rp = ridePhoneById.get(th.relatedId);
          if (rp) phones.push(rp);
        }
        // Infer from existing th_rider_ id
        const m = th.id.match(/^th_rider_(\d{10})$/);
        if (m) phones.push(m[1]!);

        const uniquePhones = [...new Set(phones)];
        // One counterparty phone: use it. Multiple: prefer non-matching my phone later
        for (const p of uniquePhones) {
          // Only bucket if this phone appears as a ride phone or th_rider or
          // is the sole phone on the thread (likely the rider)
          const isRidePhone = [...ridePhoneById.values()].includes(p);
          const isCanonical = th.id === `th_rider_${p}`;
          const sole = uniquePhones.length === 1;
          if (!isRidePhone && !isCanonical && !sole) continue;

          const b = ensureBucket(p);
          if (!b.threadIds.includes(th.id)) b.threadIds.push(th.id);
          for (const e of th.participantEmails || []) {
            if (e.includes("@")) b.emails.add(e.toLowerCase());
          }
          for (const ph of th.participantPhones || []) {
            const x = last10Digits(ph);
            if (x.length >= 10) b.phones.add(x);
          }
          for (const part of th.participants) {
            if (part && part !== "You") b.parts.add(part);
          }
          if (
            !b.updatedAt ||
            +new Date(th.updatedAt) > +new Date(b.updatedAt)
          ) {
            b.updatedAt = th.updatedAt;
            b.bestSubject = th.subject;
          }
          b.unread += th.unread || 0;
          // Prefer longer display names
          for (const part of th.participants) {
            if (
              part &&
              part !== "You" &&
              part !== "Share Ops" &&
              part.length > b.bestName.length
            ) {
              b.bestName = part;
            }
          }
        }
      }

      const dropThreadIds = new Set<string>();
      const remapMsg = new Map<string, string>(); // oldThreadId → canonical

      for (const b of buckets.values()) {
        if (b.threadIds.length < 2 && !b.threadIds.some((id) => id.startsWith("th_volunteer_") || id.startsWith("th_local_"))) {
          // Still upgrade single trip thread → rider thread if we have phone
          if (
            b.threadIds.length === 1 &&
            b.threadIds[0] !== `th_rider_${b.phone}` &&
            (b.threadIds[0]!.startsWith("th_volunteer_") ||
              b.threadIds[0]!.startsWith("th_local_"))
          ) {
            // merge 1 trip → rider
          } else if (b.threadIds.length < 2) {
            continue;
          }
        }

        const canonical = `th_rider_${b.phone}`;
        const name =
          b.bestName ||
          b.bestSubject.replace(/^Ride\s*·\s*/i, "").trim() ||
          "Rider";
        const subject = `Chat · ${name}`;
        const parts = ["You", name];
        const emails = [...b.emails];
        const phones = [...b.phones];
        const now = b.updatedAt || new Date().toISOString();

        // Ensure canonical thread row
        await sql`
          insert into share_chat_threads (
            id, subject, participants_json, participant_emails_json,
            participant_phones_json, related_type, related_id, updated_at, created_at
          ) values (
            ${canonical},
            ${subject},
            ${JSON.stringify(parts)},
            ${JSON.stringify(emails)},
            ${JSON.stringify(phones)},
            ${"support"},
            ${b.phone},
            ${now},
            ${now}
          )
          on conflict (id) do update set
            subject = excluded.subject,
            participants_json = excluded.participants_json,
            participant_emails_json = excluded.participant_emails_json,
            participant_phones_json = excluded.participant_phones_json,
            updated_at = greatest(share_chat_threads.updated_at, excluded.updated_at)
        `;

        for (const oldId of b.threadIds) {
          if (oldId === canonical) continue;
          // Move messages
          await sql`
            update share_chat_messages
            set thread_id = ${canonical}
            where thread_id = ${oldId}
          `;
          remapMsg.set(oldId, canonical);
          dropThreadIds.add(oldId);
          // Remove empty old thread
          try {
            await sql`delete from share_chat_threads where id = ${oldId}`;
          } catch {
            /* ignore */
          }
        }
      }

      if (dropThreadIds.size || remapMsg.size) {
        // Rebuild response threads/messages for merged set
        const thById = new Map(threads.map((th) => [th.id, th]));
        for (const oldId of dropThreadIds) thById.delete(oldId);

        // Reload canonical threads we created
        for (const b of buckets.values()) {
          const canonical = `th_rider_${b.phone}`;
          if (![...remapMsg.values()].includes(canonical) && !dropThreadIds.size)
            continue;
          const name =
            b.bestName ||
            b.bestSubject.replace(/^Ride\s*·\s*/i, "").trim() ||
            "Rider";
          thById.set(canonical, {
            id: canonical,
            subject: `Chat · ${name}`,
            participants: ["You", name],
            participantEmails: [...b.emails],
            participantPhones: [...b.phones],
            relatedType: "support",
            relatedId: b.phone,
            updatedAt: b.updatedAt || new Date().toISOString(),
            unread: b.unread,
          });
        }

        const nextMessages = messages.map((m) => {
          const nt = remapMsg.get(m.threadId);
          return nt ? { ...m, threadId: nt } : m;
        });
        // Dedupe messages by id after remap
        const mById = new Map(nextMessages.map((m) => [m.id, m]));
        threads.length = 0;
        threads.push(...thById.values());
        messages.length = 0;
        messages.push(...mById.values());
      }
    } catch (e) {
      console.error("[listChat] rider-thread merge failed", e);
    }

    return { threads, messages, readerKey: key, founder };
  });

export const upsertChatThreadFn = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureChatTables(sql);
    const relatedType = String(data.relatedType || "support");
    const relatedId = data.relatedId ? String(data.relatedId) : undefined;
    const phonesEarly = (
      Array.isArray(data.participantPhones)
        ? data.participantPhones.map(String)
        : []
    )
      .map((p) => last10Digits(p))
      .filter((p) => p.length >= 10);
    // Prefer client id when already rider-scoped; else phone; else trip id
    const clientId = data.id ? String(data.id) : "";
    const id =
      clientId.startsWith("th_rider_")
        ? clientId
        : threadIdFor(
            relatedType,
            relatedId,
            clientId || undefined,
            phonesEarly[phonesEarly.length - 1] ||
              (relatedType === "support" && relatedId && relatedId.length === 10
                ? relatedId
                : undefined),
          );
    const subject = String(data.subject || "Chat").trim() || "Chat";
    const participants = Array.isArray(data.participants)
      ? data.participants.map(String)
      : [];
    const emails = (
      Array.isArray(data.participantEmails)
        ? data.participantEmails.map(String)
        : []
    )
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));
    const phones = (
      Array.isArray(data.participantPhones)
        ? data.participantPhones.map(String)
        : []
    )
      .map((p) => last10Digits(p))
      .filter((p) => p.length >= 10);
    const now = new Date().toISOString();

    await sql`
      insert into share_chat_threads (
        id, subject, participants_json, participant_emails_json,
        participant_phones_json, related_type, related_id, updated_at, created_at
      ) values (
        ${id},
        ${subject},
        ${JSON.stringify(participants)},
        ${JSON.stringify(emails)},
        ${JSON.stringify(phones)},
        ${relatedType},
        ${relatedId ?? null},
        ${now},
        ${now}
      )
      on conflict (id) do update set
        subject = excluded.subject,
        participants_json = excluded.participants_json,
        participant_emails_json = excluded.participant_emails_json,
        participant_phones_json = excluded.participant_phones_json,
        updated_at = excluded.updated_at
    `;

    // seed system message if none
    const existing = await sql`
      select id from share_chat_messages where thread_id = ${id} limit 1
    `;
    if (!existing.length) {
      const mid = uid("m");
      await sql`
        insert into share_chat_messages (
          id, thread_id, from_name, from_email, body, kind, at
        ) values (
          ${mid},
          ${id},
          ${"Share Ops"},
          ${null},
          ${"This conversation is logged for safety. Keep trip talk in Share."},
          ${"system"},
          ${now}
        )
      `;
    }

    if (data.firstMessage && String(data.firstMessage).trim()) {
      const textCount = await sql`
        select id from share_chat_messages
        where thread_id = ${id} and kind = ${"text"}
        limit 1
      `;
      if (!textCount.length) {
        const mid = uid("m");
        const fromName = String(data.fromName || "You");
        const fromEmail = data.fromEmail
          ? String(data.fromEmail).toLowerCase()
          : null;
        await sql`
          insert into share_chat_messages (
            id, thread_id, from_name, from_email, body, kind, at
          ) values (
            ${mid},
            ${id},
            ${fromName},
            ${fromEmail},
            ${String(data.firstMessage).trim()},
            ${"text"},
            ${now}
          )
        `;
        await sql`
          update share_chat_threads set updated_at = ${now} where id = ${id}
        `;
      }
    }

    return { id, ok: true as const };
  });

export const sendChatMessageFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      threadId: string;
      body: string;
      fromName: string;
      fromEmail?: string;
      kind?: string;
      messageId?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureChatTables(sql);
    const threadId = data.threadId;
    const body = data.body.trim();
    if (!body) throw new Error("Empty message");
    const id = data.messageId || uid("m");
    const at = new Date().toISOString();
    const fromEmail = data.fromEmail
      ? data.fromEmail.trim().toLowerCase()
      : null;

    // ensure thread exists
    const th = await sql`
      select id from share_chat_threads where id = ${threadId} limit 1
    `;
    if (!th.length) {
      await sql`
        insert into share_chat_threads (
          id, subject, participants_json, participant_emails_json,
          participant_phones_json, related_type, updated_at, created_at
        ) values (
          ${threadId},
          ${"Chat"},
          ${JSON.stringify([data.fromName || "You"])},
          ${JSON.stringify(fromEmail ? [fromEmail] : [])},
          ${"[]"},
          ${"support"},
          ${at},
          ${at}
        )
      `;
    } else if (fromEmail) {
      // Ensure sender stays on the participant list so all devices see the thread
      try {
        const cur = await sql`
          select participant_emails_json from share_chat_threads
          where id = ${threadId} limit 1
        `;
        const emails = parseJsonArr(
          (cur[0] as { participant_emails_json?: unknown } | undefined)
            ?.participant_emails_json,
        ).map((e) => e.toLowerCase());
        if (!emails.includes(fromEmail)) {
          emails.push(fromEmail);
          await sql`
            update share_chat_threads
            set participant_emails_json = ${JSON.stringify(emails)}
            where id = ${threadId}
          `;
        }
      } catch {
        /* ignore */
      }
    }

    // Dedupe: same messageId OR identical body from same sender within 10s
    if (!data.messageId) {
      const recent = await sql`
        select id from share_chat_messages
        where thread_id = ${threadId}
          and body = ${body}
          and coalesce(from_email, '') = ${fromEmail || ""}
          and at > now() - interval '10 seconds'
        limit 1
      `;
      if (recent.length) {
        return { id: String(recent[0].id), at, ok: true as const, deduped: true };
      }
    }

    await sql`
      insert into share_chat_messages (
        id, thread_id, from_name, from_email, body, kind, at
      ) values (
        ${id},
        ${threadId},
        ${data.fromName || "You"},
        ${fromEmail},
        ${body},
        ${data.kind || "text"},
        ${at}
      )
      on conflict (id) do nothing
    `;
    await sql`
      update share_chat_threads set updated_at = ${at} where id = ${threadId}
    `;

    // sender has read up to now
    if (fromEmail) {
      const key = readerKey(fromEmail);
      await sql`
        insert into share_chat_reads (thread_id, reader_key, last_read_at)
        values (${threadId}, ${key}, ${at})
        on conflict (thread_id, reader_key) do update set
          last_read_at = excluded.last_read_at
      `;
    }

    return { id, at, ok: true as const };
  });

export const markChatReadFn = createServerFn({ method: "POST" })
  .validator(
    (data: { threadId: string; email?: string; phone?: string }) => data,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureChatTables(sql);
    const key = readerKey(data.email, data.phone);
    if (key === "anon") return { ok: true as const };
    const at = new Date().toISOString();
    await sql`
      insert into share_chat_reads (thread_id, reader_key, last_read_at)
      values (${data.threadId}, ${key}, ${at})
      on conflict (thread_id, reader_key) do update set
        last_read_at = excluded.last_read_at
    `;
    return { ok: true as const };
  });

import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/share/shell";
import { SHARE_DOMAIN, PARENT_DOMAIN } from "@/lib/share/tracking";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-2xl px-4 py-12 pb-20">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
          Legal · draft for pilot
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Share Technologies · {SHARE_DOMAIN} · Last updated: August 1, 2026
        </p>
        <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 text-sm text-[var(--color-fg-muted)]">
          This is a <strong className="text-[var(--color-fg)]">pilot draft</strong> for
          product demos and early access. Have a Louisiana attorney review before
          you take real payments, store IDs, or advertise widely. Not legal advice.
        </p>

        <div className="prose-share mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-fg-muted)]">
          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              1. Who we are
            </h2>
            <p className="mt-2">
              “Share,” “we,” and “us” refer to Share Technologies operating the
              Share marketplace at {SHARE_DOMAIN} (under {PARENT_DOMAIN}). Contact
              for privacy questions during pilot: the founder via the in-app admin
              channel or the email you use for pilot invites.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              2. What we collect
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong className="text-[var(--color-fg)]">Account & applications:</strong>{" "}
                name, email, phone, city, vehicle info, interview preferences,
                public bio, self-reported gig-platform history.
              </li>
              <li>
                <strong className="text-[var(--color-fg)]">Trip & marketplace data:</strong>{" "}
                ride posts, trip requests/bids, deliveries, car listings, gear
                rentals, messages, SOS events, ratings.
              </li>
              <li>
                <strong className="text-[var(--color-fg)]">Safety signals:</strong>{" "}
                dashcam disclosures, emergency contacts you provide, demo audio
                notes (pilot).
              </li>
              <li>
                <strong className="text-[var(--color-fg)]">Payments (when live):</strong>{" "}
                processed by Stripe; we receive limited payment metadata, not full
                card numbers.
              </li>
              <li>
                <strong className="text-[var(--color-fg)]">Device & logs:</strong>{" "}
                basic usage logs, IP, and error reports needed to run the service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              3. How we use information
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Match riders, drivers, hosts, and shippers</li>
              <li>Screen applicants and schedule interviews</li>
              <li>Show public bios and platform history to other users</li>
              <li>Process payments and payouts when enabled</li>
              <li>Safety, fraud prevention, and dispute review (including chat logs)</li>
              <li>Improve the product and communicate pilot updates</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              4. What other users can see
            </h2>
            <p className="mt-2">
              Drivers’ public bios, vehicle notes, dashcam badges, and
              self-reported platform stats are meant to be visible to riders
              before booking. Trip counterparties see names and chat. Do not put
              secrets in your public bio.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              5. Sharing with third parties
            </h2>
            <p className="mt-2">
              We do not sell personal data. We may share data with processors
              (hosting, email/SMS, Stripe, analytics), with emergency contacts or
              authorities if SOS/safety requires it, or when law requires. Corridor
              partners (e.g. shops posting deliveries) only see what’s needed for
              that job.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              6. Retention & security
            </h2>
            <p className="mt-2">
              We keep application and trip records as long as needed for safety,
              taxes, and disputes, then delete or anonymize when no longer
              required. We use reasonable safeguards; no system is 100% secure.
              Demo builds may store data in your browser (local storage) — clearing
              site data removes local demo state.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              7. Your choices
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Update profile and emergency contact in the app</li>
              <li>Request account deletion or data export by contacting us</li>
              <li>Opt out of non-essential marketing emails</li>
              <li>Decline dashcam rides or leave public bio limited</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              8. Kids
            </h2>
            <p className="mt-2">
              Share is not directed to children under 18. Drivers and hosts must
              meet age and licensing rules for their role.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              9. Changes
            </h2>
            <p className="mt-2">
              We may update this policy; material changes will be noted by date
              above and, when practical, in-app notice.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm">
          <Link to="/terms" className="font-medium text-[var(--color-primary)]">
            Terms of Service
          </Link>
          {" · "}
          <Link to="/demo" className="font-medium text-[var(--color-primary)]">
            Demo checklist
          </Link>
          {" · "}
          <Link to="/" className="font-medium text-[var(--color-primary)]">
            Home
          </Link>
        </p>
      </article>
    </MarketingShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/share/shell";
import { SHARE_DOMAIN, PARENT_DOMAIN } from "@/lib/share/tracking";
import { PLATFORM_TAKE_RATE } from "@/lib/share/data";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  const take = Math.round(PLATFORM_TAKE_RATE * 100);
  return (
    <MarketingShell>
      <article className="mx-auto max-w-2xl px-4 py-12 pb-20">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
          Legal · draft for pilot
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Share Technologies · {SHARE_DOMAIN} · Last updated: August 3, 2026
        </p>
        <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 text-sm text-[var(--color-fg-muted)]">
          Pilot draft for demos and early access. Get a lawyer to finalize before
          real money, insurance claims, or public App Store launch. Not legal
          advice.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-fg-muted)]">
          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              1. The service
            </h2>
            <p className="mt-2">
              Share is a marketplace that helps people arrange long-distance and
              local rides, package handoffs along existing trips, peer car days,
              and gear rentals. We are not a taxi company, insurer, employer of
              drivers, or carrier of goods. Drivers and hosts are independent.
              Domain: {SHARE_DOMAIN} ({PARENT_DOMAIN}).
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              2. Eligibility & trust
            </h2>
            <p className="mt-2">
              You must be legally able to enter contracts. Drivers need a valid
              license and lawful vehicle use. We may require interviews, ID
              checks, and background screening and may approve, suspend, or
              decline anyone. Lying on applications (including other-platform
              ratings) is grounds for removal.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              3. Marketplace rules
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong className="text-[var(--color-fg)]">Posted trips:</strong>{" "}
                drivers offer seats/cargo; riders book available inventory.
              </li>
              <li>
                <strong className="text-[var(--color-fg)]">Trip requests:</strong>{" "}
                riders set a max bid; drivers offer prices; accept locks the
                driver’s offer if ≤ max bid.
              </li>
              <li>
                <strong className="text-[var(--color-fg)]">Deliveries:</strong>{" "}
                shippers post packages; drivers on corridor may claim. No illegal
                or hazardous goods.
              </li>
              <li>
                <strong className="text-[var(--color-fg)]">Cars & gear:</strong>{" "}
                hosts set rates and rules; renters treat property carefully and
                return as agreed.
              </li>
              <li>
                Prefer in-app messages for trip communication so a record exists
                if something goes wrong.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              4. Fees
            </h2>
            <p className="mt-2">
              When payments are live, Share typically takes about {take}% of the
              paid trip/rental amount; the rest goes to the driver/host (subject
              to Stripe fees, refunds, and taxes). Volunteer rides may have no
              platform fee. Pilot pricing can change with notice.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              5. Cancellations (pilot default)
            </h2>
            <p className="mt-2">
              Free cancel until 12 hours before departure unless a listing says
              otherwise. Late cancel or no-show may forfeit fare or incur a fee.
              Hosts and drivers set additional rules where disclosed.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              6. Safety, dashcams, audio
            </h2>
            <p className="mt-2">
              Riders may see dashcam badges and must acknowledge cabin/road
              recording when disclosed. Louisiana is generally a one-party
              consent state for conversations you are part of; cross-state trips
              may differ. SOS and emergency contacts are tools — they do not
              replace 911. You are responsible for safe driving and legal
              compliance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              7. Insurance & liability
            </h2>
            <p className="mt-2">
              Share does not provide auto, cargo, or rental insurance in this
              pilot unless we later announce a program. Drivers and hosts must
              maintain required coverage and confirm with their broker what
              personal/commercial policies allow. Share is not liable for
              accidents, lost packages, or disputes between users beyond what law
              requires. To the maximum extent allowed, the service is provided
              “as is,” and our total liability for any claim is limited to fees
              you paid us in the prior 12 months (or $100 if greater for free
              pilot use).
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              8. Acceptable use
            </h2>
            <p className="mt-2">
              No harassment, fraud, weapons/drugs transport, discrimination that
              violates law, scraping, or circumventing fees by taking cash
              off-platform after matching (may result in ban). We may remove
              content and accounts.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              9. Disputes · informal resolution · arbitration
            </h2>
            <p className="mt-2">
              <strong className="text-[var(--color-fg)]">Informal first.</strong>{" "}
              Contact Share Ops and try to resolve any dispute in good faith
              within 30 days before formal action.
            </p>
            <p className="mt-2">
              <strong className="text-[var(--color-fg)]">Binding arbitration.</strong>{" "}
              Except for the small-claims option below, you and Share agree that
              any dispute arising out of or relating to these Terms or the
              service will be resolved by binding individual arbitration
              administered by the American Arbitration Association (AAA) under
              its Consumer Arbitration Rules (or equivalent successor rules),
              rather than in court. The Federal Arbitration Act governs this
              agreement. The arbitrator may award the same individual relief a
              court could, but may not consolidate claims or preside over any
              form of class or representative proceeding.
            </p>
            <p className="mt-2">
              <strong className="text-[var(--color-fg)]">Class action waiver.</strong>{" "}
              You and Share waive any right to a jury trial and to participate
              in a class, collective, or representative action. Claims must be
              brought only in an individual capacity.
            </p>
            <p className="mt-2">
              <strong className="text-[var(--color-fg)]">Small claims & IP.</strong>{" "}
              Either party may bring an individual action in small-claims court
              in Lafayette Parish, Louisiana (or your county of residence if
              required by law) for qualifying claims. Either party may seek
              injunctive relief in court for intellectual-property misuse or
              unauthorized access.
            </p>
            <p className="mt-2">
              <strong className="text-[var(--color-fg)]">Governing law.</strong>{" "}
              These Terms are governed by the laws of the State of Louisiana,
              USA, without regard to conflict-of-law rules, except that the FAA
              governs the arbitration agreement. This section is a pilot draft —
              have counsel review enforceability (especially for Louisiana
              consumers) before relying on it in a live paid marketplace.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--color-fg)]">
              10. Changes & contact
            </h2>
            <p className="mt-2">
              We may update these Terms; continued use after the updated date
              means acceptance. Demo features labeled “demo” are illustrative
              only.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm">
          <Link to="/privacy" className="font-medium text-[var(--color-primary)]">
            Privacy Policy
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

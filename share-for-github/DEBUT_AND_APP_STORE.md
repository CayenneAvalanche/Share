# Share — Debut day + App Store path

Public site: **https://share.myendeavors.me**  
Phone: **(337) 800-6300** · Build footer on `/app` shows stamp (e.g. `2026-08-07j`).

## Live today (web beta)

### What works for real users
| Flow | Status |
|------|--------|
| Rider application → Neon → Founder inbox | Live |
| Driver application (selfie + DL front/back + insurance) → inbox | Live |
| Founder Approve / Active / Decline (PIN) | Live |
| Volunteer ride request → live board → approved driver claims | Live |
| Lagniappe list with item photo | Live (cloud) |
| Sign in / create account (email; Google/X if env set) | Live |
| Sample “demo junk” on production host | **Blocked** — site always beta |

### Your two-phone debut script
1. Hard-refresh **share.myendeavors.me/app** (footer must say **beta**, not demo).
2. **Business phone:** Sign in → Apply as **rider**.
3. **Personal phone:** Sign in → Apply as **driver** (selfie + license + insurance).
4. **Founder inbox** (You → Founder admin): unlock with `FOUNDER_PIN` → Approve driver → Active.
5. Personal phone: open **You** (pulls approval by email) → Volunteer → claim an open request.
6. Business (or friend): Volunteer → **REQUEST A RIDE** → personal phone should see + claim it.

### If you still see Amy/Tom seed data
- You were stuck in sticky demo mode (fixed for production).
- Hard-refresh; storage key bumped to `v13` so old junk is abandoned.
- Never open `?mode=demo` on the live domain for real users.

### Netlify env (required for debut)
- `DATABASE_URL` — Neon  
- `FOUNDER_PIN` — admin unlock  
- `SECRETS_SCAN_OMIT_KEYS=DATABASE_URL,FOUNDER_PIN`  
- Optional later: Stripe keys, `GROK_AUTH_*` / Better Auth secrets for Google/X  

---

## Path to App Store / Play Store (checklist)

Web beta is **not** the App Store. Native shells (Capacitor / PWA install) come after product-market fit on the corridor.

### A. Product & legal (before any store listing)
- [ ] Louisiana / TNC counsel review (volunteer vs paid, insurance, disclaimers)
- [ ] Terms + Privacy finalized for paid trips (not pilot draft)
- [ ] Real SOS routing (not demo toast) to ops phone + emergency contact
- [ ] Background-check vendor for drivers (or manual process documented)
- [ ] Document retention policy for license / insurance / selfies
- [ ] Age gates, accessibility (elders), and content moderation plan

### B. Payments & ops
- [ ] Stripe live keys + Checkout for seats / packages / escalated volunteer paid
- [ ] Webhook → mark booking paid in Neon
- [ ] Driver payout process (weekly manual → Stripe Connect later)
- [ ] Receipts + dispute process
- [ ] Support inbox / phone coverage hours

### C. Trust & identity
- [ ] Real ID verification (not checkbox) — e.g. Stripe Identity or manual review queue
- [ ] Phone OTP or verified email required before booking
- [ ] Dashcam policy + badge accuracy
- [ ] Ratings + block list enforced server-side

### D. Technical (store-grade)
- [ ] All marketplace boards server-backed (rides, deliveries, cars) not only localStorage
- [ ] Push notifications (APNs / FCM) for claims, approvals, SOS
- [ ] Production error monitoring (Sentry)
- [ ] Rate limits + abuse prevention on apply / post
- [ ] Image storage (S3/R2) instead of large base64 in Postgres
- [ ] Offline-safe UX without silent data loss
- [ ] `npm run build` + E2E smoke on every deploy

### E. Native wrap (Capacitor or similar)
- [ ] iOS + Android project, deep links to share.myendeavors.me routes
- [ ] Camera permissions copy for license / selfie / Lagniappe photos
- [ ] Location permission only when needed (local ride / SOS)
- [ ] Apple Developer + Google Play accounts, privacy nutrition labels
- [ ] TestFlight / internal testing track
- [ ] App Store screenshots, support URL, privacy URL
- [ ] Age rating questionnaire

### F. Soft-launch → store
- [ ] Closed FB group pilot (invite codes) for 2–4 weeks
- [ ] 50+ real completed corridor or volunteer trips without P0 bugs
- [ ] Insurance / counsel sign-off for paid TNC-like activity
- [ ] Then submit App Store / Play

---

## Not blocking web debut today
- Stripe live (can invoice/manual first week)
- App Store binary
- Perfect multi-device chat (in-app messages still mostly local)
- Demo subdomain polish

Ship the **web beta**, take real apps, run volunteer claims, fix bugs as you find them. Store is a later phase after the corridor is real.

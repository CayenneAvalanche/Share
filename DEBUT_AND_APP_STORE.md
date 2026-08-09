# Share — Debut day + App Store path

Public site: **https://share.myendeavors.me**  
Phone: **(337) 800-6300** · Build stamp on `/app` footer (e.g. `2026-08-08q`).

Last revisited: **2026-08-08** (after free-ride pilot week + founder ops work).

---

## Live today (web beta)

### What works for real users

| Flow | Status |
|------|--------|
| Rider application → Neon → Founder inbox | Live |
| Driver application (selfie + DL front/back + insurance) → inbox | Live |
| Founder Approve / Active / Decline / Delete apps (PIN) | Live |
| Volunteer ride request → cloud board → claim / cancel / delete | Live |
| Volunteer categories: veteran, disabled, elder, **hardship, medical, work** | Live |
| Founder SMS alert on new volunteer request (Twilio env) | Live (email/Resend optional) |
| Founder inbox: cloud volunteer list + **Trips** tab (view/edit/delete) | Live |
| Profile selfie (dedicated storage so iOS retakes stick) | Live |
| Vehicle garage → prefill trip posts | Live |
| Lagniappe list with item photo | Live (cloud) |
| Sign in / create account (email; Google/X if env set) | Live |
| Sample “demo junk” on production host | **Blocked** — site always beta |
| Trip posts / corridor requests | Partial — mostly device-local (not full multi-device cloud yet) |
| In-app chat | Partial — mostly local |
| Payments (Stripe) | Not live |

### Free-ride / community pilot (this week)
- Public beta framing + FB free rides (Aug 9 & 11)
- Audiences: elders, disabled, veterans, medical, work, hardship
- Ops phone: 337-800-6300 (Cajun Cannabis / Share)
- Twilio toll-free verification still pending for reliable SMS

### Netlify env

**Required**
- `DATABASE_URL` — Neon  
- `FOUNDER_PIN` — admin unlock  

**Recommended (ops)**
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER`  
- `FOUNDER_NOTIFY_PHONE` (optional override; default +13375010195)  
- `SECRETS_SCAN_OMIT_KEYS` includes DB + PIN + Twilio secrets  

**Optional later**
- `RESEND_API_KEY` / `RESEND_FROM` — founder email alerts  
- Stripe keys, Better Auth Google/X secrets  

---

## Path to App Store / Play Store (checklist)

Web beta ≠ App Store. Native shell (Capacitor / PWA) after product-market fit on real trips.

Legend: `[x]` done · `[-]` partial / in progress · `[ ]` not started

### A. Product & legal (before any store listing)
- [ ] Louisiana / TNC counsel review (volunteer vs paid, insurance, disclaimers)
- [ ] Terms + Privacy finalized for paid trips (not pilot draft)
- [-] SOS: UI exists; **not** fully routed to ops phone + emergency contact as production path
- [ ] Background-check vendor for drivers (or written manual process)
- [ ] Document retention policy for license / insurance / selfies
- [ ] Age gates, accessibility (elders), content moderation plan
- [-] Insurance plan for founder vehicle + future TNC limits (research done; policy not purchased)

### B. Payments & ops
- [ ] Stripe live keys + Checkout (seats / packages / escalated paid volunteer)
- [ ] Webhook → mark booking paid in Neon
- [ ] Driver payout process (weekly manual → Stripe Connect later)
- [ ] Receipts + dispute process
- [-] Support phone live (337-800-6300); formal coverage hours not published
- [x] Founder ops inbox for apps + volunteer requests + trip cleanup

### C. Trust & identity
- [-] ID: driver docs upload + founder review; **not** Stripe Identity / automated verify
- [-] Account email sign-in live; phone OTP not required before booking
- [ ] Dashcam policy + badge accuracy enforced
- [ ] Ratings + block list enforced server-side

### D. Technical (store-grade)
- [-] Cloud: apps, volunteer, Lagniappe; **rides/deliveries/cars still partly localStorage**
- [-] Founder SMS on volunteer request; full push (APNs/FCM) not built
- [ ] Production error monitoring (Sentry)
- [ ] Rate limits + abuse prevention on apply / post
- [ ] Image storage (S3/R2) instead of large base64 in Postgres / localStorage
- [-] Selfie quota hardening on iOS; broader offline-safe UX still needed
- [-] `npm run build` works; automated E2E on every deploy not wired

### E. Native wrap (Capacitor or similar)
- [ ] iOS + Android project, deep links
- [ ] Camera permissions copy (license / selfie / Lagniappe)
- [ ] Location permission only when needed
- [ ] Apple Developer + Google Play accounts, privacy nutrition labels
- [ ] TestFlight / internal testing track
- [ ] App Store screenshots, support URL, privacy URL
- [ ] Age rating questionnaire

### F. Soft-launch → store
- [-] FB pilot / free rides started (not yet 2–4 stable weeks)
- [ ] 50+ real completed corridor or volunteer trips without P0 bugs
- [ ] Insurance / counsel sign-off for paid TNC-like activity
- [ ] Then submit App Store / Play

---

## Suggested order from here (practical)

### Now → 2 weeks (web pilot quality)
1. Finish Twilio number verification so founder texts always deliver  
2. Lawyer consult (TNC vs volunteer marketplace) + insurance quote path  
3. Harden Terms/Privacy for pilot language  
4. Server-back **trip posts** (same pattern as volunteer) so multi-phone is real  
5. Real SOS → SMS/call to 337-800-6300 + saved emergency contact  
6. Log every free-ride completion; kill P0 bugs only  

### 2–6 weeks (ops maturity)
7. Stripe Checkout for paid seats / escalated rides  
8. Manual driver payout spreadsheet → then Connect  
9. Background-check process (even if manual checklist)  
10. S3/R2 for photos; stop base64 in DB  
11. Sentry + basic rate limits  

### Store only after
12. 50+ real completed rides, counsel + insurance comfort  
13. Capacitor shell + TestFlight  
14. Screenshots, privacy nutrition, support URL  
15. Submit  

---

## Not blocking web pilot this week
- App Store binary  
- Perfect multi-device chat  
- Stripe live  
- Full TNC commercial policy (upgrade this week/next, but pilot can stay volunteer-first)  

**Rule:** ship web, complete free rides, fix bugs, then store — not the reverse.

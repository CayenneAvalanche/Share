/** Public Share contact — elders & volunteers call this anytime. */
export const SHARE_PHONE_DISPLAY = "(337) 800-6300";
export const SHARE_PHONE_TEL = "tel:+13378006300";
export const SHARE_DOMAIN = "share.myendeavors.me";
export const SHARE_DEMO_DOMAIN = "demo.share.myendeavors.me";

/**
 * Founder alert targets (pilot).
 * Overridable on the server via FOUNDER_NOTIFY_EMAIL / FOUNDER_NOTIFY_PHONE.
 * Kept as plain constants here so client code can display them if needed;
 * the actual send lives only in server-fns.
 */
export const FOUNDER_NOTIFY_EMAIL_DEFAULT = "tmd5458@me.com";
/** E.164 */
export const FOUNDER_NOTIFY_PHONE_DEFAULT = "+13375010195";

/** Bump when shipping so we can verify Netlify actually deployed. */
export const SHARE_BUILD = "2026-08-08o";

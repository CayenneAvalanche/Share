/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Enabled for Share public beta so riders/drivers can create accounts without
 * waiting on Google/X broker env on Netlify. Forms use authClient.signUp.email /
 * authClient.signIn.email from `@/lib/auth/client`.
 *
 * Do NOT edit `server.ts` for this — that file is frozen pre-wired config.
 */
export const emailAndPasswordEnabled = true;

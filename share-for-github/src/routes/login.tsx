import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { ShareMark } from "@/components/share/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import {
  authClient,
  authEnabled,
  captureSessionBearer,
} from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useShareStore } from "@/lib/share/store";
import { SHARE_PHONE_DISPLAY, SHARE_PHONE_TEL } from "@/lib/share/contact";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type AuthUserBits = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const setRiderName = useShareStore((s) => s.setRiderName);
  const setEmergencyContact = useShareStore((s) => s.setEmergencyContact);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ecName, setEcName] = useState("");
  const [ecPhone, setEcPhone] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isPending && user) {
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        window.location.href = "/profile";
      });
    }
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!em.includes("@") || password.length < 8) {
      toast.error("Use a real email and a password of at least 8 characters");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Please enter your real name");
      return;
    }
    if (mode === "signup" && (!ecName.trim() || !ecPhone.trim())) {
      toast.error("Add an emergency contact name and phone for SOS");
      return;
    }
    setBusy(true);
    try {
      const displayName =
        name.trim() || em.split("@")[0] || "Share member";

      let responseUser: AuthUserBits | null = null;
      let responseToken: string | null = null;

      if (mode === "signup") {
        const res = await authClient.signUp.email({
          email: em,
          password,
          name: displayName,
        });
        if (res.error) throw new Error(res.error.message ?? "Sign-up failed");
        const d = res.data as unknown as {
          user?: AuthUserBits;
          token?: string;
          session?: { token?: string };
        } | null;
        responseUser = d?.user ?? null;
        responseToken = d?.token ?? d?.session?.token ?? null;
      } else {
        const res = await authClient.signIn.email({
          email: em,
          password,
        });
        if (res.error) {
          const msg = res.error.message ?? "Sign-in failed";
          if (/invalid|not found|credentials/i.test(msg)) {
            throw new Error(
              "No account with that email, or wrong password. Create an account if you never finished sign-up.",
            );
          }
          throw new Error(msg);
        }
        const d = res.data as unknown as {
          user?: AuthUserBits;
          token?: string;
          session?: { token?: string };
        } | null;
        responseUser = d?.user ?? null;
        responseToken = d?.token ?? d?.session?.token ?? null;
      }

      await captureSessionBearer({
        token: responseToken,
        user: responseUser,
      });
      const session = await authClient.getSession();
      const u = session.data?.user ?? responseUser;
      if (!u) {
        throw new Error(
          "Signed up but session didn’t stick. Try again, or hard-refresh after waiting a few seconds.",
        );
      }

      const realName = (("name" in u ? u.name : null) || displayName).trim();
      setRiderName(realName);
      if (mode === "signup") {
        setEmergencyContact(ecName, ecPhone);
      }
      toast.success(
        mode === "signup"
          ? `Welcome, ${realName}`
          : `Signed in as ${realName}`,
      );

      window.location.href = "/profile";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
      setBusy(false);
    }
  }

  return (
    <AppShell title="Sign in" subtitle="Your account" solidHeader backTo="/profile">
      <div className="mx-auto max-w-md space-y-4 py-4 pb-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 rounded-[var(--radius-xl)] bg-[#2a6b45] p-3">
            <ShareMark inverted className="size-10" />
          </div>
          <p className="font-display text-xl font-semibold">
            {mode === "signup"
              ? "Create your account"
              : mode === "forgot"
                ? "Reset password"
                : "Welcome back"}
          </p>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {mode === "forgot"
              ? "We’ll get you a temporary password."
              : "Email and password only — quick and simple."}
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 p-5">
            {authEnabled ? (
              mode === "forgot" ? (
                <div className="space-y-3 text-sm text-[var(--color-fg-muted)]">
                  <p>Self-serve email reset isn’t live yet. Two options:</p>
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>
                      <strong className="text-[var(--color-fg)]">
                        Create account again
                      </strong>{" "}
                      if sign-up never finished.
                    </li>
                    <li>
                      Call{" "}
                      <a
                        href={SHARE_PHONE_TEL}
                        className="font-semibold text-[var(--color-primary)]"
                      >
                        {SHARE_PHONE_DISPLAY}
                      </a>{" "}
                      — founder can set a temporary password from Accounts.
                    </li>
                  </ol>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => setMode("signup")}
                  >
                    Create a new account
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-sm font-semibold text-[var(--color-primary)] underline"
                    onClick={() => setMode("signin")}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={onEmailSubmit} className="space-y-3">
                    {mode === "signup" && (
                      <>
                        <div>
                          <Label htmlFor="nm">Your real name</Label>
                          <Input
                            id="nm"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Travis DeYoung"
                            autoComplete="name"
                          />
                        </div>
                        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 space-y-2">
                          <p className="text-sm font-semibold text-[var(--color-fg)]">
                            Emergency contact
                          </p>
                          <p className="text-xs text-[var(--color-fg-muted)]">
                            Who we can reach if SOS is used during a ride.
                          </p>
                          <div>
                            <Label htmlFor="ecn">Contact name</Label>
                            <Input
                              id="ecn"
                              required
                              value={ecName}
                              onChange={(e) => setEcName(e.target.value)}
                              placeholder="e.g. Mom, partner, roommate"
                              autoComplete="name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ecp">Contact phone</Label>
                            <Input
                              id="ecp"
                              required
                              type="tel"
                              value={ecPhone}
                              onChange={(e) => setEcPhone(e.target.value)}
                              placeholder="(337) 555-0100"
                              autoComplete="tel"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    <div>
                      <Label htmlFor="em">Email</Label>
                      <Input
                        id="em"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pw">Password</Label>
                      <Input
                        id="pw"
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete={
                          mode === "signup" ? "new-password" : "current-password"
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={busy}>
                      {busy
                        ? "Working…"
                        : mode === "signup"
                          ? "Create account"
                          : "Sign in"}
                    </Button>
                  </form>

                  {mode === "signin" && (
                    <button
                      type="button"
                      className="w-full text-center text-sm text-[var(--color-primary)] underline"
                      onClick={() => setMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  )}

                  <p className="text-center text-sm text-[var(--color-fg-muted)]">
                    {mode === "signup" ? (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          className="font-semibold text-[var(--color-primary)] underline"
                          onClick={() => setMode("signin")}
                        >
                          Sign in
                        </button>
                      </>
                    ) : (
                      <>
                        New here?{" "}
                        <button
                          type="button"
                          className="font-semibold text-[var(--color-primary)] underline"
                          onClick={() => setMode("signup")}
                        >
                          Create account
                        </button>
                      </>
                    )}
                  </p>
                </>
              )
            ) : (
              <p className="text-sm text-[var(--color-fg-muted)]">
                Sign-in is temporarily unavailable. Call {SHARE_PHONE_DISPLAY}.
              </p>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[var(--color-fg-subtle)]">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline">
            Privacy
          </Link>
          .
        </p>
      </div>
    </AppShell>
  );
}

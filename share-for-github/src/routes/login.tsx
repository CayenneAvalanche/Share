import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { ShareMark } from "@/components/share/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useShareStore } from "@/lib/share/store";
import { SHARE_PHONE_DISPLAY, SHARE_PHONE_TEL } from "@/lib/share/contact";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const setRiderName = useShareStore((s) => s.setRiderName);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isPending && user) {
    if (typeof window !== "undefined") {
      queueMicrotask(() => navigate({ to: "/app" }));
    }
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 8) {
      toast.error("Use a real email and a password of at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await authClient.signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || email.split("@")[0] || "Share member",
        });
        if (error) throw new Error(error.message ?? "Sign-up failed");
        toast.success("Account created — you’re signed in");
      } else {
        const { error } = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          const msg = error.message ?? "Sign-in failed";
          // Better Auth often says invalid email/password when user doesn't exist
          if (/invalid|not found|credentials/i.test(msg)) {
            throw new Error(
              "No account with that email, or wrong password. If you never finished Create account (e.g. “Invalid origin”), create a new account. Need a reset? Use Forgot password.",
            );
          }
          throw new Error(msg);
        }
        toast.success("Signed in");
      }
      const display =
        name.trim() || email.split("@")[0] || "Share member";
      setRiderName(display);
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    } finally {
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
                  <p>
                    Self-serve email reset isn't live yet (no mail server on
                    beta). Two options:
                  </p>
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>
                      <strong className="text-[var(--color-fg)]">
                        Create account again
                      </strong>{" "}
                      if sign-up never finished (common after “Invalid origin”).
                    </li>
                    <li>
                      Call{" "}
                      <a
                        href={SHARE_PHONE_TEL}
                        className="font-semibold text-[var(--color-primary)]"
                      >
                        {SHARE_PHONE_DISPLAY}
                      </a>{" "}
                      — founder can set a temporary password from the admin
                      Accounts tab.
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
                      <div>
                        <Label htmlFor="nm">Your name</Label>
                        <Input
                          id="nm"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="How we should greet you"
                          autoComplete="name"
                        />
                      </div>
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

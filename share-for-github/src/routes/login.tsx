import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { ShareMark } from "@/components/share/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useShareStore } from "@/lib/share/store";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

/** UI order — broker-backed providers first, then upcoming ones. */
const SOCIAL_BUTTONS: {
  id: string;
  label: string;
  /** Maps to GROK_PROVIDERS.providerId when live */
  providerId?: string;
  live: boolean;
}[] = [
  { id: "apple", label: "Apple", live: false },
  {
    id: "google",
    label: "Google",
    providerId: "grok-google",
    live: GROK_PROVIDERS.some((p) => p.providerId === "grok-google"),
  },
  {
    id: "x",
    label: "X",
    providerId: "grok-x",
    live: GROK_PROVIDERS.some((p) => p.providerId === "grok-x"),
  },
  { id: "facebook", label: "Facebook", live: false },
];

function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const setRiderName = useShareStore((s) => s.setRiderName);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
        if (error) throw new Error(error.message ?? "Sign-in failed");
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

  async function onSocial(providerId: string, label: string) {
    setBusy(true);
    try {
      await signIn(providerId, {
        callbackURL: "/app",
        errorCallbackURL: "/login?err=social",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      toast.error(
        msg.includes("fetch") || msg.includes("Failed")
          ? `${label} sign-in isn’t connected on this site yet — use email below, or try again later.`
          : msg,
      );
      setBusy(false);
    }
  }

  function onComingSoon(label: string) {
    toast.message(`${label} Sign In — almost ready`, {
      description:
        "Use Google, X, or email & password for now. We’ll turn on Apple and Facebook as soon as they’re linked to Share.",
    });
  }

  return (
    <AppShell title="Sign in" subtitle="Your account" solidHeader backTo="/profile">
      <div className="mx-auto max-w-md space-y-4 py-4 pb-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 rounded-[var(--radius-xl)] bg-[#2a6b45] p-3">
            <ShareMark inverted className="size-10" />
          </div>
          <p className="font-display text-xl font-semibold">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </p>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            One account for riding and driving.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 p-5">
            {authEnabled ? (
              <>
                <div className="grid gap-2">
                  {SOCIAL_BUTTONS.map((p) => (
                    <Button
                      key={p.id}
                      type="button"
                      variant="outline"
                      className="w-full justify-center font-semibold"
                      disabled={busy}
                      onClick={() => {
                        if (!p.live || !p.providerId) {
                          onComingSoon(p.label);
                          return;
                        }
                        void onSocial(p.providerId, p.label);
                      }}
                    >
                      Continue with {p.label}
                      {!p.live ? (
                        <span className="ml-2 text-xs font-normal text-[var(--color-fg-subtle)]">
                          soon
                        </span>
                      ) : null}
                    </Button>
                  ))}
                </div>

                <div className="relative py-1 text-center text-xs text-[var(--color-fg-subtle)]">
                  <span className="bg-[var(--color-bg-elevated)] px-2">
                    or email & password
                  </span>
                </div>

                <form onSubmit={onEmailSubmit} className="space-y-3">
                  {mode === "signup" && (
                    <div>
                      <Label htmlFor="nm">Display name</Label>
                      <Input
                        id="nm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="How neighbors see you"
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
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy
                      ? "Working…"
                      : mode === "signup"
                        ? "Create account"
                        : "Sign in with email"}
                  </Button>
                </form>

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
            ) : (
              <p className="text-sm text-[var(--color-fg-muted)]">
                Sign-in is disabled on this build.
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

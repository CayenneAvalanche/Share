import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { HUB_CITIES, type InterviewMode } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { submitRiderAppFn } from "@/lib/share/server-fns";
import { PhotoField } from "@/components/share/photo-field";
import { statusLabel, useMyAppStatus } from "@/lib/share/use-my-apps";

export const Route = createFileRoute("/apply/rider")({
  component: RiderApplyPage,
});

function RiderApplyPage() {
  const submit = useShareStore((s) => s.submitRiderApp);
  const setRiderName = useShareStore((s) => s.setRiderName);
  const profileSelfie = useShareStore((s) => s.profileSelfie);
  const setProfileSelfie = useShareStore((s) => s.setProfileSelfie);
  const { canApplyRider, riderActive, riderStatus, latestRider } =
    useMyAppStatus();
  const [done, setDone] = useState(false);
  const [acceptedTos, setAcceptedTos] = useState(false);
  const [selfie, setSelfie] = useState(profileSelfie || "");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "Lafayette, LA",
    typicalRoutes: "Lafayette–Shreveport weekends",
    interviewMode: "either" as InterviewMode,
    preferredTime: "",
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.includes("@") || !form.phone.trim()) {
      toast.error("Name, email, and phone are required");
      return;
    }
    if (!acceptedTos) {
      toast.error("Please agree to the Terms and Privacy Policy to continue");
      return;
    }
    if (!selfie) {
      toast.error("Add a recent selfie so drivers can recognize you");
      return;
    }
    const payload = { ...form, selfie };
    if (selfie) setProfileSelfie(selfie);
    submit(payload);
    setRiderName(form.fullName.trim());
    try {
      await submitRiderAppFn({ data: payload as unknown as Record<string, unknown> });
      toast.success("Rider application saved to Share HQ");
    } catch {
      toast.message("Saved on this device — cloud sync pending");
    }
    setDone(true);
  }

  if (done) {
    return (
      <AppShell title="Application sent" backTo="/apply" solidHeader>
        <div className="flex flex-col items-center py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold">
            Interview is next
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-muted)]">
            Rider interviews are short — we mainly screen for major red flags and
            make sure Share is a fit. Then you’re free to book seats and local
            rides.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button asChild>
              <Link to="/rides">Browse rides</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/profile">View profile</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }


  if (!canApplyRider) {
    return (
      <AppShell title="Rider" backTo="/apply" solidHeader>
        <div className="flex flex-col items-center py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold">
            {riderActive ? "You're an active rider" : "Application on file"}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-muted)]">
            Status:{" "}
            <strong className="text-[var(--color-fg)]">
              {statusLabel(riderStatus)}
            </strong>
            {latestRider?.fullName ? ` · ${latestRider.fullName}` : ""}.
            You don't need to apply again.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button asChild>
              <a href="/profile">Back to You</a>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/rides">Browse rides</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }


  return (
    <AppShell
      title="Rider application"
      subtitle="Brief interview + major-offense screen"
      backTo="/apply"
      solidHeader
    >
      <form onSubmit={onSubmit} className="space-y-4 py-3 pb-10">
        <Card>
          <CardContent className="space-y-4 p-5">
            <PhotoField
              id="rider-selfie"
              label="Recent selfie (one photo for rider & driver)"
              hint="Clear face photo — helps drivers confirm it’s you at pickup."
              value={selfie}
              onChange={(v) => {
                setSelfie(v);
                if (v) setProfileSelfie(v);
              }}
              facing="user"
              required
            />
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Select
                id="city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              >
                {HUB_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="routes">Typical routes</Label>
              <Input
                id="routes"
                value={form.typicalRoutes}
                onChange={(e) => set("typicalRoutes", e.target.value)}
                placeholder="Campus, LFT–SHV, airport runs…"
              />
            </div>
            <div>
              <Label htmlFor="interview">Interview preference</Label>
              <Select
                id="interview"
                value={form.interviewMode}
                onChange={(e) =>
                  set("interviewMode", e.target.value as InterviewMode)
                }
              >
                <option value="in_person">In person (Lafayette area)</option>
                <option value="zoom">Quick Zoom</option>
                <option value="either">Either works</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="time">Preferred times</Label>
              <Input
                id="time"
                value={form.preferredTime}
                onChange={(e) => set("preferredTime", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
                <label className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0 accent-[var(--color-primary)]"
            checked={acceptedTos}
            onChange={(e) => setAcceptedTos(e.target.checked)}
          />
          <span className="text-[var(--color-fg-muted)]">
            I agree to Share's{" "}
            <Link to="/terms" className="font-semibold text-[var(--color-primary)] underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-semibold text-[var(--color-primary)] underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <Button type="submit" size="xl" className="w-full">
          Submit rider application
        </Button>
      </form>
    </AppShell>
  );
}

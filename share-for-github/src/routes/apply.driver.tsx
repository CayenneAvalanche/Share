import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  GIG_PLATFORM_LABELS,
  HUB_CITIES,
  PILOT_INVITE_CODES,
  type DriverGender,
  type GigPlatform,
  type InterviewMode,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { submitDriverAppFn } from "@/lib/share/server-fns";

export const Route = createFileRoute("/apply/driver")({
  component: DriverApplyPage,
});

const PLATFORMS = Object.keys(GIG_PLATFORM_LABELS) as GigPlatform[];

function DriverApplyPage() {
  const submit = useShareStore((s) => s.submitDriverApp);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "Lafayette, LA",
    vehicle: "",
    licensePlate: "",
    yearsDriving: "5+",
    corridors: "Lafayette–Shreveport",
    interviewMode: "either" as InterviewMode,
    preferredTime: "",
    notes: "",
    gender: "unspecified" as DriverGender,
    inviteCode: "",
    hasDashcam: true,
    publicBio: "",
    hometown: "Lafayette, LA",
    otherJob: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    docsNote: "",
  });
  const [platformOn, setPlatformOn] = useState<Record<string, boolean>>({
    uber: true,
    lyft: false,
    spark: false,
  });
  const [platformMeta, setPlatformMeta] = useState<
    Record<string, { years: string; trips: string; rating: string }>
  >({
    uber: { years: "2", trips: "500", rating: "4.95" },
    lyft: { years: "1", trips: "200", rating: "4.9" },
    spark: { years: "1", trips: "100", rating: "4.9" },
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
    if (!form.publicBio.trim()) {
      toast.error("Public bio helps riders trust you — add a few sentences");
      return;
    }

    const platformLines = PLATFORMS.filter((p) => platformOn[p]).map((p) => {
      const m = platformMeta[p] ?? { years: "1", trips: "0", rating: "" };
      return `${GIG_PLATFORM_LABELS[p]}: ${m.years} yrs, ~${m.trips} trips${m.rating ? `, ${m.rating}★` : ""}`;
    });

    const { hasDashcam, inviteCode, ...rest } = form;
    const payload = {
      ...rest,
      inviteCode: inviteCode || undefined,
      hasDashcam,
      platformsText: platformLines.join(" · ") || "None listed",
      notes: [
        rest.notes,
        hasDashcam ? "Dashcam: yes" : "Dashcam: no",
        form.docsNote ? `Docs: ${form.docsNote}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    };
    // Always keep local store for offline UX; Neon when available
    submit(payload);
    try {
      await submitDriverAppFn({ data: payload as Record<string, unknown> });
      toast.success("Saved to Share HQ — bio goes public after interview");
    } catch (err) {
      console.error(err);
      toast.message("Saved on this device — cloud sync pending", {
        description: "Founder can still see local apps; Neon will catch up after deploy.",
      });
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
            Next: interview + public profile
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-muted)]">
            Your bio and platform history show on trips after approval. Be honest —
            riders see it before they book.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button asChild>
              <Link to="/admin">Open founder inbox</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/app">Back to app</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Driver application"
      subtitle="Bio · platforms · interview"
      backTo="/apply"
      solidHeader
    >
      <form onSubmit={onSubmit} className="space-y-4 py-3 pb-10">
        <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <CardContent className="p-4 text-sm text-[var(--color-fg-muted)]">
            Share is personal. Riders read your <strong className="text-[var(--color-fg)]">public bio</strong> and
            other-platform history (Uber, Lyft, Spark…) before they get in the car.
            Hiding a bad rating is possible — lying in interview is a decline.
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <Label htmlFor="invite">Pilot invite</Label>
              <Input
                id="invite"
                value={form.inviteCode}
                onChange={(e) => set("inviteCode", e.target.value.toUpperCase())}
                placeholder={PILOT_INVITE_CODES[0]}
                className="uppercase"
              />
            </div>
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
              <Label htmlFor="city">Home city</Label>
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
              <Label htmlFor="hometown">Hometown / where you’re from</Label>
              <Input
                id="hometown"
                value={form.hometown}
                onChange={(e) => set("hometown", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="job">Other job / life (public)</Label>
              <Input
                id="job"
                placeholder="Shop tech, student, nurse on days off…"
                value={form.otherJob}
                onChange={(e) => set("otherJob", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bio">Public bio (riders read this)</Label>
              <Textarea
                id="bio"
                required
                rows={4}
                placeholder="Who you are, why you drive corridors, music/quiet preference, pets, kids car seats…"
                value={form.publicBio}
                onChange={(e) => set("publicBio", e.target.value)}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                No hard limit — be real. Photos can be described in notes for this demo.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Other platforms
              </h2>
              <p className="text-sm text-[var(--color-fg-muted)]">
                Uber, Lyft, Spark, Flex, Eats… years, trip volume, rating. Self-reported.
              </p>
            </div>
            {PLATFORMS.map((p) => (
              <div
                key={p}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
              >
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--color-primary)]"
                    checked={Boolean(platformOn[p])}
                    onChange={(e) =>
                      setPlatformOn((m) => ({ ...m, [p]: e.target.checked }))
                    }
                  />
                  {GIG_PLATFORM_LABELS[p]}
                </label>
                {platformOn[p] && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Years</Label>
                      <Input
                        value={platformMeta[p]?.years ?? ""}
                        onChange={(e) =>
                          setPlatformMeta((m) => ({
                            ...m,
                            [p]: {
                              years: e.target.value,
                              trips: m[p]?.trips ?? "",
                              rating: m[p]?.rating ?? "",
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">~Trips</Label>
                      <Input
                        value={platformMeta[p]?.trips ?? ""}
                        onChange={(e) =>
                          setPlatformMeta((m) => ({
                            ...m,
                            [p]: {
                              years: m[p]?.years ?? "",
                              trips: e.target.value,
                              rating: m[p]?.rating ?? "",
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Rating</Label>
                      <Input
                        placeholder="4.95"
                        value={platformMeta[p]?.rating ?? ""}
                        onChange={(e) =>
                          setPlatformMeta((m) => ({
                            ...m,
                            [p]: {
                              years: m[p]?.years ?? "",
                              trips: m[p]?.trips ?? "",
                              rating: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <Label htmlFor="gender">Gender (rider preference matching)</Label>
              <Select
                id="gender"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value as DriverGender)}
              >
                <option value="unspecified">Prefer not to say</option>
                <option value="woman">Woman</option>
                <option value="man">Man</option>
                <option value="nonbinary">Non-binary</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="cam"
                type="checkbox"
                checked={form.hasDashcam}
                onChange={(e) => set("hasDashcam", e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              <Label htmlFor="cam" className="mb-0">
                Dashcam (road and/or cabin) — badge on profile
              </Label>
            </div>
            <div>
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input
                id="vehicle"
                required
                value={form.vehicle}
                onChange={(e) => set("vehicle", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="plate">Plate</Label>
                <Input
                  id="plate"
                  value={form.licensePlate}
                  onChange={(e) => set("licensePlate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="years">Years driving</Label>
                <Select
                  id="years"
                  value={form.yearsDriving}
                  onChange={(e) => set("yearsDriving", e.target.value)}
                >
                  <option>1–2</option>
                  <option>3–4</option>
                  <option>5+</option>
                  <option>10+</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="corridors">Corridors</Label>
              <Input
                id="corridors"
                value={form.corridors}
                onChange={(e) => set("corridors", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="docs">Docs ready (license / insurance / reg)</Label>
              <Input
                id="docs"
                placeholder="License + insurance PDF ready for interview"
                value={form.docsNote}
                onChange={(e) => set("docsNote", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ec">Emergency contact name</Label>
                <Input
                  id="ec"
                  value={form.emergencyContactName}
                  onChange={(e) => set("emergencyContactName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ecp">Their phone</Label>
                <Input
                  id="ecp"
                  value={form.emergencyContactPhone}
                  onChange={(e) => set("emergencyContactPhone", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="interview">Interview</Label>
              <Select
                id="interview"
                value={form.interviewMode}
                onChange={(e) =>
                  set("interviewMode", e.target.value as InterviewMode)
                }
              >
                <option value="in_person">In person</option>
                <option value="zoom">Zoom</option>
                <option value="either">Either</option>
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
              <Label htmlFor="notes">Photo notes / anything else</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Describe vehicle photos you’ll bring; personality; kids seats…"
              />
            </div>
          </CardContent>
        </Card>
        <Button type="submit" size="xl" className="w-full">
          Submit driver application
        </Button>
      </form>
    </AppShell>
  );
}

import { useEffect, useState } from "react";
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
  VEHICLE_TYPES,
} from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { pushMyVehiclesToCloud } from "@/lib/share/sync-vehicles";
import { submitDriverAppFn } from "@/lib/share/server-fns";
import { PhotoField } from "@/components/share/photo-field";
import { statusLabel, useMyAppStatus } from "@/lib/share/use-my-apps";

export const Route = createFileRoute("/apply/driver")({
  component: DriverApplyPage,
});

const PLATFORMS = Object.keys(GIG_PLATFORM_LABELS) as GigPlatform[];

function DriverApplyPage() {
  const submit = useShareStore((s) => s.submitDriverApp);
  const profileSelfie = useShareStore((s) => s.profileSelfie);
  const setProfileSelfie = useShareStore((s) => s.setProfileSelfie);
  const { canApplyDriver, driverActive, driverStatus, latestDriver } =
    useMyAppStatus();
  const [done, setDone] = useState(false);
  const [acceptedTos, setAcceptedTos] = useState(false);
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
  const [licenseFront, setLicenseFront] = useState("");
  const [licenseBack, setLicenseBack] = useState("");
  const [insuranceCard, setInsuranceCard] = useState("");
  const [selfie, setSelfie] = useState(profileSelfie || "");
  const [vehiclePhoto, setVehiclePhoto] = useState("");
  const [vehicleType, setVehicleType] = useState("SUV / Crossover");
  useEffect(() => {
    if (profileSelfie && !selfie) setSelfie(profileSelfie);
  }, [profileSelfie, selfie]);
  /** never = not listed · active · inactive (used to drive but not now) */
  const [platformStatus, setPlatformStatus] = useState<
    Record<GigPlatform, "never" | "active" | "inactive">
  >(() => {
    const init = {} as Record<GigPlatform, "never" | "active" | "inactive">;
    for (const p of PLATFORMS) init[p] = "never";
    return init;
  });
  const [platformMeta, setPlatformMeta] = useState<
    Record<string, { years: string; trips: string; rating: string }>
  >(() => {
    const init: Record<string, { years: string; trips: string; rating: string }> =
      {};
    for (const p of PLATFORMS) {
      init[p] = { years: "", trips: "", rating: "" };
    }
    return init;
  });
  const [vehicleExtras, setVehicleExtras] = useState<string[]>([]);

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
    if (!acceptedTos) {
      toast.error("Please agree to the Terms and Privacy Policy to continue");
      return;
    }
    if (!selfie) {
      toast.error("Add a recent selfie so riders can recognize you");
      return;
    }
    if (!licenseFront || !licenseBack || !insuranceCard) {
      toast.error("Upload front & back of your license and your insurance card");
      return;
    }

    const platformLines = PLATFORMS.filter(
      (p) => platformStatus[p] && platformStatus[p] !== "never",
    ).map((p) => {
      const m = platformMeta[p] ?? { years: "1", trips: "0", rating: "" };
      const st = platformStatus[p] === "active" ? "ACTIVE" : "NOT ACTIVE";
      return `${GIG_PLATFORM_LABELS[p]} (${st}): ${m.years} yrs, ~${m.trips} trips${m.rating ? `, ${m.rating}★` : ""}`;
    });

    const { hasDashcam, inviteCode, ...rest } = form;
    const payload = {
      ...rest,
      inviteCode: inviteCode || undefined,
      hasDashcam,
      platformsText: platformLines.join(" · ") || "None listed",
      selfie,
      vehiclePhoto: vehiclePhoto || undefined,
      vehicleType,
      licenseFront,
      licenseBack,
      insuranceCard,
      docsNote: form.docsNote || "License front/back + insurance uploaded",
      notes: [
        rest.notes,
        hasDashcam ? "Dashcam: yes" : "Dashcam: no",
        "Docs: license front/back + insurance card attached",
        vehicleExtras.length
          ? `Extra vehicle photos: ${vehicleExtras.length}`
          : "",
      ]
        .filter(Boolean)
        .join(" | "),
    };
    // Always keep local store for offline UX; Neon when available
    if (selfie) setProfileSelfie(selfie);
    submit(payload);
    // Garage photo must leave this phone
    void pushMyVehiclesToCloud(form.email);
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


  if (!canApplyDriver) {
    return (
      <AppShell title="Driver" backTo="/apply" solidHeader>
        <div className="flex flex-col items-center py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold">
            {driverActive ? "You're an active driver" : "Application on file"}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-muted)]">
            Status:{" "}
            <strong className="text-[var(--color-fg)]">
              {statusLabel(driverStatus)}
            </strong>
            {latestDriver?.fullName ? ` · ${latestDriver.fullName}` : ""}.
            You don't need to apply again.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button asChild>
              <a href="/profile">Back to You</a>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/rides/post">Post a trip</Link>
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
              <p className="mt-1.5 text-xs text-[var(--color-fg-subtle)]">
                Includes Lafayette and Las Vegas pilot markets — pick the city
                you drive from most.
              </p>
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
                Mark each Active, Not active (past), or Never. Details only if listed.
              </p>
            </div>
            {PLATFORMS.map((p) => {
              const st = platformStatus[p] ?? "never";
              const listed = st !== "never";
              return (
                <div
                  key={p}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                >
                  <p className="text-sm font-medium">{GIG_PLATFORM_LABELS[p]}</p>
                  <div
                    className="mt-2 grid grid-cols-3 gap-2"
                    role="radiogroup"
                    aria-label={`${GIG_PLATFORM_LABELS[p]} status`}
                  >
                    {(
                      [
                        ["never", "Never"],
                        ["active", "Active"],
                        ["inactive", "Not active"],
                      ] as const
                    ).map(([val, label]) => {
                      const selected = st === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPlatformStatus((m) => ({ ...m, [p]: val }));
                            // Ensure meta row exists when they list a platform
                            if (val !== "never") {
                              setPlatformMeta((m) => ({
                                ...m,
                                [p]: m[p] ?? {
                                  years: "",
                                  trips: "",
                                  rating: "",
                                },
                              }));
                            }
                          }}
                          className={`min-h-11 rounded-[var(--radius-md)] px-2 py-2 text-xs font-bold touch-manipulation transition-colors ${
                            selected
                              ? val === "active"
                                ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-sm"
                                : val === "inactive"
                                  ? "bg-[var(--color-fg)] text-[var(--color-bg)] shadow-sm"
                                  : "bg-[var(--color-bg-subtle)] text-[var(--color-fg)] ring-2 ring-[var(--color-primary)]"
                              : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)] ring-1 ring-[var(--color-border)]"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {listed && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Years</Label>
                        <Input
                          inputMode="decimal"
                          placeholder="2"
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
                          inputMode="numeric"
                          placeholder="500"
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
                          inputMode="decimal"
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
              );
            })}
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
            <PhotoField
              id="driver-car-photo"
              label="Photo of your car"
              hint="Take a live photo first — then upload more angles from your library."
              value={vehiclePhoto}
              onChange={setVehiclePhoto}
              extras={vehicleExtras}
              onExtrasChange={setVehicleExtras}
              maxExtras={6}
              facing="environment"
              kind="vehicle"
              captureFirst
              required
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="vtype">Vehicle type</Label>
                <Select
                  id="vtype"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle">Year / make / model</Label>
                <Input
                  id="vehicle"
                  required
                  value={form.vehicle}
                  onChange={(e) => set("vehicle", e.target.value)}
                  placeholder="e.g. 2018 Honda CR-V"
                />
              </div>
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
            <PhotoField
              id="driver-selfie"
              label="Recent selfie (one photo for rider & driver)"
              captureFirst
              hint="Clear face photo — riders match this to you at pickup."
              value={selfie}
              onChange={(v) => {
                setSelfie(v);
                if (v) setProfileSelfie(v);
              }}
              facing="user"
              required
            />
            <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50 p-3">
              <div>
                <p className="text-sm font-semibold">Required ID documents</p>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Clear photos of your driver license (front and back) and insurance
                  card. Camera or photo library — only Share HQ sees these during
                  review.
                </p>
              </div>
              <PhotoField
                id="license-front"
                label="License — front"
                value={licenseFront}
                onChange={setLicenseFront}
                facing="environment"
                kind="document"
                captureFirst={false}
                required
              />
              <PhotoField
                id="license-back"
                label="License — back"
                value={licenseBack}
                onChange={setLicenseBack}
                facing="environment"
                kind="document"
                captureFirst={false}
                required
              />
              <PhotoField
                id="insurance-card"
                label="Insurance card"
                value={insuranceCard}
                onChange={setInsuranceCard}
                facing="environment"
                kind="document"
                captureFirst={false}
                required
              />
              <div>
                <Label htmlFor="docs">Optional note</Label>
                <Input
                  id="docs"
                  placeholder="e.g. insurance expires March 2027"
                  value={form.docsNote}
                  onChange={(e) => set("docsNote", e.target.value)}
                />
              </div>
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
            , including interview screening and independent-contractor status for drivers.
          </span>
        </label>

        <Button type="submit" size="xl" className="w-full">
          Submit driver application
        </Button>
      </form>
    </AppShell>
  );
}

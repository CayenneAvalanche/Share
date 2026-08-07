import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  CheckCircle2,
  Calendar,
  XCircle,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { VOLUNTEER_LABELS } from "@/lib/share/data";
import { useShareStore } from "@/lib/share/store";
import { formatCurrency } from "@/lib/utils";
import {
  listApplicationsFn,
  setDriverAppStatusFn,
  setRiderAppStatusFn,
  dbHealthFn,
  verifyFounderPinFn,
} from "@/lib/share/server-fns";
import { isDemoMode } from "@/lib/share/mode";
import type { DriverApplication, RiderApplication } from "@/lib/share/data";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Tab =
  | "drivers"
  | "riders"
  | "deliveries"
  | "local"
  | "volunteer"
  | "waitlist";

function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState<Tab>("drivers");
  const [cloudDrivers, setCloudDrivers] = useState<DriverApplication[] | null>(null);
  const [cloudRiders, setCloudRiders] = useState<RiderApplication[] | null>(null);
  const [cloudWaitlist, setCloudWaitlist] = useState<string[] | null>(null);
  const [dbOk, setDbOk] = useState("…");

  const localDriverApps = useShareStore((s) => s.driverApps);
  const localRiderApps = useShareStore((s) => s.riderApps);
  const deliveries = useShareStore((s) => s.deliveries);
  const localRides = useShareStore((s) => s.localRides);
  const localWaitlist = useShareStore((s) => s.waitlistEmails);
  const driverApps = cloudDrivers ?? localDriverApps;
  const riderApps = cloudRiders ?? localRiderApps;
  const waitlistEmails = cloudWaitlist ?? localWaitlist;
  const volunteerRides = useShareStore((s) => s.volunteerRides);
  const claimVolunteer = useShareStore((s) => s.claimVolunteer);
  const forceEscalateVolunteer = useShareStore((s) => s.forceEscalateVolunteer);
  const processVolunteerEscalations = useShareStore(
    (s) => s.processVolunteerEscalations,
  );
  const advanceDelivery = useShareStore((s) => s.advanceDelivery);
  const setDriverAppStatus = useShareStore((s) => s.setDriverAppStatus);
  const setRiderAppStatus = useShareStore((s) => s.setRiderAppStatus);
  const setLocalRideStatus = useShareStore((s) => s.setLocalRideStatus);
  const resetDemo = useShareStore((s) => s.resetDemo);

  const pendingCount = useMemo(() => {
    return (
      driverApps.filter(
        (a) => a.status === "pending_interview" || a.status === "scheduled",
      ).length +
      riderApps.filter(
        (a) => a.status === "pending_interview" || a.status === "scheduled",
      ).length +
      deliveries.filter((d) => d.status === "open").length +
      localRides.filter((r) => r.status === "broadcasting").length +
      volunteerRides.filter(
        (r) =>
          r.status === "seeking_volunteer" || r.status === "escalated_paid",
      ).length
    );
  }, [driverApps, riderApps, deliveries, localRides, volunteerRides]);


  async function refreshCloud(p: string) {
    try {
      const health = await dbHealthFn();
      setDbOk(
        health.ok
          ? `DB: ${health.source}`
          : `DB error: ${"error" in health ? health.error : "?"}`,
      );
      const res = await listApplicationsFn({ data: { pin: p } });
      setCloudDrivers(res.drivers);
      setCloudRiders(res.riders);
      setCloudWaitlist(res.waitlistEmails);
      toast.message(
        `Cloud · ${res.drivers.length} drivers · ${res.riders.length} riders`,
      );
    } catch (e) {
      setDbOk("DB offline / local only");
      console.error(e);
    }
  }

  if (!unlocked) {
    return (
      <AppShell
        title="Founder inbox"
        subtitle="Admin"
        backTo="/profile"
        solidHeader
        hideNav
      >
        <Card className="mt-8">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                <Shield className="size-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">
                  Unlock inbox
                </h2>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  Founder PIN for pilot demos
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Your founder PIN"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void (async () => {
                      try {
                        await verifyFounderPinFn({ data: { pin } });
                        setUnlocked(true);
                        toast.success("Inbox unlocked");
                        void refreshCloud(pin);
                      } catch {
                        toast.error("Wrong PIN");
                      }
                    })();
                  }
                }}
              />
              <p className="mt-1 text-xs text-[var(--color-fg-subtle)]">
                PIN matches Netlify env <code className="text-[var(--color-fg)]">FOUNDER_PIN</code>
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                void (async () => {
                  try {
                    await verifyFounderPinFn({ data: { pin } });
                    setUnlocked(true);
                    toast.success("Inbox unlocked");
                    void refreshCloud(pin);
                  } catch {
                    toast.error("Wrong PIN");
                  }
                })();
              }}
            >
              Unlock
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#b42318]/40 text-[#b42318]"
              onClick={() => {
                if (confirm("Reset demo data and reload?")) resetDemo();
              }}
            >
              Reset demo (no PIN needed)
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "drivers", label: "Drivers" },
    { id: "riders", label: "Riders" },
    { id: "deliveries", label: "Deliveries" },
    { id: "local", label: "Local" },
    { id: "volunteer", label: "Volunteer" },
    { id: "waitlist", label: "Waitlist" },
  ];

  return (
    <AppShell
      title="Founder inbox"
      subtitle={`${pendingCount} open · ${dbOk} · ${isDemoMode() ? "demo" : "beta"}`}
      backTo="/profile"
      solidHeader
      action={
        isDemoMode() ? (
          <Button
            size="sm"
            variant="outline"
            className="border-[#b42318]/40 text-[#b42318]"
            onClick={() => {
              if (confirm("Reset all demo data and reload?")) resetDemo();
            }}
          >
            Reset
          </Button>
        ) : undefined
      }
    >
      <div className="mt-3 flex gap-1 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === t.id
                ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "drivers" && (
        <section className="mt-3 space-y-3 pb-8">
          {driverApps.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    {a.selfie ? (
                      <img
                        src={a.selfie}
                        alt=""
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : null}
                    <div>
                      <p className="font-semibold">{a.fullName}</p>
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        {a.city} · {a.vehicle}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {a.status.replace("_", " ")}
                  </Badge>
                </div>
                {a.publicBio && (
                  <p className="line-clamp-2 text-xs text-[var(--color-fg-muted)]">
                    {a.publicBio}
                  </p>
                )}
                {a.platformsText && (
                  <p className="text-xs text-[var(--color-fg-subtle)]">
                    {a.platformsText}
                  </p>
                )}
                {(a.licenseFront || a.licenseBack || a.insuranceCard) && (
                  <div className="grid grid-cols-3 gap-2">
                    {a.licenseFront && (
                      <a href={a.licenseFront} target="_blank" rel="noreferrer">
                        <img
                          src={a.licenseFront}
                          alt="License front"
                          className="h-20 w-full rounded border object-cover"
                        />
                        <p className="mt-0.5 text-[10px] text-[var(--color-fg-subtle)]">
                          License front
                        </p>
                      </a>
                    )}
                    {a.licenseBack && (
                      <a href={a.licenseBack} target="_blank" rel="noreferrer">
                        <img
                          src={a.licenseBack}
                          alt="License back"
                          className="h-20 w-full rounded border object-cover"
                        />
                        <p className="mt-0.5 text-[10px] text-[var(--color-fg-subtle)]">
                          License back
                        </p>
                      </a>
                    )}
                    {a.insuranceCard && (
                      <a href={a.insuranceCard} target="_blank" rel="noreferrer">
                        <img
                          src={a.insuranceCard}
                          alt="Insurance"
                          className="h-20 w-full rounded border object-cover"
                        />
                        <p className="mt-0.5 text-[10px] text-[var(--color-fg-subtle)]">
                          Insurance
                        </p>
                      </a>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const interviewAt = new Date(
                        Date.now() + 86400000,
                      ).toISOString();
                      setDriverAppStatus(a.id, "scheduled", { interviewAt });
                      void setDriverAppStatusFn({
                        data: {
                          pin,
                          id: a.id,
                          status: "scheduled",
                          interviewAt,
                        },
                      })
                        .then(() => refreshCloud(pin))
                        .catch(() => {});
                      toast.success("Interview scheduled");
                    }}
                  >
                    <Calendar className="size-3.5" />
                    Schedule
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setDriverAppStatus(a.id, "active");
                      void setDriverAppStatusFn({
                        data: { pin, id: a.id, status: "active" },
                      })
                        .then(() => refreshCloud(pin))
                        .catch(() => {});
                      toast.success("Approved & Active");
                    }}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDriverAppStatus(a.id, "declined");
                      void setDriverAppStatusFn({
                        data: { pin, id: a.id, status: "declined" },
                      })
                        .then(() => refreshCloud(pin))
                        .catch(() => {});
                      toast.message("Declined");
                    }}
                  >
                    <XCircle className="size-3.5" />
                    Decline
                  </Button>
                  {(a.status === "approved" ||
                    a.status === "active" ||
                    a.status === "inactive") && (
                    <>
                      <Button
                        size="sm"
                        variant={a.status === "active" ? "default" : "outline"}
                        onClick={() => {
                          setDriverAppStatus(a.id, "active");
                          void setDriverAppStatusFn({
                            data: { pin, id: a.id, status: "active" },
                          })
                            .then(() => refreshCloud(pin))
                            .catch(() => {});
                          toast.success("Driver Active — can take trips");
                        }}
                      >
                        Active
                      </Button>
                      <Button
                        size="sm"
                        variant={a.status === "inactive" ? "secondary" : "outline"}
                        onClick={() => {
                          setDriverAppStatus(a.id, "inactive");
                          void setDriverAppStatusFn({
                            data: { pin, id: a.id, status: "inactive" },
                          })
                            .then(() => refreshCloud(pin))
                            .catch(() => {});
                          toast.message("Driver Inactive — paused");
                        }}
                      >
                        Not active
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {tab === "riders" && (
        <section className="mt-3 space-y-3 pb-8">
          {riderApps.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    {a.selfie ? (
                      <img
                        src={a.selfie}
                        alt=""
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : null}
                    <p className="font-semibold">{a.fullName}</p>
                  </div>
                  <Badge variant="outline">{a.status}</Badge>
                </div>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {a.city} · {a.typicalRoutes}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setRiderAppStatus(a.id, "approved");
                      void setRiderAppStatusFn({
                        data: { pin, id: a.id, status: "approved" },
                      })
                        .then(() => refreshCloud(pin))
                        .catch(() => {});
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRiderAppStatus(a.id, "declined");
                      void setRiderAppStatusFn({
                        data: { pin, id: a.id, status: "declined" },
                      })
                        .then(() => refreshCloud(pin))
                        .catch(() => {});
                    }}
                  >
                    Decline
                  </Button>
                  {(a.status === "approved" ||
                    a.status === "active" ||
                    a.status === "inactive") && (
                    <>
                      <Button
                        size="sm"
                        variant={a.status === "active" ? "default" : "outline"}
                        onClick={() => {
                          setRiderAppStatus(a.id, "active");
                          void setRiderAppStatusFn({
                            data: { pin, id: a.id, status: "active" },
                          })
                            .then(() => refreshCloud(pin))
                            .catch(() => {});
                        }}
                      >
                        Active
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRiderAppStatus(a.id, "inactive");
                          void setRiderAppStatusFn({
                            data: { pin, id: a.id, status: "inactive" },
                          })
                            .then(() => refreshCloud(pin))
                            .catch(() => {});
                        }}
                      >
                        Not active
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {tab === "deliveries" && (
        <section className="mt-3 space-y-3 pb-8">
          {deliveries.map((d) => (
            <Card key={d.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between">
                  <p className="font-semibold">{d.item}</p>
                  <Badge>{d.status}</Badge>
                </div>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {d.from} → {d.to} · {formatCurrency(d.offer)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      advanceDelivery(d.id, "matched", undefined, "Founder")
                    }
                  >
                    Match
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => advanceDelivery(d.id, "delivered")}
                  >
                    Mark delivered
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      to="/track/$code"
                      params={{ code: d.trackingCode ?? d.id }}
                    >
                      Track
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {tab === "local" && (
        <section className="mt-3 space-y-3 pb-8">
          {localRides.length === 0 && (
            <p className="text-sm text-[var(--color-fg-muted)]">
              No local broadcasts yet.
            </p>
          )}
          {localRides.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-4">
                <p className="font-semibold">
                  {r.pickup} → {r.dropoff}
                </p>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {formatCurrency(r.sharePrice)} Share · Uber ~
                  {formatCurrency(r.uberEstimate)}
                </p>
                <Button
                  size="sm"
                  onClick={() =>
                    setLocalRideStatus(r.id, "matched", "Assigned")
                  }
                >
                  Match driver
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {tab === "volunteer" && (
        <section className="mt-3 space-y-3 pb-8">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const n = processVolunteerEscalations();
              toast.message(
                n ? `${n} escalated to paid` : "None ready to escalate",
              );
            }}
          >
            Process escalations
          </Button>
          {volunteerRides.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between">
                  <p className="font-semibold">
                    {r.pickup} → {r.dropoff}
                  </p>
                  <Badge>{r.status}</Badge>
                </div>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {VOLUNTEER_LABELS[r.category]} · {r.requesterName}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      claimVolunteer(r.id, "Founder match");
                      toast.success("Matched");
                    }}
                  >
                    Claim free
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => forceEscalateVolunteer(r.id)}
                  >
                    Force paid
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {tab === "waitlist" && (
        <section className="mt-3 space-y-2 pb-8">
          {waitlistEmails.length === 0 && (
            <p className="text-sm text-[var(--color-fg-muted)]">Empty waitlist.</p>
          )}
          {waitlistEmails.map((e) => (
            <Card key={e}>
              <CardContent className="flex items-center gap-2 p-3 text-sm">
                <Mail className="size-4 text-[var(--color-primary)]" />
                {e}
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </AppShell>
  );
}

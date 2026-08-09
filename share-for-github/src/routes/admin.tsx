import { useEffect, useMemo, useState } from "react";
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
  listAuthUsersFn,
  founderResetPasswordFn,
  deleteDriverAppFn,
  deleteRiderAppFn,
  listOnlineDriversFn,
  listVolunteerRidesFn,
  claimVolunteerRideFn,
  cancelVolunteerRideFn,
  escalateVolunteerRideFn,
  founderDeleteVolunteerRideFn,
} from "@/lib/share/server-fns";
import { isDemoMode } from "@/lib/share/mode";
import { SHARE_BUILD } from "@/lib/share/contact";
import type {
  DriverApplication,
  RiderApplication,
  VolunteerRide,
} from "@/lib/share/data";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Tab =
  | "drivers"
  | "riders"
  | "deliveries"
  | "local"
  | "volunteer"
  | "trips"
  | "waitlist"
  | "accounts";

function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState<Tab>("drivers");
  const [cloudDrivers, setCloudDrivers] = useState<DriverApplication[] | null>(null);
  const [cloudRiders, setCloudRiders] = useState<RiderApplication[] | null>(null);
  const [cloudWaitlist, setCloudWaitlist] = useState<string[] | null>(null);
  const [dbOk, setDbOk] = useState("…");
  const [onlineDrivers, setOnlineDrivers] = useState<
    { id: string; displayName: string; city: string; email?: string; updatedAt: string }[]
  >([]);
  const [authUsers, setAuthUsers] = useState<
    { id: string; name: string; email: string; createdAt: string }[]
  >([]);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPass, setResetPass] = useState("");

  const localDriverApps = useShareStore((s) => s.driverApps);
  const localRiderApps = useShareStore((s) => s.riderApps);
  const deliveries = useShareStore((s) => s.deliveries);
  const localRides = useShareStore((s) => s.localRides);
  const localWaitlist = useShareStore((s) => s.waitlistEmails);
  const driverApps = cloudDrivers ?? localDriverApps;
  const riderApps = cloudRiders ?? localRiderApps;
  const waitlistEmails = cloudWaitlist ?? localWaitlist;
  const localVolunteerRides = useShareStore((s) => s.volunteerRides);
  const [cloudVolunteers, setCloudVolunteers] = useState<
    VolunteerRide[] | null
  >(null);
  const volunteerRides = useMemo(() => {
    if (!cloudVolunteers) return localVolunteerRides;
    const byId = new Map<string, VolunteerRide>();
    for (const r of localVolunteerRides) byId.set(r.id, r);
    for (const r of cloudVolunteers) byId.set(r.id, r); // cloud wins
    return Array.from(byId.values()).sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || ""),
    );
  }, [cloudVolunteers, localVolunteerRides]);
  const trips = useShareStore((s) => s.trips);
  const rideRequests = useShareStore((s) => s.rideRequests);
  const deleteTrip = useShareStore((s) => s.deleteTrip);
  const claimVolunteer = useShareStore((s) => s.claimVolunteer);
  const forceEscalateVolunteer = useShareStore((s) => s.forceEscalateVolunteer);
  const processVolunteerEscalations = useShareStore(
    (s) => s.processVolunteerEscalations,
  );
  const cancelVolunteerRide = useShareStore((s) => s.cancelVolunteerRide);
  const advanceDelivery = useShareStore((s) => s.advanceDelivery);
  const setDriverAppStatus = useShareStore((s) => s.setDriverAppStatus);
  const removeDriverApp = useShareStore((s) => s.removeDriverApp);
  const removeRiderApp = useShareStore((s) => s.removeRiderApp);
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

  useEffect(() => {
    if (!unlocked || !pin) return;
    let cancelled = false;
    function loadOnline() {
      listOnlineDriversFn({ data: { pin } })
        .then((r) => {
          if (!cancelled) setOnlineDrivers(r.drivers);
        })
        .catch(() => {
          if (!cancelled) setOnlineDrivers([]);
        });
    }
    loadOnline();
    const id = setInterval(loadOnline, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [unlocked, pin, tab]);



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
      let volCount = 0;
      try {
        const vols = await listVolunteerRidesFn();
        setCloudVolunteers(vols.rides);
        useShareStore.setState({ volunteerRides: vols.rides });
        volCount = vols.rides.length;
      } catch {
        /* older deploys */
      }
      try {
        const acc = await listAuthUsersFn({ data: { pin: p } });
        setAuthUsers(acc.users);
      } catch {
        /* older deploys */
      }
      toast.message(
        `Cloud · ${res.drivers.length} drivers · ${res.riders.length} riders · ${volCount} volunteer`,
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
                  Enter your access PIN
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
    { id: "volunteer", label: "Volunteer" },
    { id: "trips", label: "Trips" },
    { id: "deliveries", label: "Deliveries" },
    { id: "local", label: "Local" },
    { id: "waitlist", label: "Waitlist" },
    { id: "accounts", label: "Accounts" },
  ];

  return (
    <AppShell
      title="Founder inbox"
      subtitle={`${pendingCount} open · ${dbOk} · ${isDemoMode() ? "demo" : "beta"} · ${SHARE_BUILD}`}
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
          {driverApps.length === 0 && (
            <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-fg-muted)]">
              No driver applications.
            </p>
          )}
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#b42318]/40 text-[#b42318]"
                    onClick={() => {
                      if (
                        !confirm(
                          `Permanently delete driver application for ${a.fullName}?`,
                        )
                      )
                        return;
                      removeDriverApp(a.id);
                      void deleteDriverAppFn({ data: { pin, id: a.id } })
                        .then(() => {
                          refreshCloud(pin);
                          toast.success("Driver application deleted");
                        })
                        .catch((e) =>
                          toast.error(
                            e instanceof Error ? e.message : "Delete failed",
                          ),
                        );
                    }}
                  >
                    Delete
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
          {riderApps.length === 0 && (
            <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-fg-muted)]">
              No rider applications.
            </p>
          )}
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#b42318]/40 text-[#b42318]"
                    onClick={() => {
                      if (
                        !confirm(
                          `Permanently delete rider application for ${a.fullName}?`,
                        )
                      )
                        return;
                      removeRiderApp(a.id);
                      void deleteRiderAppFn({ data: { pin, id: a.id } })
                        .then(() => {
                          refreshCloud(pin);
                          toast.success("Rider application deleted");
                        })
                        .catch((e) =>
                          toast.error(
                            e instanceof Error ? e.message : "Delete failed",
                          ),
                        );
                    }}
                  >
                    Delete
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
          <Card className="border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5">
            <CardContent className="space-y-2 p-4">
              <p className="font-semibold">
                Drivers online now · {onlineDrivers.length}
              </p>
              <p className="text-xs text-[var(--color-fg-muted)]">
                Active drivers who tapped Go available on Local (last 30 min).
                Auto-refreshes.
              </p>
              {onlineDrivers.length === 0 && (
                <p className="text-sm text-[var(--color-fg-muted)]">
                  No drivers online right now.
                </p>
              )}
              {onlineDrivers.map((d) => (
                <div
                  key={d.id}
                  className="flex items-start justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{d.displayName}</p>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      {d.city}
                      {d.email ? ` · ${d.email}` : ""}
                    </p>
                  </div>
                  <Badge variant="success">Online</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-subtle)]">
            Ride requests
          </p>
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
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void refreshCloud(pin)}
            >
              Refresh cloud list
            </Button>
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
          </div>
          {volunteerRides.length === 0 && (
            <p className="text-sm text-[var(--color-fg-muted)]">
              No volunteer requests yet. New requests from the app show here
              after Refresh.
            </p>
          )}
          {(() => {
            const openRides = volunteerRides.filter(
              (r) =>
                r.status === "seeking_volunteer" ||
                r.status === "escalated_paid",
            );
            const historyRides = volunteerRides.filter(
              (r) =>
                r.status === "cancelled" ||
                r.status === "matched" ||
                r.status === "completed",
            );
            const renderRide = (r: VolunteerRide) => {
              const open =
                r.status === "seeking_volunteer" ||
                r.status === "escalated_paid";
              return (
                <Card key={r.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {r.fullName || r.requesterName}
                        </p>
                        <p className="text-sm text-[var(--color-fg-muted)]">
                          {r.pickup} → {r.dropoff}
                        </p>
                        <p className="text-sm text-[var(--color-fg-muted)]">
                          {(VOLUNTEER_LABELS as Record<string, string>)[
                            r.category
                          ] ?? r.category}{" "}
                          · {r.phone}
                        </p>
                      </div>
                      <Badge
                        variant={
                          r.status === "cancelled"
                            ? "outline"
                            : r.status === "matched" ||
                                r.status === "completed"
                              ? "success"
                              : "default"
                        }
                      >
                        {r.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      When: {r.when}
                      {r.notes ? ` · Notes: ${r.notes}` : ""}
                      {r.matchedDriverName
                        ? ` · Matched: ${r.matchedDriverName}`
                        : ""}
                    </p>
                    <p className="text-[10px] text-[var(--color-fg-subtle)]">
                      ID {r.id} · created {r.createdAt?.slice(0, 16) || "—"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {open && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              claimVolunteer(r.id, "Founder match");
                              void claimVolunteerRideFn({
                                data: {
                                  id: r.id,
                                  driverName: "Founder match",
                                },
                              }).catch(() => {});
                              toast.success("Matched");
                              void refreshCloud(pin);
                            }}
                          >
                            Claim free
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              forceEscalateVolunteer(r.id);
                              void escalateVolunteerRideFn({
                                data: { id: r.id },
                              }).catch(() => {});
                              toast.message("Escalated to paid");
                              void refreshCloud(pin);
                            }}
                          >
                            Force paid
                          </Button>
                          <Button size="sm" variant="secondary" asChild>
                            <Link
                              to={
                                `/volunteer/new?edit=${encodeURIComponent(r.id)}` as "/volunteer/new"
                              }
                            >
                              Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (
                                !confirm(
                                  `Cancel request for ${r.fullName || r.requesterName}? It stays in History.`,
                                )
                              )
                                return;
                              cancelVolunteerRide(r.id);
                              void cancelVolunteerRideFn({
                                data: { id: r.id },
                              })
                                .then(() => {
                                  toast.success(
                                    "Cancelled — saved in History below",
                                  );
                                  void refreshCloud(pin);
                                })
                                .catch(() =>
                                  toast.error(
                                    "Cloud cancel failed — try again",
                                  ),
                                );
                            }}
                          >
                            Cancel (keep history)
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#b42318]/40 text-[#b42318]"
                        onClick={() => {
                          if (
                            !confirm(
                              `Permanently delete ${r.fullName || r.id}? This removes them from History too.`,
                            )
                          )
                            return;
                          void founderDeleteVolunteerRideFn({
                            data: { pin, id: r.id },
                          })
                            .then(() => {
                              cancelVolunteerRide(r.id);
                              setCloudVolunteers((prev) =>
                                (prev ?? []).filter((x) => x.id !== r.id),
                              );
                              useShareStore.setState((s) => ({
                                volunteerRides: s.volunteerRides.filter(
                                  (x) => x.id !== r.id,
                                ),
                              }));
                              toast.success("Permanently deleted");
                            })
                            .catch((e) =>
                              toast.error(
                                e instanceof Error
                                  ? e.message
                                  : "Delete failed",
                              ),
                            );
                        }}
                      >
                        Delete forever
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            };
            return (
              <>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Open ({openRides.length})
                  </h3>
                  <div className="space-y-3">
                    {openRides.length === 0 ? (
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        No open requests.
                      </p>
                    ) : (
                      openRides.map(renderRide)
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="mb-1 text-sm font-semibold">
                    History ({historyRides.length})
                  </h3>
                  <p className="mb-2 text-xs text-[var(--color-fg-muted)]">
                    Cancelled, matched, and completed rides stay here for your
                    records (Chloe and every free-ride request). Use Delete
                    forever only if you need them gone.
                  </p>
                  <div className="space-y-3">
                    {historyRides.length === 0 ? (
                      <p className="text-sm text-[var(--color-fg-muted)]">
                        No history yet — cancelled rides will appear here.
                      </p>
                    ) : (
                      historyRides.map(renderRide)
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </section>
      )}

      {tab === "trips" && (
        <section className="mt-3 space-y-4 pb-8">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Trip posts</h3>
            <p className="mb-3 text-xs text-[var(--color-fg-muted)]">
              Corridor / posted trips on this device (and demo seeds). Delete
              removes them from the live list on this phone.
            </p>
            {trips.length === 0 && (
              <p className="text-sm text-[var(--color-fg-muted)]">
                No trip posts.
              </p>
            )}
            <div className="space-y-3">
              {trips.map((t) => (
                <Card key={t.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {t.fromShort || t.from} → {t.toShort || t.to}
                        </p>
                        <p className="text-sm text-[var(--color-fg-muted)]">
                          {t.departAt?.slice(0, 16) || "—"} ·{" "}
                          {t.seatsAvailable}/{t.seatsTotal} seats · $
                          {t.pricePerSeat}/seat
                        </p>
                        <p className="text-xs text-[var(--color-fg-subtle)]">
                          {t.postedByName || t.driverId}
                          {t.postedByEmail ? ` · ${t.postedByEmail}` : ""} ·{" "}
                          {t.id}
                        </p>
                      </div>
                      <Badge variant="outline">{t.type}</Badge>
                    </div>
                    {t.notes && (
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        {t.notes}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" asChild>
                        <Link to="/rides/$id" params={{ id: t.id }}>
                          View
                        </Link>
                      </Button>
                      {t.id.startsWith("user_") && (
                        <Button size="sm" variant="secondary" asChild>
                          <Link to="/rides/$id" params={{ id: t.id }}>
                            Edit on trip page
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#b42318]/40 text-[#b42318]"
                        onClick={() => {
                          if (
                            !confirm(
                              `Delete trip ${t.fromShort || t.from} → ${t.toShort || t.to}?`,
                            )
                          )
                            return;
                          if (deleteTrip(t.id)) toast.success("Trip deleted");
                          else toast.error("Could not delete");
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Ride requests</h3>
            <p className="mb-3 text-xs text-[var(--color-fg-muted)]">
              Corridor / “I need a ride” requests on this device.
            </p>
            {rideRequests.length === 0 && (
              <p className="text-sm text-[var(--color-fg-muted)]">
                No ride requests.
              </p>
            )}
            <div className="space-y-3">
              {rideRequests.map((r) => (
                <Card key={r.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex justify-between gap-2">
                      <p className="font-semibold">
                        {r.from} → {r.to}
                      </p>
                      <Badge>{r.status}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-fg-muted)]">
                      {r.requesterName} · need by{" "}
                      {r.neededBy?.slice(0, 10) || "flexible"} · {r.seats} seat
                      {r.seats === 1 ? "" : "s"}
                    </p>
                    {r.notes && (
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        {r.notes}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" asChild>
                        <Link
                          to="/rides/requests/$id"
                          params={{ id: r.id }}
                        >
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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

      {tab === "accounts" && (
        <section className="mt-3 space-y-3 pb-8">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">Set temporary password</p>
              <p className="text-xs text-[var(--color-fg-muted)]">
                For riders/drivers who forgot password or never finished signup.
                Tell them the temp password; they sign in and can change it later.
              </p>
              <div>
                <Label htmlFor="re">Email</Label>
                <Input
                  id="re"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="member@email.com"
                />
              </div>
              <div>
                <Label htmlFor="rp">New temporary password</Label>
                <Input
                  id="rp"
                  type="text"
                  value={resetPass}
                  onChange={(e) => setResetPass(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  void (async () => {
                    try {
                      await founderResetPasswordFn({
                        data: {
                          pin,
                          email: resetEmail,
                          newPassword: resetPass,
                        },
                      });
                      toast.success("Password set — tell them securely");
                      setResetPass("");
                    } catch (e) {
                      toast.error(
                        e instanceof Error ? e.message : "Reset failed",
                      );
                    }
                  })();
                }}
              >
                Set password
              </Button>
            </CardContent>
          </Card>
          <p className="text-xs text-[var(--color-fg-muted)]">
            {authUsers.length} account{authUsers.length === 1 ? "" : "s"} in
            database
          </p>
          {authUsers.length === 0 ? (
            <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-fg-muted)]">
              No accounts yet — people who hit “Invalid origin” never saved.
              Have them Create account again after the origin fix.
            </p>
          ) : (
            authUsers.map((u) => (
              <Card key={u.id}>
                <CardContent className="flex items-start justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{u.name || "—"}</p>
                    <p className="truncate text-sm text-[var(--color-fg-muted)]">
                      {u.email}
                    </p>
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      {new Date(u.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setResetEmail(u.email)}
                  >
                    Reset
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      )}
    </AppShell>
  );
}

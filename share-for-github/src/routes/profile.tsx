import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  Star,
  Car,
  BadgeCheck,
  MapPin,
  ChevronRight,
  Video,
  Boxes,
  Package,
  MessageCircle,
  DollarSign,
  CreditCard,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { PhotoField } from "@/components/share/photo-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import { useShareStore } from "@/lib/share/store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut, authEnabled } from "@/lib/auth/client";
import { isDemoMode } from "@/lib/share/mode";
import { statusLabel, useMyAppStatus } from "@/lib/share/use-my-apps";
import { INTERVIEW_LABELS, PILOT_INVITE_CODES, VEHICLE_TYPES } from "@/lib/share/data";
import { updateMyProfileSelfieFn, lookupVipFn } from "@/lib/share/server-fns";
import { formatCurrency } from "@/lib/utils";
import {
  pullMyVehiclesFromCloud,
  pushMyVehiclesToCloud,
} from "@/lib/share/sync-vehicles";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const riderName = useShareStore((s) => s.riderName);
  const profileSelfie = useShareStore((s) => s.profileSelfie);
  const setProfileSelfie = useShareStore((s) => s.setProfileSelfie);
  const myVehicles = useShareStore((s) => s.myVehicles);
  const addVehicle = useShareStore((s) => s.addVehicle);
  const removeVehicle = useShareStore((s) => s.removeVehicle);
  const setDefaultVehicle = useShareStore((s) => s.setDefaultVehicle);
  const setRiderName = useShareStore((s) => s.setRiderName);
  const isDriverApproved = useShareStore((s) => s.isDriverApproved);
  const applyAsDriver = useShareStore((s) => s.applyAsDriver);
  const bookings = useShareStore((s) => s.bookings);
  const driverApps = useShareStore((s) => s.driverApps);
  const riderApps = useShareStore((s) => s.riderApps);
  const localRides = useShareStore((s) => s.localRides);
  const waitlistEmails = useShareStore((s) => s.waitlistEmails);
  const savedPlaces = useShareStore((s) => s.savedPlaces);
  const addSavedPlace = useShareStore((s) => s.addSavedPlace);
  const removeSavedPlace = useShareStore((s) => s.removeSavedPlace);
  const inviteCodeUsed = useShareStore((s) => s.inviteCodeUsed);
  const redeemInvite = useShareStore((s) => s.redeemInvite);
  const referralCode = useShareStore((s) => s.referralCode);
  const notifications = useShareStore((s) => s.notifications);
  const resetDemo = useShareStore((s) => s.resetDemo);
  const [name, setName] = useState(riderName);
  const [newVehLabel, setNewVehLabel] = useState("");
  const [newVehType, setNewVehType] = useState("SUV / Crossover");
  const [newVehPhoto, setNewVehPhoto] = useState("");
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [invite, setInvite] = useState("");
  const [placeLabel, setPlaceLabel] = useState("");
  const [placeAddr, setPlaceAddr] = useState("");
  const idVerified = useShareStore((s) => s.idVerified);
  const setIdVerified = useShareStore((s) => s.setIdVerified);
  const demo = isDemoMode();
  const navigate = useNavigate();
  const founderTapRef = useRef({ n: 0, t: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function secretOpenFounder() {
    navigate({ to: "/admin" });
    toast.message("Founder inbox", { description: "Enter your PIN" });
  }

  function onFounderSecretTap() {
    const now = Date.now();
    const s = founderTapRef.current;
    if (now - s.t > 1400) s.n = 0;
    s.t = now;
    s.n += 1;
    if (s.n >= 5) {
      s.n = 0;
      secretOpenFounder();
    }
  }

  const [vipStatus, setVipStatus] = useState<{
    localPrice: number;
    fullName?: string;
  } | null>(null);

  const { user, isPending } = useCurrentUserState();
  const {
    latestDriver,
    latestRider,
    driverActive,
    riderActive,
    driverStatus,
    riderStatus,
    canApplyDriver,
    canApplyRider,
  } = useMyAppStatus();

  useEffect(() => {
    let guest = "";
    try {
      guest = localStorage.getItem("share-vol-guest-phone") || "";
    } catch {
      /* ignore */
    }
    const phone = latestRider?.phone || latestDriver?.phone || guest;
    const p = String(phone || "").replace(/\D/g, "").slice(-10);
    if (p.length < 10) {
      setVipStatus(null);
      return;
    }
    let cancelled = false;
    void lookupVipFn({ data: { phone: p } })
      .then((res) => {
        if (cancelled) return;
        if (res.vip) {
          setVipStatus({
            localPrice: res.localPrice ?? 5,
            fullName: res.fullName,
          });
        } else {
          setVipStatus(null);
        }
      })
      .catch(() => {
        if (!cancelled) setVipStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [latestRider?.phone, latestDriver?.phone]);

  // Keep display name in sync with real auth account (not email username)
  useEffect(() => {
    if (user?.displayName && user.displayName.trim()) {
      setRiderName(user.displayName.trim());
      setName(user.displayName.trim());
    }
  }, [user?.displayName, setRiderName]);

  // Garage + car photos: pull from cloud (or push this phone if cloud empty)
  useEffect(() => {
    const email = user?.primaryEmail;
    if (!email) return;
    void pullMyVehiclesFromCloud(email).then((r) => {
      if (r.ok && r.count > 0) {
        /* silent — list updates via store */
      }
    });
  }, [user?.primaryEmail]);

  const accountLabel =
    (user?.displayName && user.displayName.trim()) ||
    (riderName && riderName !== "Guest" && !riderName.includes("@")
      ? riderName
      : null) ||
    user?.primaryEmail ||
    null;

  const pending =
    driverApps.filter(
      (a) => a.status === "pending_interview" || a.status === "scheduled",
    ).length +
    riderApps.filter(
      (a) => a.status === "pending_interview" || a.status === "scheduled",
    ).length;


  return (
    <AppShell title="You" solidHeader>
      <div className="space-y-4 py-3 pb-8">
        {notifications[0] && (
          <Card className="border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5">
            <CardContent className="p-3 text-xs text-[var(--color-fg-muted)]">
              <strong className="text-[var(--color-fg)]">Alert: </strong>
              {notifications[0]}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-4">
              <div
                role="presentation"
                className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] font-display text-2xl font-semibold text-[var(--color-primary-fg)] select-none"
                onPointerDown={() => {
                  longPressTimer.current = setTimeout(() => {
                    secretOpenFounder();
                  }, 2000);
                }}
                onPointerUp={() => {
                  if (longPressTimer.current) clearTimeout(longPressTimer.current);
                }}
                onPointerLeave={() => {
                  if (longPressTimer.current) clearTimeout(longPressTimer.current);
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                {profileSelfie ? (
                  <img
                    src={profileSelfie}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  (accountLabel ?? "G").charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-semibold">
                  {isPending
                    ? "…"
                    : accountLabel ?? "Guest"}
                </p>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {user?.primaryEmail
                    ? user.primaryEmail
                    : "Sign in to save your apps and trips"}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {riderActive ? (
                    <Badge variant="success">
                      <BadgeCheck className="mr-1 size-3" />
                      Rider ACTIVE
                    </Badge>
                  ) : latestRider ? (
                    <Badge variant="secondary" className="capitalize">
                      Rider: {statusLabel(riderStatus)}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Rider not applied</Badge>
                  )}
                  {driverActive ? (
                    <Badge variant="success">
                      <BadgeCheck className="mr-1 size-3" />
                      Driver ACTIVE
                    </Badge>
                  ) : latestDriver ? (
                    <Badge variant="secondary" className="capitalize">
                      Driver: {statusLabel(driverStatus)}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Driver not applied</Badge>
                  )}
                  {inviteCodeUsed && (
                    <Badge variant="accent">Invite {inviteCodeUsed}</Badge>
                  )}
                  {vipStatus && (
                    <Badge variant="accent">
                      <Star className="mr-1 size-3" />
                      VIP · {formatCurrency(vipStatus.localPrice)} local
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {isPending && !user && (
                <Button className="flex-1" variant="secondary" disabled>
                  Checking account…
                </Button>
              )}
              {!user && !isPending && (
                <Button className="flex-1" asChild>
                  <Link to="/login">Sign in / create account</Link>
                </Button>
              )}
              {user && authEnabled && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => void signOut("/app")}
                >
                  Sign out
                </Button>
              )}
              <Button variant="secondary" className="flex-1" asChild>
                <Link to="/apply">
                  {driverActive && riderActive
                    ? "View applications"
                    : canApplyDriver || canApplyRider
                      ? "Apply rider or driver"
                      : "Application status"}
                </Link>
              </Button>
            </div>
            <PhotoField
              id="profile-selfie"
              label="Your photo"
              hint="Saved on this phone and to your Share account so every device matches."
              value={profileSelfie}
              onChange={(dataUrl) => {
                setProfileSelfie(dataUrl);
                const email = user?.primaryEmail;
                if (!email) {
                  toast.message(
                    "Photo saved on this phone — sign in to sync it everywhere",
                  );
                  return;
                }
                void updateMyProfileSelfieFn({
                  data: { email, selfie: dataUrl },
                })
                  .then(() => {
                    toast.success("Profile photo saved on all devices");
                  })
                  .catch(() => {
                    toast.message(
                      "Saved on this phone — cloud sync pending (try again on Wi‑Fi)",
                    );
                  });
              }}
              facing="user"
              kind="selfie"
            />
          </CardContent>
        </Card>

        {vipStatus && (
          <Card className="border-[var(--color-accent)]/40 bg-[var(--color-accent)]/8">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <Star className="size-5 text-[var(--color-accent)]" />
                <h2 className="font-display text-lg font-semibold">
                  You’re a Share VIP
                </h2>
              </div>
              <p className="text-sm text-[var(--color-fg-muted)]">
                Lifetime local rides at{" "}
                <strong className="text-[var(--color-fg)]">
                  {formatCurrency(vipStatus.localPrice)}
                </strong>
                . When you request a local ride, that rate is already applied.
              </p>
              <Button size="sm" asChild>
                <Link to="/local">
                  Request a {formatCurrency(vipStatus.localPrice)} local ride
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold">My vehicles</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Saved from your driver application. Pick one when you post a trip.
            </p>
            {myVehicles.length === 0 && (
              <p className="text-sm text-[var(--color-fg-subtle)]">
                No vehicles yet. Add one below or apply as a driver with your car
                photo.
              </p>
            )}
            <div className="space-y-2">
              {myVehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2"
                >
                  {v.photoUrl ? (
                    <img
                      src={v.photoUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-[var(--radius-sm)] object-cover"
                    />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)] text-xs text-[var(--color-fg-subtle)]">
                      No pic
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{v.label}</p>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      {v.vehicleType}
                      {v.licensePlate ? ` · ${v.licensePlate}` : ""}
                      {v.isDefault ? " · Default" : ""}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {!v.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={() => {
                            setDefaultVehicle(v.id);
                            void pushMyVehiclesToCloud(user?.primaryEmail).then(
                              (r) => {
                                if (r.ok) toast.success("Default car synced");
                              },
                            );
                          }}
                        >
                          Make default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`Remove ${v.label}?`)) return;
                          removeVehicle(v.id);
                          void pushMyVehiclesToCloud(user?.primaryEmail).then(
                            (r) => {
                              if (r.ok) toast.success("Garage updated in cloud");
                              else if (r.error === "sign-in-required")
                                toast.message(
                                  "Removed on this phone — sign in to sync",
                                );
                            },
                          );
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
              {!addingVehicle ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setAddingVehicle(true)}
                >
                  Add vehicle
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">New vehicle</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingVehicle(false);
                        setNewVehLabel("");
                        setNewVehPhoto("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  <PhotoField
                    id="new-veh-photo"
                    label="Car photo"
                    hint="Take a photo first — then it syncs to your Share account on every device."
                    value={newVehPhoto}
                    onChange={setNewVehPhoto}
                    facing="environment"
                    kind="vehicle"
                    captureFirst
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="new-vtype">Type</Label>
                      <Select
                        id="new-vtype"
                        value={newVehType}
                        onChange={(e) => setNewVehType(e.target.value)}
                      >
                        {VEHICLE_TYPES.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="new-vlabel">Year / make / model</Label>
                      <Input
                        id="new-vlabel"
                        value={newVehLabel}
                        onChange={(e) => setNewVehLabel(e.target.value)}
                        placeholder="2018 CR-V"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      if (!newVehLabel.trim()) {
                        toast.error("Add year / make / model");
                        return;
                      }
                      if (!newVehPhoto) {
                        toast.error("Take a car photo first");
                        return;
                      }
                      addVehicle({
                        label: newVehLabel.trim(),
                        vehicleType: newVehType,
                        photoUrl: newVehPhoto || undefined,
                        isDefault: myVehicles.length === 0,
                      });
                      setNewVehLabel("");
                      setNewVehPhoto("");
                      setAddingVehicle(false);
                      const email = user?.primaryEmail;
                      if (!email) {
                        toast.message(
                          "Saved on this phone — sign in to push the car photo everywhere",
                        );
                        return;
                      }
                      void pushMyVehiclesToCloud(email).then((r) => {
                        if (r.ok) {
                          toast.success("Vehicle + photo saved on all devices");
                        } else {
                          toast.message(
                            r.error ||
                              "Saved on this phone — cloud sync pending (retry on Wi‑Fi)",
                          );
                        }
                      });
                    }}
                  >
                    Save vehicle
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          {[
            { to: "/messages", label: "Messages", icon: MessageCircle },
            { to: "/earnings", label: "Earnings", icon: DollarSign },
            { to: "/checkout", label: "Checkout", icon: CreditCard },
            { to: "/trips", label: "My trips", icon: Car },
          ].map((x) => (
            <Link key={x.to} to={x.to}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-md)]">
                <CardContent className="flex items-center gap-2 p-3">
                  <x.icon className="size-4 text-[var(--color-primary)]" />
                  <span className="text-sm font-semibold">{x.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Ticket className="size-5 text-[var(--color-primary)]" />
              <h2 className="font-display text-lg font-semibold">
                Pilot invite code
              </h2>
            </div>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Soft-open codes for your FB group:{" "}
              {PILOT_INVITE_CODES.join(", ")}
            </p>
            <div className="flex gap-2">
              <Input
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                placeholder="HUBCITY"
                className="uppercase"
              />
              <Button
                onClick={() => {
                  if (redeemInvite(invite)) toast.success("Invite accepted");
                  else toast.error("Invalid code");
                }}
              >
                Redeem
              </Button>
            </div>
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Your driver referral code: <strong>{referralCode}</strong>
            </p>
          </CardContent>
        </Card>

        
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold">ID verification</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Required before car rentals in pilot. Emergency contact is collected
              when you create your account (for SOS).
            </p>
            <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm">
              <span>ID verification</span>
              <Badge variant={idVerified ? "success" : "outline"}>
                {idVerified ? "Verified" : "Not verified"}
              </Badge>
            </div>
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Drivers upload license (front & back) + insurance on the driver
              application. Founder marks verified after review — this is separate
              from your rider/driver application status.
            </p>
            {demo && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-primary)]"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                />
                Demo only: mark ID verified
              </label>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-[var(--color-primary)]" />
              <h2 className="font-display text-lg font-semibold">
                Saved places
              </h2>
            </div>
            <ul className="space-y-2">
              {savedPlaces.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      {p.address}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSavedPlace(p.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <div className="grid gap-2">
              <Input
                placeholder="Label (Home, VA, Shop…)"
                value={placeLabel}
                onChange={(e) => setPlaceLabel(e.target.value)}
              />
              <Input
                placeholder="Address"
                value={placeAddr}
                onChange={(e) => setPlaceAddr(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  addSavedPlace(placeLabel, placeAddr);
                  setPlaceLabel("");
                  setPlaceAddr("");
                  toast.success("Place saved");
                }}
              >
                Add place
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold">Display name</h2>
            <div>
              <Label htmlFor="name">How the community sees you</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                if (!name.trim()) return;
                setRiderName(name.trim());
                toast.success("Name updated");
              }}
            >
              Save name
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-display text-lg font-semibold">
              Trust & safety
            </h2>
            <ul className="mt-3 space-y-3 text-sm text-[var(--color-fg-muted)]">
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                Interview every rider and driver.
              </li>
              <li className="flex gap-2">
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                In-app chat is logged if something goes wrong.
              </li>
              <li className="flex gap-2">
                <Video className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                Dashcam badge when drivers record road/cabin.
              </li>
              <li className="flex gap-2">
                <Star className="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" />
                Low platform take so drivers keep more than Uber.
              </li>
            </ul>
            {demo && !isDriverApproved && !latestDriver && (
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => {
                  applyAsDriver();
                  toast.success("Demo driver unlock");
                }}
              >
                Demo: unlock driver posting
              </Button>
            )}
          </CardContent>
        </Card>

        {[
          {
            to: "/share-stuff",
            title: "Lagniappe",
            sub: "Tools, bikes, trailers, grills",
            icon: Boxes,
          },
          {
            to: "/deliveries",
            title: "Deliveries",
            sub: "Tracked packages & shop parts",
            icon: Package,
          },
          {
            to: "/volunteer",
            title: "Volunteer rides",
            sub: "Elders · veterans · medical · hardship",
            icon: Star,
          },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-4 transition-colors hover:bg-[var(--color-bg-subtle)]"
          >
            <div className="flex items-center gap-3">
              <link.icon className="size-5 text-[var(--color-primary)]" />
              <div>
                <p className="font-semibold">{link.title}</p>
                <p className="text-sm text-[var(--color-fg-muted)]">{link.sub}</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-[var(--color-fg-subtle)]" />
          </Link>
        ))}

        <div className="flex flex-col items-center gap-2 py-6">
          <div className="flex gap-4 text-xs text-[var(--color-fg-subtle)]">
            <Link to="/privacy" className="underline-offset-2 hover:underline">
              Privacy
            </Link>
            <Link to="/terms" className="underline-offset-2 hover:underline">
              Terms
            </Link>
          </div>
          {/* Hidden ops: 5 taps, or hold avatar 2s, or open /admin */}
          <p
            className="select-none text-[10px] tracking-wide text-[var(--color-fg-subtle)]/50"
            onClick={onFounderSecretTap}
          >
            Share
          </p>
          {demo && (
            <button
              type="button"
              className="text-xs text-[#b42318] underline"
              onClick={() => {
                if (confirm("Reset demo data?")) resetDemo();
              }}
            >
              Reset demo
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

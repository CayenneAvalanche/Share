import { createFileRoute, Link } from "@tanstack/react-router";
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
  Inbox,
  MessageCircle,
  DollarSign,
  CreditCard,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { useShareStore } from "@/lib/share/store";
import { INTERVIEW_LABELS, PILOT_INVITE_CODES } from "@/lib/share/data";
import { SHARE_DOMAIN } from "@/lib/share/tracking";
import { useState } from "react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const riderName = useShareStore((s) => s.riderName);
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
  const [invite, setInvite] = useState("");
  const [placeLabel, setPlaceLabel] = useState("");
  const [placeAddr, setPlaceAddr] = useState("");
  const emergencyContactName = useShareStore((s) => s.emergencyContactName);
  const emergencyContactPhone = useShareStore((s) => s.emergencyContactPhone);
  const setEmergencyContact = useShareStore((s) => s.setEmergencyContact);
  const idVerified = useShareStore((s) => s.idVerified);
  const setIdVerified = useShareStore((s) => s.setIdVerified);
  const [ecName, setEcName] = useState(emergencyContactName);
  const [ecPhone, setEcPhone] = useState(emergencyContactPhone);

  const latestDriver = driverApps[0];
  const latestRider = riderApps[0];
  const pending =
    driverApps.filter(
      (a) => a.status === "pending_interview" || a.status === "scheduled",
    ).length +
    riderApps.filter(
      (a) => a.status === "pending_interview" || a.status === "scheduled",
    ).length;

  return (
    <AppShell title="You" subtitle="Trust, places & pilot tools" solidHeader>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link to="/demo">Demo guide</Link>
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link to="/privacy">Privacy</Link>
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link to="/terms">Terms</Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-[#b42318]/40 text-[#b42318]"
          onClick={() => {
            if (confirm("Reset demo data? Bookings, accepts, and apps you added will clear. Seed data comes back.")) {
              resetDemo();
            }
          }}
        >
          Reset demo
        </Button>
      </div>

      <div className="space-y-4 py-3 pb-8">
        {notifications[0] && (
          <Card className="border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5">
            <CardContent className="p-3 text-xs text-[var(--color-fg-muted)]">
              <strong className="text-[var(--color-fg)]">Alert: </strong>
              {notifications[0]}
            </CardContent>
          </Card>
        )}

        <Link to="/admin" className="block">
          <Card className="border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8 transition-shadow hover:shadow-[var(--shadow-md)]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
                <Inbox className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--color-primary)]">
                  Founder admin inbox
                </p>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {pending} apps need review · PIN: share
                </p>
              </div>
              <ChevronRight className="size-5 text-[var(--color-primary)]" />
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] font-display text-2xl font-semibold text-[var(--color-primary-fg)]">
              {riderName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-semibold">{riderName}</p>
              <p className="text-sm text-[var(--color-fg-muted)]">
                {SHARE_DOMAIN} · pilot
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {latestRider ? (
                  <Badge variant="secondary" className="capitalize">
                    Rider: {latestRider.status.replace("_", " ")}
                  </Badge>
                ) : (
                  <Badge variant="outline">Rider not applied</Badge>
                )}
                {latestDriver ? (
                  <Badge variant="default" className="capitalize">
                    Driver: {latestDriver.status.replace("_", " ")}
                  </Badge>
                ) : isDriverApproved ? (
                  <Badge variant="success">
                    <BadgeCheck className="mr-1 size-3" />
                    Driver approved
                  </Badge>
                ) : (
                  <Badge variant="outline">Driver not applied</Badge>
                )}
                {inviteCodeUsed && (
                  <Badge variant="accent">Invite {inviteCodeUsed}</Badge>
                )}
              </div>
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
            <h2 className="font-display text-lg font-semibold">Safety & ID</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">
              Emergency contact for SOS. ID verify required before car rentals in pilot.
            </p>
            <div className="grid gap-2">
              <Input
                placeholder="Emergency contact name"
                value={ecName}
                onChange={(e) => setEcName(e.target.value)}
              />
              <Input
                placeholder="Their phone"
                value={ecPhone}
                onChange={(e) => setEcPhone(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setEmergencyContact(ecName, ecPhone);
                  toast.success("Emergency contact saved");
                }}
              >
                Save emergency contact
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-primary)]"
                checked={idVerified}
                onChange={(e) => setIdVerified(e.target.checked)}
              />
              Demo: mark ID verified (license selfie checked)
            </label>
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Docs (license, insurance, reg) reviewed in interview — list them on driver apply.
            </p>
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
            {!isDriverApproved && !latestDriver && (
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
            sub: "Veterans · disabled · elders",
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
      </div>
    </AppShell>
  );
}
